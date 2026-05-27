import * as fs from "node:fs";
import * as path from "node:path";
import type { IdeControlHandshake } from "@bridge/shared";
import { getHandshakePath } from "@bridge/shared";

/** Writes discovery metadata only — never stores the IPC token */
export function writeIdeControlHandshake(input: {
  port: number;
  pid: number;
  extensionVersion: string;
}): IdeControlHandshake {
  const handshake: IdeControlHandshake = {
    port: input.port,
    pid: input.pid,
    startedAt: new Date().toISOString(),
    tokenRef: "user-config",
    extensionVersion: input.extensionVersion,
  };

  const filePath = getHandshakePath();
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(handshake, null, 2), { mode: 0o600 });
  return handshake;
}

export function removeIdeControlHandshake(): void {
  const filePath = getHandshakePath();
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function readIdeControlHandshake(): IdeControlHandshake | undefined {
  const filePath = getHandshakePath();
  if (!fs.existsSync(filePath)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as IdeControlHandshake;
  } catch {
    return undefined;
  }
}

/** Guard: handshake JSON must not contain token fields */
export function handshakeContainsForbiddenFields(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return "Handshake must be an object";
  const obj = raw as Record<string, unknown>;
  for (const key of ["token", "ipcToken", "secret", "apiToken"]) {
    if (key in obj && obj[key] != null) {
      return `Forbidden handshake field: ${key}`;
    }
  }
  if (obj.tokenRef !== "user-config") {
    return 'tokenRef must be "user-config"';
  }
  return undefined;
}
