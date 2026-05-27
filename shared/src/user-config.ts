import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

/** Bridge user config directory (outside project / .cursor). */
export function getBridgeUserConfigDir(): string {
  if (process.env.BRIDGE_USER_CONFIG_DIR) {
    return process.env.BRIDGE_USER_CONFIG_DIR;
  }
  if (process.platform === "win32") {
    const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Bridge");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), ".bridge");
  }
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(xdg, "bridge");
}

export function getIpcTokenPath(): string {
  return path.join(getBridgeUserConfigDir(), "ipc-token");
}

export function getHandshakePath(): string {
  return path.join(getBridgeUserConfigDir(), "bridge-ide-control-handshake.json");
}

export function getAuditDir(): string {
  return path.join(getBridgeUserConfigDir(), ".bridge", "audit");
}

export function getSnapshotsDir(): string {
  return path.join(getBridgeUserConfigDir(), ".bridge", "snapshots");
}

export function ensureBridgeUserConfigDir(): string {
  const dir = getBridgeUserConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function ensureAuditDir(): string {
  const dir = getAuditDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function ensureSnapshotsDir(): string {
  const dir = getSnapshotsDir();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}
