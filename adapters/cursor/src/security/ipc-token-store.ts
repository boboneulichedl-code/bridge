import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  ensureBridgeUserConfigDir,
  getBridgeUserConfigDir,
  getHandshakePath,
  getIpcTokenPath,
} from "@bridge/shared";

const TOKEN_ENV = "BRIDGE_IPC_TOKEN";

function setUserOnlyMode(filePath: string): void {
  try {
    if (process.platform !== "win32") {
      fs.chmodSync(filePath, 0o600);
    }
  } catch {
    /* best effort */
  }
}

/** Token must live in user config — never under project or .cursor */
export function assertTokenPathsOutsideProject(projectRoot: string): {
  tokenOutsideProject: boolean;
  handshakeOutsideProject: boolean;
  tokenNotInCursorDir: boolean;
} {
  const tokenPath = getIpcTokenPath().replace(/\\/g, "/").toLowerCase();
  const handshakePath = getHandshakePath().replace(/\\/g, "/").toLowerCase();
  const project = path.resolve(projectRoot).replace(/\\/g, "/").toLowerCase();

  return {
    tokenOutsideProject: !tokenPath.startsWith(project + "/") && tokenPath !== project,
    handshakeOutsideProject:
      !handshakePath.startsWith(project + "/") && handshakePath !== project,
    tokenNotInCursorDir: !tokenPath.includes("/.cursor/"),
  };
}

export function getIpcTokenStorageDir(): string {
  return getBridgeUserConfigDir();
}

export function readIpcToken(): string | undefined {
  if (process.env[TOKEN_ENV]) {
    return process.env[TOKEN_ENV];
  }
  const tokenPath = getIpcTokenPath();
  if (!fs.existsSync(tokenPath)) return undefined;
  return fs.readFileSync(tokenPath, "utf8").trim();
}

export function ensureIpcToken(): string {
  const existing = readIpcToken();
  if (existing) return existing;

  ensureBridgeUserConfigDir();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenPath = getIpcTokenPath();
  fs.writeFileSync(tokenPath, token, { encoding: "utf8", mode: 0o600 });
  setUserOnlyMode(tokenPath);
  return token;
}

export function ipcTokenMatches(provided: string | undefined): boolean {
  const expected = readIpcToken();
  if (!expected || !provided) return false;
  if (expected.length !== provided.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

/** Dev/CI override only — documented env escape hatch */
export function isIpcTokenEnvOverride(): boolean {
  return Boolean(process.env[TOKEN_ENV]);
}
