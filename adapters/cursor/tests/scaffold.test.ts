import { describe, expect, it, beforeEach } from "vitest";
import path from "node:path";
import {
  loadRegistries,
  resetRegistryCache,
  getAction,
  listActions,
  getRegistryVersion,
  getCommandsRegistry,
  getTerminalWhitelist,
  getPermissionsRegistry,
  getClientPermissions,
} from "../src/registry/load-registry";

beforeEach(() => {
  resetRegistryCache();
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = path.join(__dirname, "..", "registry");
  loadRegistries();
});

describe("Step 1 — Scaffold / Registry / Loader", () => {
  it("loads registry version poc-v1.2.0", () => {
    expect(getRegistryVersion()).toBe("poc-v1.2.0");
  });

  it("loads exactly 10 P0 actions", () => {
    const actions = listActions();
    expect(actions).toHaveLength(10);
    const ids = actions.map((a) => a.actionId);
    expect(ids).toContain("cursor.ide.status.get");
    expect(ids).toContain("cursor.agent.prompt.send");
  });

  it("marks rollbackAvailable true only for settings.set and fs.write", () => {
    for (const action of listActions()) {
      if (
        action.actionId === "cursor.ide.settings.set" ||
        action.actionId === "cursor.ide.fs.write"
      ) {
        expect(action.rollbackAvailable).toBe(true);
      } else {
        expect(action.rollbackAvailable).toBe(false);
      }
    }
  });

  it("flags extension.install as externalCode", () => {
    const action = getAction("cursor.ide.extension.install");
    expect(action?.externalCode).toBe(true);
    expect(action?.needsConfirmation).toBe(true);
  });

  it("loads command allowlist", () => {
    const commands = getCommandsRegistry();
    expect(commands.allowedCommands.length).toBeGreaterThan(0);
    expect(commands.allowedCommands.some((c) => c.commandId === "workbench.view.explorer")).toBe(true);
  });

  it("loads exact terminal whitelist (6 commands)", () => {
    const terminal = getTerminalWhitelist();
    expect(terminal.matchMode).toBe("exact");
    expect(terminal.allowedCommands).toEqual([
      "npm run build",
      "npm test",
      "npm run test",
      "git status",
      "git diff",
      "git log",
    ]);
  });

  it("loads default client permissions", () => {
    const perms = getPermissionsRegistry();
    expect(perms.defaultClientId).toBe("bridge-default");
    expect(getClientPermissions("bridge-default")).toContain("read");
    expect(getClientPermissions("bridge-default")).toContain("agent-run");
  });

  it("returns undefined for unknown actionId", () => {
    expect(getAction("cursor.unknown.action")).toBeUndefined();
  });
});
