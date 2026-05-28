import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CapabilityRouter,
  createCliExecutor,
  createExtensionExecutor,
  createFilesystemExecutor,
  loadRegistries,
  resetRegistryCache,
  type RunCommandFn,
} from "@bridge/cursor-adapter";
import { CURSOR_API_SPEC } from "@bridge/shared";
import {
  appendAuditEntry,
  auditEntryContainsSensitivePlaintext,
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
import { resetExtensionClientForTests } from "../src/cursor/extension-client";

const TEST_ROOT = path.join(os.tmpdir(), "bridge-api-cursor-test");

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
): Promise<{ handled: boolean; status: number; body: Record<string, unknown> }> {
  const req = mockRequest(method, pathname);
  const res = new MockResponse();
  const readBody = async () => (body !== undefined ? JSON.stringify(body) : "");
  const json = (_res: ServerResponse, status: number, payload: unknown) => {
    res.statusCode = status;
    res.body = payload;
  };
  const handled = await handleCursorApi(req, res, pathname, json, readBody);
  return { handled, status: res.statusCode, body: res.body as Record<string, unknown> };
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

describe("Step 7 — route mapping", () => {
  it("maps all 10 P0 action routes", () => {
    const routes = listCursorActionRoutes();
    expect(routes).toHaveLength(10);
    expect(routes.map((r) => r.actionId).sort()).toEqual(
      [
        "cursor.agent.prompt.send",
        "cursor.ide.command.execute",
        "cursor.ide.extension.install",
        "cursor.ide.fs.mkdir",
        "cursor.ide.fs.write",
        "cursor.ide.settings.get",
        "cursor.ide.settings.set",
        "cursor.ide.status.get",
        "cursor.ide.terminal.run",
        "cursor.ide.workspace.open",
      ].sort()
    );
    expect(routes.find((r) => r.actionId === "cursor.ide.status.get")?.method).toBe("GET");
    expect(routes.find((r) => r.actionId === "cursor.agent.prompt.send")?.path).toBe(
      `${CURSOR_API_SPEC}/agent/prompt`
    );
  });
});

describe("Step 7 — meta endpoints", () => {
  it("registry returns P0.1a rollback matrix", async () => {
    const r = await callCursorApi("GET", `${CURSOR_API_SPEC}/registry`);
    expect(r.status).toBe(200);
    expect(r.body.rollbackAvailable).toBe(true);
    const byId = Object.fromEntries(
      (r.body.actions as Array<{ actionId: string; rollbackAvailable: boolean }>).map((a) => [
        a.actionId,
        a.rollbackAvailable,
      ])
    );
    expect(byId["cursor.ide.settings.set"]).toBe(true);
    expect(byId["cursor.ide.fs.write"]).toBe(true);
    expect(byId["cursor.ide.workspace.open"]).toBe(false);
  });

  it("ui-modules returns P2 registry metadata without doc paths", async () => {
    const r = await callCursorApi("GET", `${CURSOR_API_SPEC}/ui-modules`);
    expect(r.status).toBe(200);
    expect(r.body.registryVersion).toBe("poc-v1.3.0");
    expect(r.body.designrulesStatus).toBe("consumer-ready");
    expect(r.body).not.toHaveProperty("linkedCatalog");
    expect(r.body).not.toHaveProperty("linkedCrosswalk");
    expect(r.body.modules).toHaveLength(18);
    expect(r.body.viewComposition).toMatchObject({
      moduleOrder: expect.any(Array),
      crossCuttingModules: expect.any(Array),
    });
    expect((r.body.viewComposition as { moduleOrder: unknown[] }).moduleOrder).toHaveLength(15);
    expect((r.body.viewComposition as { crossCuttingModules: unknown[] }).crossCuttingModules).toHaveLength(3);
    for (const mod of r.body.modules as Array<Record<string, unknown>>) {
      expect(mod).not.toHaveProperty("linkedCatalog");
      expect(mod).not.toHaveProperty("linkedCrosswalk");
    }
  });

  it("version returns snapshotRestoreAvailable=true", async () => {
    configureCursorHandlerDeps({
      getExtensionHealth: async () => ({
        ok: true,
        extensionVersion: "2.2.0",
        cursorVersion: "2.3.0",
        pid: 1,
        port: 3848,
      }),
    });
    const r = await callCursorApi("GET", `${CURSOR_API_SPEC}/version`);
    expect(r.status).toBe(200);
    expect(r.body.snapshotRestoreAvailable).toBe(true);
    expect(r.body.rollbackAvailable).toBe(true);
  });
});

describe("Step 7 — security gate before router", () => {
  it("blocks extension.install without confirmed:true", async () => {
    const executeSpy = vi.fn();
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

    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/ide/extension/install`, {
      extensionId: "dbaeumer.vscode-eslint",
    });

    expect(r.status).toBe(428);
    expect(r.body.code).toBe("CONFIRMATION_REQUIRED");
    expect(executeSpy).not.toHaveBeenCalled();

    const audit = listAuditEntries(1)[0];
    expect(audit?.result).toBe("blocked");
    expect(audit?.riskClass).toBe("external-code");
  });

  it("blocks terminal.run for non-whitelisted commands", async () => {
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

  it("blocks command.execute for unknown commands", async () => {
    const executeSpy = vi.fn();
    configureCursorHandlerDeps({
      getRouter: () => ({ execute: executeSpy }) as unknown as CapabilityRouter,
    });

    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/ide/command/execute`, {
      commandId: "workbench.action.deleteAll",
      confirmed: true,
    });

    expect(r.status).toBe(403);
    expect(r.body.code).toBe("ALLOWLIST_VIOLATION");
    expect(executeSpy).not.toHaveBeenCalled();
  });
});

describe("Step 7 — audit service", () => {
  it("logs success, failure, and blocked without sensitive plaintext", () => {
    appendAuditEntry({
      actionId: "cursor.agent.prompt.send",
      clientId: "bridge-default",
      params: { prompt: "top-secret-prompt", confirmed: true },
      result: "success",
      methodUsed: "cli",
      durationMs: 12,
      riskClass: "destructive",
    });
    appendAuditEntry({
      actionId: "cursor.ide.fs.write",
      clientId: "bridge-default",
      params: { path: path.join(TEST_ROOT, "a.txt"), content: "file-body-secret" },
      result: "failure",
      durationMs: 8,
      errorCode: "METHOD_BLOCKED",
    });
    appendAuditEntry({
      actionId: "cursor.ide.terminal.run",
      clientId: "bridge-default",
      params: { command: "npm run build", confirmed: true },
      result: "blocked",
      durationMs: 3,
      errorCode: "CONFIRMATION_REQUIRED",
    });

    const entries = listAuditEntries(10);
    expect(entries.map((e) => e.result).sort()).toEqual(["blocked", "failure", "success"]);
    for (const entry of entries) {
      expect(entry.rollbackAvailable).toBe(true);
      expect(entry.paramsHash).toMatch(/^[a-f0-9]{64}$/);
      expect(auditEntryContainsSensitivePlaintext(entry)).toBe(false);
      expect(JSON.stringify(entry)).not.toContain("top-secret-prompt");
      expect(JSON.stringify(entry)).not.toContain("file-body-secret");
      expect(JSON.stringify(entry)).not.toContain("npm run build");
    }
  });

  it("persists append-only JSONL in user config audit dir", () => {
    appendAuditEntry({
      actionId: "cursor.ide.settings.set",
      clientId: "bridge-default",
      params: { section: "editor", key: "tabSize", value: 4, confirmed: true },
      result: "success",
      methodUsed: "extension-api",
      durationMs: 5,
      riskClass: "read",
    });

    const auditFile = path.join(TEST_ROOT, ".bridge", "audit", "cursor-actions.jsonl");
    expect(fs.existsSync(auditFile)).toBe(true);
    const line = fs.readFileSync(auditFile, "utf8").trim();
    const parsed = JSON.parse(line) as Record<string, unknown>;
    expect(parsed.methodUsed).toBe("extension-api");
    expect(parsed).not.toHaveProperty("value");
  });
});

describe("Step 7 — handler execution + audit", () => {
  it("writes success audit with methodUsed from router", async () => {
    configureCursorHandlerDeps({
      getRouter: () =>
        ({
          execute: async () => ({
            ok: true,
            actionId: "cursor.ide.status.get",
            methodUsed: "extension-api",
            data: { cursor: { running: true } },
            auditHints: { paramsHash: "x", result: "success" },
          }),
        }) as unknown as CapabilityRouter,
      getExtensionHealth: async () => ({
        ok: true,
        extensionVersion: "2.2.0",
        cursorVersion: "2.3.0",
        pid: 1,
        port: 3848,
      }),
    });

    const r = await callCursorApi("GET", `${CURSOR_API_SPEC}/ide/status`);
    expect(r.status).toBe(200);
    expect(r.body.methodUsed).toBe("extension-api");

    const audit = listAuditEntries(1)[0];
    expect(audit?.result).toBe("success");
    expect(audit?.methodUsed).toBe("extension-api");
  });

  it("writes failure audit with router error code", async () => {
    configureCursorHandlerDeps({
      getRouter: () =>
        ({
          execute: async () => ({
            ok: false,
            actionId: "cursor.ide.terminal.run",
            methodUsed: "extension-api",
            error: "Extension unreachable and no fallback available",
            code: "EXTENSION_UNREACHABLE",
            auditHints: { paramsHash: "x", result: "failure" },
          }),
        }) as unknown as CapabilityRouter,
      getExtensionHealth: async () => ({
        ok: true,
        extensionVersion: "2.2.0",
        cursorVersion: "2.3.0",
        pid: 1,
        port: 3848,
      }),
    });

    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/ide/terminal/run`, {
      command: "npm run build",
      confirmed: true,
    });

    expect(r.status).toBe(503);
    expect(r.body.code).toBe("EXTENSION_UNREACHABLE");
    expect(listAuditEntries(1)[0]?.result).toBe("failure");
    expect(listAuditEntries(1)[0]?.errorCode).toBe("EXTENSION_UNREACHABLE");
  });
});

describe("Step 7 — extension offline routing via API", () => {
  it("falls back to CLI for status.get when extension offline", async () => {
    const runCommand: RunCommandFn = async (bin, args) => {
      if (bin === "cursor" && args[0] === "--version") {
        return { stdout: "2.3.0\n", code: 0 };
      }
      return { stdout: "Cursor.exe", code: 0 };
    };

    const router = new CapabilityRouter({
      extensionClient: {
        isReachable: async () => false,
        getHealth: async () => ({}),
        execute: async () => ({ ok: false, error: "offline" }),
      },
      cwd: TEST_ROOT,
      executors: [
        createExtensionExecutor({
          isReachable: async () => false,
          getHealth: async () => ({}),
          execute: async () => ({ ok: false, error: "offline" }),
        }),
        createCliExecutor({ runCommand }),
        createFilesystemExecutor(),
      ],
    });

    configureCursorHandlerDeps({
      getRouter: () => router,
      getExtensionHealth: async () => {
        throw new Error("offline");
      },
    });

    const r = await callCursorApi("GET", `${CURSOR_API_SPEC}/ide/status`);
    expect(r.status).toBe(200);
    expect(r.body.methodUsed).toBe("cli");
    expect(listAuditEntries(1)[0]?.result).toBe("success");
  });

  it("blocks terminal.run when extension offline (no fallback)", async () => {
    const router = new CapabilityRouter({
      extensionClient: {
        isReachable: async () => false,
        getHealth: async () => ({}),
        execute: async () => ({ ok: false }),
      },
      cwd: TEST_ROOT,
    });

    configureCursorHandlerDeps({
      getRouter: () => router,
      getExtensionHealth: async () => {
        throw new Error("offline");
      },
    });

    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/ide/terminal/run`, {
      command: "npm run build",
      confirmed: true,
    });

    expect(r.status).toBe(503);
    expect(r.body.code).toBe("EXTENSION_UNREACHABLE");
    expect(listAuditEntries(1)[0]?.result).toBe("failure");
  });
});

describe("Step 7 — snapshot restore (P0.1a)", () => {
  it("returns 404 for unknown snapshot", async () => {
    const r = await callCursorApi("POST", `${CURSOR_API_SPEC}/snapshots/missing-id/restore`, {
      confirmed: true,
    });
    expect(r.status).toBe(404);
    expect(r.body.code).toBe("SNAPSHOT_NOT_FOUND");
  });
});
