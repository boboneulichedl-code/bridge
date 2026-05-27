import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadRegistries,
  resetRegistryCache,
} from "../src/registry/load-registry";
import { CapabilityRouter } from "../src/router/capability-router";
import type { ExtensionClient } from "../src/router/executors/extension";
import { createCliExecutor, type RunCommandFn } from "../src/router/executors/cli";
import { createExtensionExecutor } from "../src/router/executors/extension";
import { createFilesystemExecutor } from "../src/router/executors/filesystem";
import { securityGateAllowed } from "../src/security/types";
import {
  isFallbackEligible,
  isPrimaryApplicable,
  listEligibleFallbackMethods,
} from "../src/router/fallback-policy";
import { getAction } from "../src/registry/load-registry";

const TEST_ROOT = path.join(os.tmpdir(), "bridge-router-test");

function mockExtension(
  overrides: Partial<ExtensionClient> & { reachable?: boolean } = {}
): ExtensionClient {
  return {
    isReachable: async () => overrides.reachable ?? true,
    getHealth: async () => ({ cursorVersion: "2.3.0" }),
    execute: overrides.execute ?? (async () => ({ ok: true, data: { via: "extension" } })),
  };
}

function cliRouter(
  extensionClient: ExtensionClient,
  runCommand: RunCommandFn,
  cwd = TEST_ROOT
) {
  return new CapabilityRouter({
    extensionClient,
    cwd,
    executors: [
      createExtensionExecutor(extensionClient),
      createCliExecutor({ runCommand }),
      createFilesystemExecutor(),
    ],
  });
}

beforeEach(() => {
  resetRegistryCache();
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = path.join(__dirname, "..", "registry");
  loadRegistries();
  fs.mkdirSync(TEST_ROOT, { recursive: true });
  process.env.BRIDGE_ALLOWED_PATHS = TEST_ROOT;
});

afterEach(() => {
  fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  delete process.env.BRIDGE_ALLOWED_PATHS;
});

describe("fallback policy", () => {
  it("lists cli fallback only when extension unreachable", () => {
    const action = getAction("cursor.ide.status.get")!;
    expect(
      listEligibleFallbackMethods(action, {
        extensionReachable: false,
        primaryMethod: "extension-api",
        primaryAttempted: false,
        primaryOk: false,
        cliUnavailable: false,
      })
    ).toEqual(["cli"]);
    expect(
      listEligibleFallbackMethods(action, {
        extensionReachable: true,
        primaryMethod: "extension-api",
        primaryAttempted: true,
        primaryOk: true,
        cliUnavailable: false,
      })
    ).toEqual([]);
  });

  it("extension.install cli fallback only after command failure", () => {
    const action = getAction("cursor.ide.extension.install")!;
    const fb = action.fallbackMethods[0];
    expect(
      isFallbackEligible(fb, {
        extensionReachable: false,
        primaryMethod: "extension-command",
        primaryAttempted: false,
        primaryOk: false,
        cliUnavailable: false,
      })
    ).toBe(false);
    expect(
      isFallbackEligible(fb, {
        extensionReachable: true,
        primaryMethod: "extension-command",
        primaryAttempted: true,
        primaryOk: false,
        cliUnavailable: false,
      })
    ).toBe(true);
  });

  it("primary extension methods require reachable extension", () => {
    const action = getAction("cursor.ide.terminal.run")!;
    expect(isPrimaryApplicable(action, false)).toBe(false);
    expect(isPrimaryApplicable(action, true)).toBe(true);
  });
});

describe("CapabilityRouter", () => {
  it("chooses extension as primary when reachable", async () => {
    const router = new CapabilityRouter({
      extensionClient: mockExtension({
        execute: async (actionId) => ({
          ok: true,
          data: { actionId, source: "ipc" },
        }),
      }),
    });

    const result = await router.execute({
      actionId: "cursor.ide.status.get",
      params: {},
      clientId: "bridge-default",
      requestId: "req-ext-primary",
      gate: securityGateAllowed({}, "read"),
    });

    expect(result.ok).toBe(true);
    expect(result.methodUsed).toBe("extension-api");
    expect(result.data).toMatchObject({ source: "ipc" });
    expect(result.auditHints.paramsHash).toHaveLength(64);
  });

  it("uses CLI fallback for status.get when extension offline", async () => {
    const runCommand: RunCommandFn = async (bin, args) => {
      if (bin === "cursor" && args[0] === "--version") {
        return { stdout: "2.3.0\n", code: 0 };
      }
      return { stdout: "Cursor.exe", code: 0 };
    };

    const router = cliRouter(mockExtension({ reachable: false }), runCommand);
    const result = await router.execute({
      actionId: "cursor.ide.status.get",
      params: {},
      clientId: "bridge-default",
      requestId: "req-status-cli",
      gate: securityGateAllowed({}, "read"),
    });

    expect(result.ok).toBe(true);
    expect(result.methodUsed).toBe("cli");
    expect(result.data).toMatchObject({ extensionUnreachable: true });
  });

  it("uses CLI fallback for workspace.open when extension offline", async () => {
    const runCommand: RunCommandFn = async () => ({ stdout: "", code: 0 });
    const target = path.join(TEST_ROOT, "proj");
    fs.mkdirSync(target, { recursive: true });

    const router = cliRouter(mockExtension({ reachable: false }), runCommand);
    const result = await router.execute({
      actionId: "cursor.ide.workspace.open",
      params: { path: target, confirmed: true },
      clientId: "bridge-default",
      requestId: "req-ws-cli",
      gate: securityGateAllowed({ path: target, confirmed: true }, "read"),
    });

    expect(result.ok).toBe(true);
    expect(result.methodUsed).toBe("cli");
    expect(result.data).toMatchObject({ path: target });
  });

  it("uses filesystem fallback for fs.mkdir when extension offline", async () => {
    const router = new CapabilityRouter({
      extensionClient: mockExtension({ reachable: false }),
      cwd: TEST_ROOT,
    });
    const target = path.join(TEST_ROOT, "nested", "dir");
    const result = await router.execute({
      actionId: "cursor.ide.fs.mkdir",
      params: { path: target },
      clientId: "bridge-default",
      requestId: "req-mkdir-fs",
      gate: securityGateAllowed({ path: target }, "read"),
    });

    expect(result.ok).toBe(true);
    expect(result.methodUsed).toBe("filesystem");
    expect(fs.existsSync(target)).toBe(true);
  });

  it("uses filesystem fallback for fs.write and settings actions", async () => {
    const router = new CapabilityRouter({
      extensionClient: mockExtension({ reachable: false }),
      cwd: TEST_ROOT,
    });

    const filePath = path.join(TEST_ROOT, "out.txt");
    const writeResult = await router.execute({
      actionId: "cursor.ide.fs.write",
      params: { path: filePath, content: "hello" },
      clientId: "bridge-default",
      requestId: "req-write-fs",
      gate: securityGateAllowed({ path: filePath, content: "hello" }, "read"),
    });
    expect(writeResult.ok).toBe(true);
    expect(writeResult.methodUsed).toBe("filesystem");

    const getResult = await router.execute({
      actionId: "cursor.ide.settings.get",
      params: { section: "editor", key: "tabSize" },
      clientId: "bridge-default",
      requestId: "req-settings-get",
      gate: securityGateAllowed({ section: "editor", key: "tabSize" }, "read"),
    });
    expect(getResult.ok).toBe(true);
    expect(getResult.methodUsed).toBe("filesystem");

    const setResult = await router.execute({
      actionId: "cursor.ide.settings.set",
      params: { section: "editor", key: "tabSize", value: 4, confirmed: true },
      clientId: "bridge-default",
      requestId: "req-settings-set",
      gate: securityGateAllowed(
        { section: "editor", key: "tabSize", value: 4, confirmed: true },
        "read"
      ),
    });
    expect(setResult.ok).toBe(true);
    expect(setResult.methodUsed).toBe("filesystem");
    expect(setResult.snapshotId).toBeTruthy();
  });

  it("blocks terminal.run when extension offline", async () => {
    const router = new CapabilityRouter({
      extensionClient: mockExtension({ reachable: false }),
      cwd: TEST_ROOT,
    });
    const result = await router.execute({
      actionId: "cursor.ide.terminal.run",
      params: { command: "npm run build", confirmed: true },
      clientId: "bridge-default",
      requestId: "req-terminal-block",
      gate: securityGateAllowed({ command: "npm run build", confirmed: true }, "destructive"),
      riskClass: "destructive",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("EXTENSION_UNREACHABLE");
    expect(result.methodUsed).toBe("extension-api");
  });

  it("blocks command.execute when extension offline", async () => {
    const router = new CapabilityRouter({
      extensionClient: mockExtension({ reachable: false }),
      cwd: TEST_ROOT,
    });
    const result = await router.execute({
      actionId: "cursor.ide.command.execute",
      params: { commandId: "workbench.view.explorer", confirmed: true },
      clientId: "bridge-default",
      requestId: "req-command-block",
      gate: securityGateAllowed(
        { commandId: "workbench.view.explorer", confirmed: true },
        "destructive"
      ),
      riskClass: "destructive",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("EXTENSION_UNREACHABLE");
    expect(result.methodUsed).toBe("extension-command");
  });

  it("uses CLI for agent.prompt.send", async () => {
    const runCommand: RunCommandFn = async () => ({ stdout: "agent output", code: 0 });
    const router = cliRouter(mockExtension({ reachable: true }), runCommand);

    const result = await router.execute({
      actionId: "cursor.agent.prompt.send",
      params: { prompt: "hello", confirmed: true },
      clientId: "bridge-default",
      requestId: "req-agent-cli",
      gate: securityGateAllowed({ prompt: "hello", confirmed: true }, "destructive"),
      riskClass: "destructive",
    });

    expect(result.ok).toBe(true);
    expect(result.methodUsed).toBe("cli");
    expect(result.data).toMatchObject({ output: "agent output" });
  });

  it("does not run unregistered actions", async () => {
    const router = new CapabilityRouter({
      extensionClient: mockExtension(),
    });
    const result = await router.execute({
      actionId: "cursor.ide.fs.delete",
      params: {},
      clientId: "bridge-default",
      requestId: "req-unknown",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("ACTION_UNKNOWN");
  });

  it("does not bypass security gate when gate result is passed", async () => {
    const router = new CapabilityRouter({
      extensionClient: mockExtension(),
    });
    const result = await router.execute({
      actionId: "cursor.ide.terminal.run",
      params: { command: "npm install", confirmed: true },
      clientId: "bridge-default",
      requestId: "req-gate",
      gate: {
        allowed: false,
        errorCode: "ALLOWLIST_VIOLATION",
        message: "Terminal command not in whitelist",
      },
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("ALLOWLIST_VIOLATION");
    expect(result.auditHints.result).toBe("failure");
  });

  it("does not CLI-fallback extension.install when extension unreachable", async () => {
    const runCommand: RunCommandFn = async () => {
      throw new Error("CLI should not be invoked");
    };
    const router = cliRouter(mockExtension({ reachable: false }), runCommand);

    const result = await router.execute({
      actionId: "cursor.ide.extension.install",
      params: { extensionId: "dbaeumer.vscode-eslint", confirmed: true },
      clientId: "bridge-default",
      requestId: "req-install-offline",
      gate: securityGateAllowed(
        { extensionId: "dbaeumer.vscode-eslint", confirmed: true },
        "external-code"
      ),
      riskClass: "external-code",
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("EXTENSION_UNREACHABLE");
  });
});
