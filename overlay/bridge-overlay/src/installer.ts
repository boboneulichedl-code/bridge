import * as fs from "node:fs";
import * as path from "node:path";
import { app } from "electron";

export const INSTALL_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || "", "AppData", "Local"),
  "Programs",
  "CoreAI",
  "BridgeOverlay"
);

export const DATA_DIR = path.join(
  process.env.LOCALAPPDATA || "",
  "CoreAI",
  "BridgeOverlay"
);

export const CACHE_DIR = path.join(DATA_DIR, "cache");
export const CONFIG_PATH = path.join(DATA_DIR, "config.json");

export interface OverlayConfig {
  bridgeUrl: string;
  apiToken: string;
  pollMs: number;
  interactive: boolean;
}

export const DEFAULT_CONFIG: OverlayConfig = {
  bridgeUrl: "https://bridge.chatpilot.link",
  apiToken: "",
  pollMs: 2000,
  interactive: true,
};

export function ensureDirs(): void {
  for (const d of [INSTALL_DIR, DATA_DIR, CACHE_DIR]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

export function loadConfig(): OverlayConfig {
  ensureDirs();
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2));
    return { ...DEFAULT_CONFIG };
  }
  return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) };
}

export function saveConfig(cfg: OverlayConfig): void {
  ensureDirs();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

/** Copy running app to standard install location (portable self-install). */
export function installSelf(): string {
  ensureDirs();
  if (!app.isPackaged) return process.cwd();

  const exe = process.execPath;
  const targetExe = path.join(INSTALL_DIR, path.basename(exe));
  if (path.resolve(exe).toLowerCase() === path.resolve(targetExe).toLowerCase()) {
    return INSTALL_DIR;
  }

  fs.mkdirSync(INSTALL_DIR, { recursive: true });
  if (!fs.existsSync(targetExe)) {
    fs.copyFileSync(exe, targetExe);
  }

  const shortcutDir = path.join(
    process.env.APPDATA || "",
    "Microsoft",
    "Windows",
    "Start Menu",
    "Programs",
    "CoreAI"
  );
  fs.mkdirSync(shortcutDir, { recursive: true });
  const vbs = path.join(INSTALL_DIR, "create-shortcut.vbs");
  const lnk = path.join(shortcutDir, "Bridge Overlay.lnk");
  fs.writeFileSync(
    vbs,
    `Set s=CreateObject("WScript.Shell").CreateShortcut("${lnk.replace(/\\/g, "\\\\")}")\n` +
      `s.TargetPath="${targetExe.replace(/\\/g, "\\\\")}"\n` +
      `s.WorkingDirectory="${INSTALL_DIR.replace(/\\/g, "\\\\")}"\n` +
      `s.Save\n`
  );
  try {
    require("node:child_process").execSync(`cscript //nologo "${vbs}"`, { windowsHide: true });
  } catch {
    /* optional */
  }

  return INSTALL_DIR;
}
