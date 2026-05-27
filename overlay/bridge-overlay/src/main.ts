import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
} from "electron";
import * as path from "node:path";
import { GuiCacheStore, snapshotKey } from "./gui-cache";
import {
  CACHE_DIR,
  installSelf,
  loadConfig,
  saveConfig,
  type OverlayConfig,
} from "./installer";
import { askBridgeAi, captureForeground, controlElement } from "./uia-bridge";
import type { GuiSnapshot } from "./types";

let overlay: BrowserWindow | null = null;
let pollTimer: NodeJS.Timeout | null = null;
let currentSnapshot: GuiSnapshot | null = null;
const cache = new GuiCacheStore(CACHE_DIR);
let config = loadConfig();

function assetsPath(): string {
  if (app.isPackaged) return path.join(process.resourcesPath, "assets");
  return path.join(__dirname, "..", "assets");
}

function createOverlay(): void {
  overlay = new BrowserWindow({
    width: 800,
    height: 600,
    x: 100,
    y: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  overlay.setIgnoreMouseEvents(false);
  overlay.setAlwaysOnTop(true, "screen-saver");
  overlay.loadFile(path.join(assetsPath(), "overlay.html"));
}

async function refreshGui(force = false): Promise<GuiSnapshot | null> {
  try {
    const quick = await captureForeground(true);
    const key = snapshotKey(
      quick.window.processName,
      quick.window.className,
      quick.window.title
    );

    if (!force && cache.isFresh(key, quick.fingerprint)) {
      const cached = cache.load(key);
      if (cached) {
        cached.windowBounds = quick.window.bounds;
        currentSnapshot = cached;
        overlay?.webContents.send("gui-update", cached);
        overlay?.setBounds({
          x: Math.round(quick.window.bounds.x),
          y: Math.round(quick.window.bounds.y),
          width: Math.round(quick.window.bounds.width),
          height: Math.round(quick.window.bounds.height),
        });
        return cached;
      }
    }

    const full = await captureForeground(false);
    const snapshot = cache.bumpOrCreate(
      key,
      {
        processName: full.window.processName,
        processId: full.window.processId,
        windowTitle: full.window.title,
        windowClass: full.window.className,
        windowBounds: full.window.bounds,
      },
      full.nodes
    );
    currentSnapshot = snapshot;
    overlay?.webContents.send("gui-update", snapshot);
    overlay?.setBounds({
      x: Math.round(full.window.bounds.x),
      y: Math.round(full.window.bounds.y),
      width: Math.round(full.window.bounds.width),
      height: Math.round(full.window.bounds.height),
    });
    return snapshot;
  } catch {
    return null;
  }
}

function startPolling(): void {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => void refreshGui(false), config.pollMs);
}

function registerShortcuts(): void {
  globalShortcut.register("Control+Alt+O", () => {
    overlay?.isVisible() ? overlay.hide() : overlay?.show();
  });
  globalShortcut.register("Control+Alt+R", () => void refreshGui(true));
  globalShortcut.register("Control+Alt+G", async () => {
    const snap = currentSnapshot ?? (await refreshGui(true));
    if (!snap) return;
    const actions = await askBridgeAi(
      "Analysiere die UI und schlage den nächsten sinnvollen Klick vor.",
      snap,
      config.apiToken,
      config.bridgeUrl
    );
    for (const a of actions) {
      if (a.action === "prompt") continue;
      await controlElement(snap.processId, a);
    }
    await refreshGui(false);
  });
}

app.whenReady().then(() => {
  installSelf();
  config = loadConfig();
  createOverlay();
  startPolling();
  registerShortcuts();
  void refreshGui(true);

  ipcMain.handle("get-config", () => config);
  ipcMain.handle("set-config", (_e, patch: Partial<OverlayConfig>) => {
    config = { ...config, ...patch };
    saveConfig(config);
    startPolling();
    return config;
  });
  ipcMain.handle("force-refresh", () => refreshGui(true));
  ipcMain.handle("ai-command", async (_e, prompt: string) => {
    const snap = currentSnapshot ?? (await refreshGui(true));
    if (!snap) return { ok: false, error: "no window" };
    const actions = await askBridgeAi(prompt, snap, config.apiToken, config.bridgeUrl);
    for (const a of actions) {
      if (a.action === "prompt") continue;
      await controlElement(snap.processId, a);
    }
    await refreshGui(false);
    return { ok: true, actions };
  });
  ipcMain.handle("control", async (_e, action: unknown) => {
    if (!currentSnapshot) return { ok: false };
    return controlElement(currentSnapshot.processId, action as import("./types").AiAction);
  });
});

app.on("will-quit", () => globalShortcut.unregisterAll());

app.on("window-all-closed", () => {
  /* Overlay bleibt im Hintergrund aktiv */
});
