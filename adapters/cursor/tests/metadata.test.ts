import { describe, expect, it, beforeEach } from "vitest";
import { buildRegistryResponse } from "../src/index";
import { loadRegistries, resetRegistryCache } from "../src/registry/load-registry";
import path from "node:path";

beforeEach(() => {
  resetRegistryCache();
  process.env.BRIDGE_CURSOR_REGISTRY_DIR = path.join(__dirname, "..", "registry");
  loadRegistries();
});

describe("registry API metadata", () => {
  it("reports P0.1a rollback matrix", () => {
    const reg = buildRegistryResponse();
    expect(reg.rollbackAvailable).toBe(true);
    const byId = Object.fromEntries(reg.actions.map((a) => [a.actionId, a.rollbackAvailable]));
    expect(byId["cursor.ide.settings.set"]).toBe(true);
    expect(byId["cursor.ide.fs.write"]).toBe(true);
    expect(byId["cursor.ide.workspace.open"]).toBe(false);
  });
});

describe("ipc token paths", () => {
  it("uses user config dir not project cwd", async () => {
    const { getIpcTokenPath, getHandshakePath } = await import("@bridge/shared");
    expect(getIpcTokenPath()).not.toContain(".cursor");
    expect(getHandshakePath()).not.toContain(".cursor");
  });
});
