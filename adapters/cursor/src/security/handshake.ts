import * as fs from "node:fs";
import type { IdeControlHandshake } from "@bridge/shared";
import { getHandshakePath } from "@bridge/shared";

export interface HandshakeValidationResult {
  valid: boolean;
  error?: string;
  handshake?: IdeControlHandshake;
}

const FORBIDDEN_HANDSHAKE_KEYS = ["token", "ipcToken", "secret", "apiToken"] as const;

/** Handshake must never contain a token — only port/pid/tokenRef metadata */
export function validateHandshakeContent(raw: unknown): HandshakeValidationResult {
  if (!raw || typeof raw !== "object") {
    return { valid: false, error: "Handshake must be a JSON object" };
  }

  const obj = raw as Record<string, unknown>;

  for (const key of FORBIDDEN_HANDSHAKE_KEYS) {
    if (key in obj && obj[key] !== undefined && obj[key] !== null) {
      return { valid: false, error: `Handshake must not contain field: ${key}` };
    }
  }

  if (obj.tokenRef !== "user-config") {
    return { valid: false, error: 'Handshake tokenRef must be "user-config"' };
  }

  if (typeof obj.port !== "number" || typeof obj.pid !== "number") {
    return { valid: false, error: "Handshake requires numeric port and pid" };
  }

  return {
    valid: true,
    handshake: obj as unknown as IdeControlHandshake,
  };
}

export function readAndValidateHandshakeFile(): HandshakeValidationResult {
  const filePath = getHandshakePath();
  if (!fs.existsSync(filePath)) {
    return { valid: false, error: "Handshake file not found" };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return validateHandshakeContent(raw);
  } catch {
    return { valid: false, error: "Invalid handshake JSON" };
  }
}

export function assertHandshakePathOutsideProject(projectRoot: string): boolean {
  const handshakePath = getHandshakePath();
  const normalizedProject = projectRoot.replace(/\\/g, "/").toLowerCase();
  const normalizedHandshake = handshakePath.replace(/\\/g, "/").toLowerCase();
  return (
    !normalizedHandshake.includes("/.cursor/") &&
    !normalizedHandshake.startsWith(normalizedProject + "/")
  );
}
