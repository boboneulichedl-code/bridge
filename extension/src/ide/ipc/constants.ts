export const IPC_HOST = "127.0.0.1" as const;
export const DEFAULT_IPC_PORT = 3848;
export const IPC_MAX_BODY_BYTES = 1024 * 1024;
export const IPC_TOKEN_HEADER = "x-bridge-ipc-token";

export const IPC_ROUTES = {
  health: "/health",
  capabilities: "/capabilities",
  execute: "/actions/execute",
  snapshotRestore: "/snapshots/restore",
} as const;

export const IPC_CAPABILITIES = ["extension-api", "extension-command"] as const;
