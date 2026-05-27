import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSnapshot, getSnapshot } from "../src/snapshots/snapshot-service";
import {
  restoreBySnapshot,
  restoreSettingsViaFilesystem,
} from "../src/snapshots/restore-service";
import { evaluateRestoreGate } from "../src/security/restore-gate";
import { loadRegistries, resetRegistryCache } from "../src/registry/load-registry";

const REGISTRY = path.join(__dirname, "..", "registry");
const TEST_ROOT = path.join(os.tmpdir(), "bridge-restore-test");

describe("restore-gate", () => {
  beforeEach(() => {
    resetRegistryCache();
    process.env.BRIDGE_CURSOR_REGISTRY_DIR = REGISTRY;
    loadRegistries();
  });

  it("denies unsupported actionId", () => {
    const gate = evaluateRestoreGate({
      snapshot: {
        snapshotId: "s1",
        actionId: "cursor.ide.workspace.open",
        createdAt: new Date().toISOString(),
        payload: { previousWorkspaceFolders: [] },
        rollbackAvailable: false,
      },
      clientId: "bridge-default",
      confirmed: true,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe("SNAPSHOT_UNSUPPORTED");
  });

  it("requires confirmed", () => {
    const gate = evaluateRestoreGate({
      snapshot: {
        snapshotId: "s1",
        actionId: "cursor.ide.settings.set",
        createdAt: new Date().toISOString(),
        payload: { section: "editor", key: "tabSize", previous: 4, target: "workspace" },
        rollbackAvailable: true,
      },
      clientId: "bridge-default",
    });
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe("CONFIRMATION_REQUIRED");
  });

  it("denies fs.write without overwrite payload", () => {
    const gate = evaluateRestoreGate({
      snapshot: {
        snapshotId: "s1",
        actionId: "cursor.ide.fs.write",
        createdAt: new Date().toISOString(),
        payload: undefined,
        rollbackAvailable: false,
      },
      clientId: "bridge-default",
      confirmed: true,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe("SNAPSHOT_UNSUPPORTED");
  });

  it("denies fs.write restore when path is outside allowlist", () => {
    process.env.BRIDGE_ALLOWED_PATHS = TEST_ROOT;
    const gate = evaluateRestoreGate({
      snapshot: {
        snapshotId: "s1",
        actionId: "cursor.ide.fs.write",
        createdAt: new Date().toISOString(),
        payload: { path: "C:\\outside\\secret.txt", content: "old" },
        rollbackAvailable: true,
      },
      clientId: "bridge-default",
      confirmed: true,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.errorCode).toBe("ALLOWLIST_VIOLATION");
  });

  it("allows fs.write restore when path is in allowlist", () => {
    process.env.BRIDGE_ALLOWED_PATHS = TEST_ROOT;
    const gate = evaluateRestoreGate({
      snapshot: {
        snapshotId: "s1",
        actionId: "cursor.ide.fs.write",
        createdAt: new Date().toISOString(),
        payload: { path: path.join(TEST_ROOT, "file.txt"), content: "old" },
        rollbackAvailable: true,
      },
      clientId: "bridge-default",
      confirmed: true,
    });
    expect(gate.allowed).toBe(true);
  });
});

describe("restore-service", () => {
  beforeEach(() => {
    resetRegistryCache();
    process.env.BRIDGE_CURSOR_REGISTRY_DIR = REGISTRY;
    process.env.BRIDGE_ALLOWED_PATHS = TEST_ROOT;
    loadRegistries();
    fs.mkdirSync(TEST_ROOT, { recursive: true });
    fs.mkdirSync(path.join(TEST_ROOT, ".vscode"), { recursive: true });
  });

  afterEach(() => {
    delete process.env.BRIDGE_ALLOWED_PATHS;
  });

  it("returns 404 for unknown snapshot", async () => {
    const result = await restoreBySnapshot({
      snapshotId: "missing-id",
      clientId: "bridge-default",
      confirmed: true,
      cwd: TEST_ROOT,
      requestId: "req-1",
      transport: {
        extensionReachable: async () => false,
        restoreViaExtension: async () => ({ ok: true }),
      },
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("SNAPSHOT_NOT_FOUND");
  });

  it("restores settings via extension when reachable", async () => {
    const snap = createSnapshot("cursor.ide.settings.set", {
      section: "editor",
      key: "tabSize",
      previous: 4,
      target: "workspace",
    });
    const restoreViaExtension = vi.fn().mockResolvedValue({ ok: true });

    const result = await restoreBySnapshot({
      snapshotId: snap.snapshotId,
      clientId: "bridge-default",
      confirmed: true,
      cwd: TEST_ROOT,
      requestId: "req-2",
      transport: {
        extensionReachable: async () => true,
        restoreViaExtension,
      },
    });

    expect(result.ok).toBe(true);
    expect(restoreViaExtension).toHaveBeenCalled();
  });

  it("restores settings via filesystem when extension offline", async () => {
    const settingsFile = path.join(TEST_ROOT, ".vscode", "settings.json");
    fs.writeFileSync(settingsFile, JSON.stringify({ editor: { tabSize: 8 } }));

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
      cwd: TEST_ROOT,
      requestId: "req-3",
      transport: {
        extensionReachable: async () => false,
        restoreViaExtension: async () => ({ ok: false, error: "offline" }),
      },
    });

    expect(result.ok).toBe(true);
    const settings = JSON.parse(fs.readFileSync(settingsFile, "utf8")) as Record<string, unknown>;
    expect((settings.editor as Record<string, unknown>).tabSize).toBe(4);
  });

  it("rejects workspace snapshot restore", async () => {
    const snap = createSnapshot("cursor.ide.workspace.open", {
      previousWorkspaceFolders: [TEST_ROOT],
    });

    const result = await restoreBySnapshot({
      snapshotId: snap.snapshotId,
      clientId: "bridge-default",
      confirmed: true,
      cwd: TEST_ROOT,
      requestId: "req-4",
      transport: {
        extensionReachable: async () => true,
        restoreViaExtension: async () => ({ ok: true }),
      },
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("SNAPSHOT_UNSUPPORTED");
  });

  it("fs.write restore requires extension", async () => {
    const snap = createSnapshot("cursor.ide.fs.write", {
      path: path.join(TEST_ROOT, "file.txt"),
      content: "old",
    });

    const result = await restoreBySnapshot({
      snapshotId: snap.snapshotId,
      clientId: "bridge-default",
      confirmed: true,
      cwd: TEST_ROOT,
      requestId: "req-5",
      transport: {
        extensionReachable: async () => false,
        restoreViaExtension: async () => ({ ok: true }),
      },
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("EXTENSION_UNREACHABLE");
  });

  it("marks fs.write snapshot rollbackAvailable only with overwrite payload", () => {
    const withPayload = createSnapshot("cursor.ide.fs.write", {
      path: path.join(TEST_ROOT, "a.txt"),
      content: "x",
    });
    expect(withPayload.rollbackAvailable).toBe(true);

    const without = createSnapshot("cursor.ide.fs.write", undefined);
    expect(without.rollbackAvailable).toBe(false);
    expect(getSnapshot(without.snapshotId)?.rollbackAvailable).toBe(false);
  });

  it("rejects global-target settings FS fallback when extension offline", async () => {
    const snap = createSnapshot("cursor.ide.settings.set", {
      section: "editor",
      key: "tabSize",
      previous: 4,
      target: "global",
    });

    const result = await restoreBySnapshot({
      snapshotId: snap.snapshotId,
      clientId: "bridge-default",
      confirmed: true,
      cwd: TEST_ROOT,
      requestId: "req-global",
      transport: {
        extensionReachable: async () => false,
        restoreViaExtension: async () => ({ ok: false, error: "offline" }),
      },
    });

    expect(result.ok).toBe(false);
    expect(result.code).toBe("EXTENSION_UNREACHABLE");
  });

  it("restoreSettingsViaFilesystem handles full previous object", () => {
    const prev = { editor: { tabSize: 2 } };
    fs.writeFileSync(
      path.join(TEST_ROOT, ".vscode", "settings.json"),
      JSON.stringify({ editor: { tabSize: 99 } })
    );
    const result = restoreSettingsViaFilesystem(
      {
        snapshotId: "x",
        actionId: "cursor.ide.settings.set",
        createdAt: "",
        payload: { previous: prev, section: "editor", key: "tabSize" },
        rollbackAvailable: true,
      },
      TEST_ROOT
    );
    expect(result.ok).toBe(true);
    const settings = JSON.parse(
      fs.readFileSync(path.join(TEST_ROOT, ".vscode", "settings.json"), "utf8")
    ) as Record<string, unknown>;
    expect(settings).toEqual(prev);
  });
});
