import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CapabilityRouter,
  createSnapshot,
  loadRegistries,
  resetRegistryCache,
} from "@bridge/cursor-adapter";
import { CURSOR_API_SPEC, P0_ACTION_IDS, type CursorActionId } from "@bridge/shared";
import {
  clearAuditFileForTests,
  clearAuditRing,
  listAuditEntries,
} from "../src/cursor/audit-service";
import {
  configureCursorHandlerDeps,
  handleCursorApi,
  listCursorActionRoutes,
  resetCursorHandlerDeps,
} from "../src/cursor/handler";
import * as extensionClient from "../src/cursor/extension-client";
import { resetExtensionClientForTests } from "../src/cursor/extension-client";

const TEST_ROOT = path.join(os.tmpdir(), "bridge-p0-pipeline");

class MockResponse extends EventEmitter {
  statusCode = 0;
  body: unknown;
  writeHead(status: number): void {
    this.statusCode = status;
  }
  end(data?: string): void {
    this.body = data ? JSON.parse(data) : undefined;
  }
}

function mockRequest(method: string, url: string): IncomingMessage {
  const req = new EventEmitter() as IncomingMessage;
  req.method = method;
  req.url = url;
  req.headers = { "x-bridge-client-id": "bridge-default" };
  return req;
}

async function callCursorApi(
  method: string,
  pathname: string,
  body?: Record<string, unknown>
): Promise<{ status: number; body: Record<string, unknown> }> {
  const req = mockRequest(method, pathname);
  const res = new MockResponse();
  const readBody = async () => (body !== undefined ? JSON.stringify(body) : "");
  const json = (_res: ServerResponse, status: number, payload: unknown) => {
    res.statusCode = status;
    res.body = payload;
  };
  await handleCursorApi(req, res, pathname, json, readBody);
  return { status: res.statusCode, body: res.body as Record<string, unknown> };
}

function fixtureFor(actionId: CursorActionId): {
  method: "GET" | "POST";
  path: string;
  body?: Record<string, unknown>;
} {
  const route = listCursorActionRoutes().find((r) => r.actionId === actionId)!;
  const filePath = path.join(TEST_ROOT, `${actionId.replace(/\./g, "-")}.txt`);

  switch (actionId) {
    case "cursor.ide.status.get":
      return { method: "GET", path: route.path };
    case "cursor.ide.workspace.open":
      return {
        method: "POST",
        path: route.path,
        body: { path: path.join(TEST_ROOT, "proj"), confirmed: true },
      };
    case "cursor.ide.fs.mkdir":
      return { method: "POST", path: route.path, body: { path: path.join(TEST_ROOT, "dir") } };
    case "cursor.ide.fs.write":
      return {
        method: "POST",
        path: route.path,
        body: { path: filePath, content: "p0-test" },
      };
    case "cursor.ide.settings.get":
      return {
        method: "POST",
        path: route.path,
        body: { section: "editor", key: "tabSize" },
      };
    case "cursor.ide.settings.set":
      return {
        method: "POST",
        path: route.path,
        body: { section: "editor", key: "tabSize", value: 2, confirmed: true },
      };
    case "cursor.ide.extension.install":
      return {
        method: "POST",
        path: route.path,
        body: { extensionId: "dbaeumer.vscode-eslint", confirmed: true },
      };
    case "cursor.ide.terminal.run":
      return {
        method: "POST",
        path: route.path,
        body: { command: "git status", confirmed: true },
      };
    case "cursor.ide.command.execute":
      return {
        method: "POST",
        path: route.path,
        body: { commandId: "workbench.view.explorer", confirmed: true },
      };
    case "cursor.agent.prompt.send":
      return {
        method: "POST",
        path: route.path,
        body: { prompt: "p0 pipeline test", confirmed: true },
      };
    default: {
      const _exhaustive: never = actionId;
      throw new Error(`Missing fixture: ${_exhaustive}`);
    }
  }
}

beforeEach(() => {
  resetRegistryCache();
  resetCursorHandlerDeps();
  resetExtensionClientForTests();
  clearAuditRing();
  clearAuditFileForTests();
  process.env.BRIDGE_USER_CONFIG_DIR = TEST_ROOT;
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = path.join(
    __dirname,
    "..",
    "..",
    "adapters",
    "cursor",
    "registry"
  );
  process.env.BRIDGE_ALLOWED_PATHS = TEST_ROOT;
  fs.mkdirSync(TEST_ROOT, { recursive: true });
  loadRegistries();
});

afterEach(() => {
  fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  delete process.env.BRIDGE_USER_CONFIG_DIR;
  delete process.env.BRIDGE_CURSOR_REGISTRY_DIR;
  delete process.env.BRIDGE_ALLOWED_PATHS;
  vi.restoreAllMocks();
});

describe("Step 8 — API pipeline (Gate → Router → Audit)", () => {
  it("covers all 10 action routes", () => {
    expect(listCursorActionRoutes()).toHaveLength(10);
    for (const id of P0_ACTION_IDS) {
      expect(listCursorActionRoutes().some((r) => r.actionId === id)).toBe(true);
    }
  });

  it.each(P0_ACTION_IDS as unknown as CursorActionId[])(
    "runs full pipeline for %s",
    async (actionId) => {
      const executeSpy = vi.fn(async () => ({
        ok: true,
        actionId,
        methodUsed: actionId === "cursor.agent.prompt.send" ? "cli" : "extension-api",
        data: { pipeline: true },
        auditHints: { paramsHash: "abc", result: "success" as const },
      }));

      configureCursorHandlerDeps({
        getRouter: () => ({ execute: executeSpy }) as unknown as CapabilityRouter,
        getExtensionHealth: async () => ({
          ok: true,
          extensionVersion: "2.2.0",
          cursorVersion: "2.3.0",
          pid: 1,
          port: 3848,
        }),
      });

      const fx = fixtureFor(actionId);
      const r = await callCursorApi(fx.method, fx.path, fx.body);

      expect(r.status).toBe(200);
      expect(r.body.ok).toBe(true);
      expect(r.body.actionId).toBe(actionId);
      if (actionId === "cursor.ide.settings.set" || actionId === "cursor.ide.fs.write") {
        expect(r.body.rollbackAvailable).toBe(true);
      } else {
        expect(r.body.rollbackAvailable).toBe(false);
      }
      expect(r.body.methodUsed).toBeTruthy();
      expect(executeSpy).toHaveBeenCalledOnce();

      const audit = listAuditEntries(1)[0];
      expect(audit?.actionId).toBe(actionId);
      expect(audit?.result).toBe("success");
      expect(audit?.methodUsed).toBeTruthy();
      expect(audit?.rollbackAvailable).toBe(true);
      expect(JSON.stringify(audit)).not.toContain("p0 pipeline test");
    }
  );

  it("executes Security Gate before Router for blocked requests", async () => {
    const executeSpy = vi.fn();
    configureCursorHandlerDeps({
      getRouter: () => ({ execute: executeSpy }) as unknown as CapabilityRouter,
    });

    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/ide/terminal/run`, {
      command: "npm install",
      confirmed: true,
    });

    expect(r.status).toBe(403);
    expect(r.body.code).toBe("ALLOWLIST_VIOLATION");
    expect(executeSpy).not.toHaveBeenCalled();
    expect(listAuditEntries(1)[0]?.result).toBe("blocked");
  });

  it("restore route returns 404 for unknown snapshot", async () => {
    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/snapshots/unknown-id/restore`, {
      confirmed: true,
    });
    expect(r.status).toBe(404);
    expect(r.body.code).toBe("SNAPSHOT_NOT_FOUND");
  });

  it("restore route returns 428 without confirmed", async () => {
    const snap = createSnapshot("cursor.ide.settings.set", {
      section: "editor",
      key: "tabSize",
      previous: 4,
      target: "workspace",
    });
    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/snapshots/${snap.snapshotId}/restore`);
    expect(r.status).toBe(428);
    expect(r.body.code).toBe("CONFIRMATION_REQUIRED");
  });

  it("restore settings snapshot returns 200 with mock extension", async () => {
    vi.spyOn(extensionClient, "isExtensionReachable").mockResolvedValue(true);
    vi.spyOn(extensionClient, "restoreViaExtension").mockResolvedValue({ ok: true });

    const snap = createSnapshot("cursor.ide.settings.set", {
      section: "editor",
      key: "tabSize",
      previous: 4,
      target: "workspace",
    });

    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/snapshots/${snap.snapshotId}/restore`, {
      confirmed: true,
    });

    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.snapshotId).toBe(snap.snapshotId);
    expect(extensionClient.restoreViaExtension).toHaveBeenCalled();
  });
});
