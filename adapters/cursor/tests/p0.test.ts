import { describe, expect, it, beforeEach } from "vitest";
import {
  loadRegistries,
  resetRegistryCache,
  getAction,
  listActions,
  getRegistryVersion,
} from "../src/registry/load-registry";
import { evaluateSecurityGate } from "../src/security/security-gate";
import {
  isTerminalCommandAllowed,
  normalizeTerminalCommand,
} from "../src/security/terminal-whitelist";
import { isCommandAllowed } from "../src/security/command-allowlist";
import { hashRedactedParams, redactParamsForAudit } from "../src/audit/redact-params";
import { isCursorVersionCompatible } from "../src/version/compatibility";
import { createSnapshot } from "../src/snapshots/snapshot-service";
import { restoreBySnapshot } from "../src/snapshots/restore-service";
import path from "node:path";

beforeEach(() => {
  resetRegistryCache();
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = path.join(__dirname, "..", "registry");
  loadRegistries();
});

describe("registry", () => {
  it("loads 10 actions", () => {
    expect(listActions()).toHaveLength(10);
    expect(getRegistryVersion()).toBe("poc-v1.2.0");
  });

  it("marks extension install as externalCode", () => {
    const action = getAction("cursor.ide.extension.install");
    expect(action?.externalCode).toBe(true);
    expect(action?.rollbackAvailable).toBe(false);
  });
});

describe("terminal whitelist", () => {
  it("allows exact commands only", () => {
    expect(isTerminalCommandAllowed("npm run build")).toBe(true);
    expect(isTerminalCommandAllowed("git status")).toBe(true);
    expect(normalizeTerminalCommand("git  status")).toBe("git status");
    expect(isTerminalCommandAllowed("npm install")).toBe(false);
    expect(isTerminalCommandAllowed("node -e")).toBe(false);
    expect(isTerminalCommandAllowed("npx vitest")).toBe(false);
  });
});

describe("command allowlist", () => {
  it("allows explorer command", () => {
    expect(isCommandAllowed("workbench.view.explorer")).toBe(true);
    expect(isCommandAllowed("workbench.action.deleteAll")).toBe(false);
  });
});

describe("security gate", () => {
  it("blocks unknown action", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.unknown",
      params: {},
      clientId: "bridge-default",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("ACTION_UNKNOWN");
  });

  it("requires confirmation for extension install", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.extension.install",
      params: { extensionId: "dbaeumer.vscode-eslint" },
      clientId: "bridge-default",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("CONFIRMATION_REQUIRED");
    expect(r.riskClass).toBe("external-code");
  });

  it("allows extension install when confirmed", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.extension.install",
      params: { extensionId: "dbaeumer.vscode-eslint", confirmed: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.allowed).toBe(true);
  });

  it("blocks non-whitelisted terminal command", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.terminal.run",
      params: { command: "npm install", confirmed: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("ALLOWLIST_VIOLATION");
  });

  it("requires confirmation on fs write overwrite", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.fs.write",
      params: { path: process.cwd() + "/x.txt", content: "a", overwriteExisting: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("CONFIRMATION_REQUIRED");
  });
});

describe("audit redaction", () => {
  it("hashes sensitive fields", () => {
    const redacted = redactParamsForAudit("cursor.agent.prompt.send", {
      prompt: "secret prompt",
    });
    expect(redacted.promptHash).toBeTruthy();
    expect(redacted).not.toHaveProperty("prompt");
    expect(hashRedactedParams("cursor.agent.prompt.send", { prompt: "secret prompt" })).toHaveLength(64);
  });

  it("does not include plaintext command", () => {
    const redacted = redactParamsForAudit("cursor.ide.terminal.run", {
      command: "npm run build",
    });
    expect(redacted.commandHash).toBeTruthy();
    expect(redacted).not.toHaveProperty("command");
  });
});

describe("compatibility", () => {
  it("matches >=2.0.0", () => {
    expect(isCursorVersionCompatible("2.3.0", [">=2.0.0"])).toBe(true);
    expect(isCursorVersionCompatible("1.9.0", [">=2.0.0"])).toBe(false);
  });
});

describe("snapshot restore", () => {
  it("settings.set snapshot is restorable when confirmed", async () => {
    const snap = createSnapshot("cursor.ide.settings.set", {
      section: "editor",
      key: "tabSize",
      previous: 4,
      target: "workspace",
    });
    const result = await restoreBySnapshot({
      snapshotId: snap.snapshotId,
      clientId: "bridge-default",
      confirmed: true,
      cwd: process.cwd(),
      requestId: "p0-restore-1",
      transport: {
        extensionReachable: async () => true,
        restoreViaExtension: async () => ({ ok: true }),
      },
    });
    expect(result.ok, JSON.stringify(result)).toBe(true);
  });
});
