import * as crypto from "node:crypto";
import * as fs from "node:fs";
import {
  ensureBridgeUserConfigDir,
  getBridgeUserConfigDir,
  getHandshakePath,
  getIpcTokenPath,
} from "@bridge/shared";

const TOKEN_ENV = "BRIDGE_IPC_TOKEN";

export function assertTokenStorageOutsideProject(projectRoot: string): {
  tokenOutsideProject: boolean;
  handshakeOutsideProject: boolean;
  tokenNotInCursorDir: boolean;
} {
  const tokenPath = getIpcTokenPath().replace(/\\/g, "/").toLowerCase();
  const handshakePath = getHandshakePath().replace(/\\/g, "/").toLowerCase();
  const project = projectRoot.replace(/\\/g, "/").toLowerCase();

  return {
    tokenOutsideProject: !tokenPath.startsWith(project + "/") && tokenPath !== project,
    handshakeOutsideProject:
      !handshakePath.startsWith(project + "/") && handshakePath !== project,
    tokenNotInCursorDir: !tokenPath.includes("/.cursor/"),
  };
}

export function getTokenStorageDir(): string {
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
  return token;
}

export function tokenMatches(provided: string | undefined): boolean {
  const expected = readIpcToken();
  if (!expected || !provided) return false;
  if (expected.length !== provided.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}
