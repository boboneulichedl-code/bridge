export * from "./types/action";
export * from "./types/audit";
export * from "./types/ipc";
export * from "./registry/load-registry";
export * from "./security/security-gate";
export * from "./security/types";
export * from "./security/action-path-policy";
export * from "./security/agent-policy";
export * from "./security/handshake";
export * from "./security/path-allowlist";
export * from "./security/command-allowlist";
export * from "./security/terminal-whitelist";
export * from "./security/ipc-token-store";
export * from "./audit/redact-params";
export * from "./version/compatibility";
export * from "./snapshots/snapshot-service";
export * from "./snapshots/restore-service";
export * from "./security/restore-gate";
export * from "./router/capability-router";
export * from "./router/audit-hints";
export * from "./router/fallback-policy";
export type { ExtensionClient } from "./router/executors/extension";
export type { RunCommandFn } from "./router/executors/cli";
export { createExtensionExecutor } from "./router/executors/extension";
export { createCliExecutor } from "./router/executors/cli";
export { createFilesystemExecutor } from "./router/executors/filesystem";

export { ROLLBACK_AVAILABLE } from "./types/action";

import { listActions, getRegistryVersion } from "./registry/load-registry";
import type { CursorActionMeta, CursorActionId } from "@bridge/shared";

export function buildRegistryResponse() {
  const actions: CursorActionMeta[] = listActions().map((a) => ({
    actionId: a.actionId as CursorActionId,
    domain: a.domain,
    method: a.method,
    stability: a.stability,
    requiredPermission: a.requiredPermission,
    destructive: a.destructive,
    needsConfirmation:
      a.needsConfirmation || !!a.externalCode || !!a.needsConfirmationOnOverwrite,
    needsConfirmationOnOverwrite: a.needsConfirmationOnOverwrite,
    rollbackPossible: a.rollbackPossible,
    rollbackAvailable: a.rollbackAvailable,
    externalCode: a.externalCode,
  }));

  return {
    registryVersion: getRegistryVersion(),
    adapterId: "cursor",
    rollbackAvailable: true as const,
    actions,
  };
}
