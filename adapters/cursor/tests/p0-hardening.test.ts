import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { P0_ACTION_IDS, P0_ROLLBACK_AVAILABLE } from "@bridge/shared";
import {
  hashRedactedParams,
  redactParamsForAudit,
} from "../src/audit/redact-params";
import {
  getAction,
  getRegistryVersion,
  listActions,
  loadRegistries,
  resetRegistryCache,
} from "../src/registry/load-registry";
import { buildRegistryResponse } from "../src/index";
import { CapabilityRouter } from "../src/router/capability-router";
import { createCliExecutor, type RunCommandFn } from "../src/router/executors/cli";
import { createExtensionExecutor } from "../src/router/executors/extension";
import { createFilesystemExecutor } from "../src/router/executors/filesystem";
import { evaluateSecurityGate } from "../src/security/security-gate";
import { isPathAllowed } from "../src/security/path-allowlist";
import { isCommandAllowed, listAllowedCommandIds } from "../src/security/command-allowlist";
import {
  isTerminalCommandAllowed,
  listAllowedTerminalCommands,
} from "../src/security/terminal-whitelist";
import { assertTokenPathsOutsideProject } from "../src/security/ipc-token-store";
import {
  assertHandshakePathOutsideProject,
  validateHandshakeContent,
} from "../src/security/handshake";
import { createSnapshot } from "../src/snapshots/snapshot-service";
import { restoreBySnapshot } from "../src/snapshots/restore-service";

const REGISTRY = path.join(__dirname, "..", "registry");
const TEST_ROOT = path.join(os.tmpdir(), "bridge-p0-hardening");
const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");

const TERMINAL_ALLOWED = [
  "npm run build",
  "npm test",
  "npm run test",
  "git status",
  "git diff",
  "git log",
] as const;

const TERMINAL_BLOCKED = [
  "npm install",
  "node -e console.log(1)",
  "npx eslint",
  "rm -rf /",
  "del /f /q C:\\temp",
  "powershell -Command Get-Process",
] as const;

beforeEach(() => {
  resetRegistryCache();
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = REGISTRY;
  process.env.BRIDGE_ALLOWED_PATHS = TEST_ROOT;
  fs.mkdirSync(TEST_ROOT, { recursive: true });
  loadRegistries();
});

afterEach(() => {
  delete process.env.BRIDGE_ALLOWED_PATHS;
  fs.rmSync(TEST_ROOT, { recursive: true, force: true });
});

describe("Step 8 — Registry", () => {
  it("loads all 10 P0 actions with P0.1a rollback matrix", () => {
    expect(listActions()).toHaveLength(10);
    for (const id of P0_ACTION_IDS) {
      expect(getAction(id)).toBeDefined();
    }
    const reg = buildRegistryResponse();
    expect(reg.rollbackAvailable).toBe(true);
    expect(P0_ROLLBACK_AVAILABLE).toBe(true);
    expect(getRegistryVersion()).toBe("poc-v1.2.0");
    const byId = Object.fromEntries(reg.actions.map((a) => [a.actionId, a.rollbackAvailable]));
    expect(byId["cursor.ide.settings.set"]).toBe(true);
    expect(byId["cursor.ide.fs.write"]).toBe(true);
    expect(byId["cursor.ide.workspace.open"]).toBe(false);
    expect(byId["cursor.ide.fs.mkdir"]).toBe(false);
    expect(byId["cursor.ide.extension.install"]).toBe(false);
  });
});

describe("Step 8 — Security Gate matrix", () => {
  it("blocks unknown actions", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.fs.delete",
      params: {},
      clientId: "bridge-default",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("ACTION_UNKNOWN");
  });

  it("requires confirmed:true for destructive actions", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.workspace.open",
      params: { path: path.join(TEST_ROOT, "proj") },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("CONFIRMATION_REQUIRED");
  });

  it("externalCode extension.install always requires confirmed:true", () => {
    expect(getAction("cursor.ide.extension.install")?.externalCode).toBe(true);
    const blocked = evaluateSecurityGate({
      actionId: "cursor.ide.extension.install",
      params: { extensionId: "dbaeumer.vscode-eslint" },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(blocked.errorCode).toBe("CONFIRMATION_REQUIRED");
    expect(blocked.riskClass).toBe("external-code");

    const allowed = evaluateSecurityGate({
      actionId: "cursor.ide.extension.install",
      params: { extensionId: "dbaeumer.vscode-eslint", confirmed: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(allowed.allowed).toBe(true);
  });

  it("terminal allows only exact 6 whitelist commands", () => {
    expect(listAllowedTerminalCommands()).toEqual([...TERMINAL_ALLOWED]);
    for (const cmd of TERMINAL_ALLOWED) {
      expect(isTerminalCommandAllowed(cmd)).toBe(true);
    }
  });

  it("terminal blocks dangerous/non-whitelisted commands", () => {
    for (const cmd of TERMINAL_BLOCKED) {
      expect(isTerminalCommandAllowed(cmd)).toBe(false);
      const gate = evaluateSecurityGate({
        actionId: "cursor.ide.terminal.run",
        params: { command: cmd, confirmed: true },
        clientId: "bridge-default",
        cursorVersion: "2.3.0",
      });
      expect(gate.allowed).toBe(false);
      expect(gate.errorCode).toBe("ALLOWLIST_VIOLATION");
    }
  });

  it("command.execute allows only registry allowlist commands", () => {
    const allowed = listAllowedCommandIds();
    expect(allowed.length).toBe(7);
    for (const id of allowed) {
      expect(isCommandAllowed(id)).toBe(true);
    }
    expect(isCommandAllowed("workbench.action.deleteAll")).toBe(false);

    const gate = evaluateSecurityGate({
      actionId: "cursor.ide.command.execute",
      params: { commandId: "workbench.action.deleteAll", confirmed: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(gate.errorCode).toBe("ALLOWLIST_VIOLATION");
  });

  it("path allowlist blocks paths outside BRIDGE_ALLOWED_PATHS", () => {
    const outside = path.join(os.tmpdir(), "outside-bridge-allowlist", "file.txt");
    expect(isPathAllowed(outside)).toBe(false);
    const gate = evaluateSecurityGate({
      actionId: "cursor.ide.fs.write",
      params: { path: outside, content: "x" },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(gate.errorCode).toBe("ALLOWLIST_VIOLATION");
  });
});

describe("Step 8 — IPC token & handshake hardening", () => {
  it("ipc token and handshake paths are outside project and .cursor", () => {
    const checks = assertTokenPathsOutsideProject(PROJECT_ROOT);
    expect(checks.tokenNotInCursorDir).toBe(true);
    expect(checks.tokenOutsideProject).toBe(true);
    expect(checks.handshakeOutsideProject).toBe(true);
    expect(assertHandshakePathOutsideProject(PROJECT_ROOT)).toBe(true);
  });

  it("handshake must not contain token field", () => {
    const invalid = validateHandshakeContent({
      port: 3848,
      pid: 1,
      token: "must-not-be-here",
      tokenRef: "user-config",
    });
    expect(invalid.valid).toBe(false);

    const valid = validateHandshakeContent({
      port: 3848,
      pid: 123,
      startedAt: new Date().toISOString(),
      tokenRef: "user-config",
      extensionVersion: "2.2.0",
    });
    expect(valid.valid).toBe(true);
    expect(valid.handshake).not.toHaveProperty("token");
  });

  it("project tree does not store ipc-token under repo or .cursor", () => {
    const repoToken = path.join(PROJECT_ROOT, "ipc-token");
    const cursorToken = path.join(PROJECT_ROOT, ".cursor", "ipc-token");
    expect(fs.existsSync(repoToken)).toBe(false);
    expect(fs.existsSync(cursorToken)).toBe(false);
  });
});

describe("Step 8 — Audit redaction", () => {
  const secrets = {
    prompt: "super-secret-agent-prompt",
    content: "file-body-secret-content",
    value: { nested: "settings-secret" },
    command: "npm run build",
    path: path.join(TEST_ROOT, "deep", "secret.txt"),
    cwd: TEST_ROOT,
  };

  it("redacts sensitive params to hashes only", () => {
    const redacted = redactParamsForAudit("cursor.agent.prompt.send", secrets);
    expect(redacted).not.toHaveProperty("prompt");
    expect(redacted).not.toHaveProperty("content");
    expect(redacted).not.toHaveProperty("value");
    expect(redacted).not.toHaveProperty("command");
    expect(redacted).not.toHaveProperty("path");
    expect(redacted).not.toHaveProperty("cwd");
    expect(redacted.promptHash).toMatch(/^[a-f0-9]{64}$/);
    expect(redacted.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(redacted.valueHash).toMatch(/^[a-f0-9]{64}$/);
    expect(redacted.commandHash).toMatch(/^[a-f0-9]{64}$/);
    expect(redacted.pathHash).toMatch(/^[a-f0-9]{64}$/);
    expect(redacted.cwdHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("paramsHash audit entry never embeds plaintext secrets or full paths", () => {
    const hash = hashRedactedParams("cursor.ide.fs.write", secrets);
    expect(hash).toHaveLength(64);
    const auditLike = {
      id: "test-id",
      actionId: "cursor.ide.fs.write",
      paramsHash: hash,
      result: "success",
      rollbackAvailable: false,
    };
    const serialized = JSON.stringify(auditLike);
    expect(serialized).not.toContain(secrets.prompt);
    expect(serialized).not.toContain(secrets.content);
    expect(serialized).not.toContain("settings-secret");
    expect(serialized).not.toContain("npm run build");
    expect(serialized).not.toContain("secret.txt");
  });
});

describe("Step 8 — Snapshot restore (P0.1a)", () => {
  it("restore rejects workspace.open snapshots", async () => {
    const snap = createSnapshot("cursor.ide.workspace.open", {
      previousWorkspaceFolders: [TEST_ROOT],
    });
    const result = await restoreBySnapshot({
      snapshotId: snap.snapshotId,
      clientId: "bridge-default",
      confirmed: true,
      cwd: TEST_ROOT,
      requestId: "hard-1",
      transport: {
        extensionReachable: async () => true,
        restoreViaExtension: async () => ({ ok: true }),
      },
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("SNAPSHOT_UNSUPPORTED");
  });

  it("restore requires confirmed", async () => {
    const snap = createSnapshot("cursor.ide.settings.set", {
      section: "editor",
      key: "tabSize",
      previous: 4,
      target: "workspace",
    });
    const result = await restoreBySnapshot({
      snapshotId: snap.snapshotId,
      clientId: "bridge-default",
      cwd: TEST_ROOT,
      requestId: "hard-2",
      transport: {
        extensionReachable: async () => true,
        restoreViaExtension: async () => ({ ok: true }),
      },
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("CONFIRMATION_REQUIRED");
  });
});

describe("Step 8 — Extension offline fallbacks", () => {
  function offlineRouter(runCommand?: RunCommandFn) {
    const ext = {
      isReachable: async () => false,
      getHealth: async () => ({}),
      execute: async () => ({ ok: false, error: "offline" }),
    };
    return new CapabilityRouter({
      extensionClient: ext,
      cwd: TEST_ROOT,
      executors: [
        createExtensionExecutor(ext),
        createCliExecutor({ runCommand: runCommand ?? (async () => ({ stdout: "", code: 0 })) }),
        createFilesystemExecutor(),
      ],
    });
  }

  it("status.get uses CLI fallback", async () => {
    const runCommand: RunCommandFn = async (bin, args) => {
      if (bin === "cursor" && args[0] === "--version") return { stdout: "2.3.0", code: 0 };
      return { stdout: "Cursor", code: 0 };
    };
    const r = await offlineRouter(runCommand).execute({
      actionId: "cursor.ide.status.get",
      params: {},
      clientId: "bridge-default",
      requestId: "offline-status",
    });
    expect(r.ok).toBe(true);
    expect(r.methodUsed).toBe("cli");
  });

  it("workspace.open uses CLI fallback", async () => {
    const target = path.join(TEST_ROOT, "ws");
    fs.mkdirSync(target, { recursive: true });
    const r = await offlineRouter().execute({
      actionId: "cursor.ide.workspace.open",
      params: { path: target, confirmed: true },
      clientId: "bridge-default",
      requestId: "offline-ws",
    });
    expect(r.ok).toBe(true);
    expect(r.methodUsed).toBe("cli");
  });

  it("fs/settings use filesystem fallback only with allowlist", async () => {
    const router = offlineRouter();
    const allowed = path.join(TEST_ROOT, "allowed-dir");
    const r1 = await router.execute({
      actionId: "cursor.ide.fs.mkdir",
      params: { path: allowed },
      clientId: "bridge-default",
      requestId: "offline-mkdir",
    });
    expect(r1.ok).toBe(true);
    expect(r1.methodUsed).toBe("filesystem");

    const outside = path.join(os.tmpdir(), "blocked-outside");
    const r2 = await router.execute({
      actionId: "cursor.ide.fs.mkdir",
      params: { path: outside },
      clientId: "bridge-default",
      requestId: "offline-mkdir-blocked",
    });
    expect(r2.ok).toBe(false);

    const r3 = await router.execute({
      actionId: "cursor.ide.settings.get",
      params: { section: "editor", key: "tabSize" },
      clientId: "bridge-default",
      requestId: "offline-settings",
    });
    expect(r3.ok).toBe(true);
    expect(r3.methodUsed).toBe("filesystem");
  });

  it("terminal.run and command.execute block when extension offline", async () => {
    const router = offlineRouter();
    const terminal = await router.execute({
      actionId: "cursor.ide.terminal.run",
      params: { command: "git status", confirmed: true },
      clientId: "bridge-default",
      requestId: "offline-terminal",
    });
    expect(terminal.ok).toBe(false);
    expect(terminal.code).toBe("EXTENSION_UNREACHABLE");

    const command = await router.execute({
      actionId: "cursor.ide.command.execute",
      params: { commandId: "workbench.view.explorer", confirmed: true },
      clientId: "bridge-default",
      requestId: "offline-command",
    });
    expect(command.ok).toBe(false);
    expect(command.code).toBe("EXTENSION_UNREACHABLE");
  });
});
