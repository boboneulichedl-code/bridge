import { describe, expect, it, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  loadRegistries,
  resetRegistryCache,
} from "../src/registry/load-registry";
import { evaluateSecurityGate, gateErrorCode } from "../src/security/security-gate";
import { isPathAllowed, getAllowedPathRoots } from "../src/security/path-allowlist";
import { isCommandAllowed, listAllowedCommandIds } from "../src/security/command-allowlist";
import {
  isTerminalCommandAllowed,
  listAllowedTerminalCommands,
  normalizeTerminalCommand,
} from "../src/security/terminal-whitelist";
import {
  assertTokenPathsOutsideProject,
  ensureIpcToken,
  ipcTokenMatches,
  readIpcToken,
} from "../src/security/ipc-token-store";
import {
  assertHandshakePathOutsideProject,
  validateHandshakeContent,
} from "../src/security/handshake";
import { normalizeAgentParams, agentAllowsFileChanges } from "../src/security/agent-policy";
import { isCursorVersionCompatible } from "../src/version/compatibility";
import { CURSOR_ERROR_HTTP_STATUS } from "@bridge/shared";

const REGISTRY = path.join(__dirname, "..", "registry");
let tmpUserConfig: string;

beforeEach(() => {
  resetRegistryCache();
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = REGISTRY;
  loadRegistries();
  tmpUserConfig = fs.mkdtempSync(path.join(os.tmpdir(), "bridge-user-config-"));
  process.env.BRIDGE_USER_CONFIG_DIR = tmpUserConfig;
  process.env.BRIDGE_ALLOWED_PATHS = process.cwd();
  delete process.env.BRIDGE_IPC_TOKEN;
});

afterEach(() => {
  delete process.env.BRIDGE_USER_CONFIG_DIR;
  delete process.env.BRIDGE_ALLOWED_PATHS;
  delete process.env.BRIDGE_IPC_TOKEN;
  fs.rmSync(tmpUserConfig, { recursive: true, force: true });
});

describe("Step 3 — Security Gate", () => {
  it("blocks unknown actionId", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.fs.delete",
      params: {},
      clientId: "bridge-default",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("ACTION_UNKNOWN");
    expect(r.httpStatus).toBe(CURSOR_ERROR_HTTP_STATUS.ACTION_UNKNOWN);
  });

  it("blocks incompatible Cursor version", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.status.get",
      params: {},
      clientId: "bridge-default",
      cursorVersion: "1.0.0",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("VERSION_INCOMPATIBLE");
  });

  it("allows compatible Cursor version", () => {
    expect(isCursorVersionCompatible("2.3.0", [">=2.0.0"])).toBe(true);
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.status.get",
      params: {},
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.allowed).toBe(true);
  });

  it("blocks missing client permission", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.terminal.run",
      params: { command: "git status", confirmed: true },
      clientId: "restricted-client",
      cursorVersion: "2.3.0",
    });
    expect(r.allowed).toBe(false);
    expect(r.errorCode).toBe("PERMISSION_DENIED");
  });

  it("requires confirmed for externalCode extension install", () => {
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

  it("requires confirmed on fs.write overwrite", () => {
    const filePath = path.join(process.cwd(), "test-overwrite.txt");
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.fs.write",
      params: { path: filePath, content: "x", overwriteExisting: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.errorCode).toBe("CONFIRMATION_REQUIRED");
  });

  it("blocks path outside allowlist", () => {
    process.env.BRIDGE_ALLOWED_PATHS = path.join(process.cwd(), "allowed-only");
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.fs.mkdir",
      params: { path: "C:\\Definitely\\Outside\\Allowlist" },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.errorCode).toBe("ALLOWLIST_VIOLATION");
  });

  it("allows path inside allowlist roots", () => {
    const inside = path.join(getAllowedPathRoots()[0]!, "sub", "dir");
    expect(isPathAllowed(inside)).toBe(true);
  });

  it("blocks non-allowlisted workbench command", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.command.execute",
      params: { commandId: "workbench.action.deleteAll", confirmed: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.errorCode).toBe("ALLOWLIST_VIOLATION");
  });

  it("allows allowlisted workbench command when confirmed", () => {
    expect(isCommandAllowed("workbench.view.explorer")).toBe(true);
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.command.execute",
      params: { commandId: "workbench.view.explorer", confirmed: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.allowed).toBe(true);
  });

  it("terminal whitelist allows only exact 6 commands", () => {
    expect(listAllowedTerminalCommands()).toHaveLength(6);
    expect(isTerminalCommandAllowed("npm run build")).toBe(true);
    expect(isTerminalCommandAllowed("npm install")).toBe(false);
    expect(isTerminalCommandAllowed("node -e")).toBe(false);
    expect(normalizeTerminalCommand("git  status")).toBe("git status");
  });

  it("blocks terminal command not in exact whitelist before confirmation matters", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.terminal.run",
      params: { command: "npx eslint", confirmed: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.errorCode).toBe("ALLOWLIST_VIOLATION");
  });

  it("allows whitelisted terminal command when confirmed", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.terminal.run",
      params: { command: "npm run build", confirmed: true },
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(r.allowed).toBe(true);
  });

  it("defaults agent allowFileChanges to false", () => {
    const params = { prompt: "test", confirmed: true };
    const normalized = normalizeAgentParams(params);
    expect(normalized.allowFileChanges).toBe(false);
    expect(agentAllowsFileChanges(normalized)).toBe(false);

    const gate = evaluateSecurityGate({
      actionId: "cursor.agent.prompt.send",
      params,
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
      confirmed: true,
    });
    expect(gate.allowed).toBe(true);
    expect(gate.params?.allowFileChanges).toBe(false);
  });

  it("gateErrorCode returns undefined when allowed", () => {
    const r = evaluateSecurityGate({
      actionId: "cursor.ide.status.get",
      params: {},
      clientId: "bridge-default",
      cursorVersion: "2.3.0",
    });
    expect(gateErrorCode(r)).toBeUndefined();
  });
});

describe("Step 3 — IPC token store", () => {
  it("stores token under user config not project", () => {
    const projectRoot = path.join(__dirname, "..", "..");
    const checks = assertTokenPathsOutsideProject(projectRoot);
    expect(checks.tokenNotInCursorDir).toBe(true);
    expect(checks.tokenOutsideProject).toBe(true);
    expect(checks.handshakeOutsideProject).toBe(true);
  });

  it("creates and validates ipc token in user config dir", () => {
    const token = ensureIpcToken();
    expect(token.length).toBeGreaterThan(32);
    expect(readIpcToken()).toBe(token);
    expect(ipcTokenMatches(token)).toBe(true);
    expect(ipcTokenMatches("wrong")).toBe(false);
    const tokenFile = path.join(tmpUserConfig, "ipc-token");
    expect(fs.existsSync(tokenFile)).toBe(true);
  });
});

describe("Step 3 — Handshake (no token)", () => {
  it("rejects handshake containing token field", () => {
    const r = validateHandshakeContent({
      port: 3848,
      pid: 1,
      token: "secret",
      tokenRef: "user-config",
    });
    expect(r.valid).toBe(false);
    expect(r.error).toMatch(/token/i);
  });

  it("accepts valid handshake shape without token", () => {
    const r = validateHandshakeContent({
      port: 3848,
      pid: 12345,
      startedAt: new Date().toISOString(),
      tokenRef: "user-config",
      extensionVersion: "2.3.0",
    });
    expect(r.valid).toBe(true);
    expect(r.handshake?.tokenRef).toBe("user-config");
  });

  it("handshake path is outside project root", () => {
    const projectRoot = path.join(__dirname, "..", "..");
    expect(assertHandshakePathOutsideProject(projectRoot)).toBe(true);
  });
});

describe("Step 3 — Command allowlist registry", () => {
  it("loads 7 allowed commands from registry", () => {
    expect(listAllowedCommandIds().length).toBe(7);
  });
});
