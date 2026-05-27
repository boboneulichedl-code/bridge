export interface HandshakeFile {
  port: number;
  pid: number;
  startedAt: string;
  tokenRef: "user-config";
  extensionVersion: string;
}

export const DEFAULT_IPC_PORT = 3848;
export const IPC_HOST = "127.0.0.1";
export const IPC_TIMEOUT_MS = 30_000;
