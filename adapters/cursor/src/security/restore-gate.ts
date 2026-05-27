import { getAction, getClientPermissions } from "../registry/load-registry";
import type { SnapshotRecord } from "../snapshots/snapshot-service";
import { isRestoreableActionId } from "@bridge/shared";
import { isPathAllowed } from "./path-allowlist";
import {
  securityGateAllowed,
  securityGateDenied,
  type SecurityGateResult,
} from "./types";

export interface RestoreGateInput {
  snapshot: SnapshotRecord;
  clientId: string;
  confirmed?: boolean;
}

function fsWritePayloadRestorable(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  return typeof p.path === "string" && typeof p.content === "string";
}

/**
 * P0.1a restore gate — uses snapshot.actionId registry permissions; no registry restore action.
 */
export function evaluateRestoreGate(input: RestoreGateInput): SecurityGateResult {
  const { snapshot, clientId } = input;
  const actionId = snapshot.actionId;

  if (!isRestoreableActionId(actionId)) {
    return securityGateDenied(
      "SNAPSHOT_UNSUPPORTED",
      `Restore not supported for action: ${actionId}`
    );
  }

  const action = getAction(actionId);
  if (!action) {
    return securityGateDenied("ACTION_UNKNOWN", `Action not in registry: ${actionId}`);
  }

  const perms = getClientPermissions(clientId);
  if (!perms.includes(action.requiredPermission)) {
    return securityGateDenied(
      "PERMISSION_DENIED",
      `Missing permission: ${action.requiredPermission}`
    );
  }

  if (actionId === "cursor.ide.fs.write") {
    if (!fsWritePayloadRestorable(snapshot.payload)) {
      return securityGateDenied(
        "SNAPSHOT_UNSUPPORTED",
        "fs.write restore requires overwrite snapshot with path and content"
      );
    }
    const filePath = (snapshot.payload as Record<string, unknown>).path as string;
    if (!isPathAllowed(filePath)) {
      return securityGateDenied(
        "ALLOWLIST_VIOLATION",
        `Path not in allowlist: ${filePath}`
      );
    }
  }

  if (input.confirmed !== true) {
    return securityGateDenied(
      "CONFIRMATION_REQUIRED",
      "User confirmation required (confirmed: true)",
      action.destructive ? "destructive" : "read"
    );
  }

  return securityGateAllowed({}, action.destructive ? "destructive" : "read");
}
