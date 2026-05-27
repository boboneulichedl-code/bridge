import * as fs from "node:fs";
import * as path from "node:path";
import type { CursorErrorCode } from "@bridge/shared";
import { CURSOR_ERROR_HTTP_STATUS, isRestoreableActionId } from "@bridge/shared";
import { evaluateRestoreGate, type RestoreGateInput } from "../security/restore-gate";
import { isPathAllowed } from "../security/path-allowlist";
import { getSnapshot, type SnapshotRecord } from "./snapshot-service";

export interface RestoreResult {
  ok: boolean;
  snapshotId?: string;
  actionId?: string;
  error?: string;
  code?: CursorErrorCode;
  httpStatus?: number;
}

export interface RestoreTransport {
  extensionReachable(): Promise<boolean>;
  restoreViaExtension(snapshot: SnapshotRecord, requestId: string): Promise<{ ok: boolean; error?: string }>;
}

function readWorkspaceSettings(cwd: string): Record<string, unknown> {
  const file = path.join(cwd, ".vscode", "settings.json");
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeWorkspaceSettings(cwd: string, settings: Record<string, unknown>): void {
  const dir = path.join(cwd, ".vscode");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "settings.json"), JSON.stringify(settings, null, 2));
}

/** FS fallback for settings.restore when Extension is offline (Q1) */
export function restoreSettingsViaFilesystem(
  snapshot: SnapshotRecord,
  cwd: string
): RestoreResult {
  const payload = snapshot.payload as Record<string, unknown> | undefined;
  if (!payload) {
    return {
      ok: false,
      error: "Missing snapshot payload",
      code: "SNAPSHOT_UNSUPPORTED",
      httpStatus: CURSOR_ERROR_HTTP_STATUS.SNAPSHOT_UNSUPPORTED,
    };
  }

  const targetLabel = payload.target != null ? String(payload.target) : "workspace";
  if (targetLabel !== "workspace") {
    return {
      ok: false,
      error:
        "Settings FS fallback only supports workspace target; use Extension for global or workspaceFolder",
      code: "EXTENSION_UNREACHABLE",
      httpStatus: CURSOR_ERROR_HTTP_STATUS.EXTENSION_UNREACHABLE,
    };
  }

  if (!isPathAllowed(cwd)) {
    return {
      ok: false,
      error: "Workspace path not in allowlist",
      code: "ALLOWLIST_VIOLATION",
      httpStatus: CURSOR_ERROR_HTTP_STATUS.ALLOWLIST_VIOLATION,
    };
  }

  const section = String(payload.section ?? "");
  const key = String(payload.key ?? "");

  const isFilesystemExecutorPayload =
    payload.previous != null &&
    typeof payload.previous === "object" &&
    !Array.isArray(payload.previous) &&
    payload.target === undefined;

  if (!isFilesystemExecutorPayload && section && key) {
    const settings = readWorkspaceSettings(cwd);
    if (!settings[section]) settings[section] = {};
    (settings[section] as Record<string, unknown>)[key] = payload.previous;
    writeWorkspaceSettings(cwd, settings);
    return { ok: true, snapshotId: snapshot.snapshotId, actionId: snapshot.actionId };
  }

  if (isFilesystemExecutorPayload) {
    writeWorkspaceSettings(cwd, payload.previous as Record<string, unknown>);
    return { ok: true, snapshotId: snapshot.snapshotId, actionId: snapshot.actionId };
  }

  return {
    ok: false,
    error: "Invalid settings snapshot payload",
    code: "SNAPSHOT_UNSUPPORTED",
    httpStatus: CURSOR_ERROR_HTTP_STATUS.SNAPSHOT_UNSUPPORTED,
  };
}

export async function restoreBySnapshot(input: {
  snapshotId: string;
  clientId: string;
  confirmed?: boolean;
  cwd: string;
  requestId: string;
  transport: RestoreTransport;
}): Promise<RestoreResult> {
  const snapshot = getSnapshot(input.snapshotId);
  if (!snapshot) {
    return {
      ok: false,
      error: `Snapshot not found: ${input.snapshotId}`,
      code: "SNAPSHOT_NOT_FOUND",
      httpStatus: CURSOR_ERROR_HTTP_STATUS.SNAPSHOT_NOT_FOUND,
    };
  }

  const gate = evaluateRestoreGate({
    snapshot,
    clientId: input.clientId,
    confirmed: input.confirmed,
  } satisfies RestoreGateInput);

  if (!gate.allowed) {
    return {
      ok: false,
      error: gate.message,
      code: gate.errorCode,
      httpStatus: gate.httpStatus,
    };
  }

  if (!isRestoreableActionId(snapshot.actionId)) {
    return {
      ok: false,
      error: `Restore not supported: ${snapshot.actionId}`,
      code: "SNAPSHOT_UNSUPPORTED",
      httpStatus: CURSOR_ERROR_HTTP_STATUS.SNAPSHOT_UNSUPPORTED,
    };
  }

  if (snapshot.actionId === "cursor.ide.settings.set") {
    if (await input.transport.extensionReachable()) {
      const ext = await input.transport.restoreViaExtension(snapshot, input.requestId);
      if (ext.ok) {
        return { ok: true, snapshotId: snapshot.snapshotId, actionId: snapshot.actionId };
      }
      return {
        ok: false,
        error: ext.error ?? "Extension restore failed",
        code: "METHOD_BLOCKED",
        httpStatus: CURSOR_ERROR_HTTP_STATUS.METHOD_BLOCKED,
      };
    }
    return restoreSettingsViaFilesystem(snapshot, input.cwd);
  }

  if (snapshot.actionId === "cursor.ide.fs.write") {
    if (!(await input.transport.extensionReachable())) {
      return {
        ok: false,
        error: "Extension required for fs.write restore",
        code: "EXTENSION_UNREACHABLE",
        httpStatus: CURSOR_ERROR_HTTP_STATUS.EXTENSION_UNREACHABLE,
      };
    }
    const ext = await input.transport.restoreViaExtension(snapshot, input.requestId);
    if (ext.ok) {
      return { ok: true, snapshotId: snapshot.snapshotId, actionId: snapshot.actionId };
    }
    return {
      ok: false,
      error: ext.error ?? "Extension restore failed",
      code: "METHOD_BLOCKED",
      httpStatus: CURSOR_ERROR_HTTP_STATUS.METHOD_BLOCKED,
    };
  }

  return {
    ok: false,
    error: `Restore not supported: ${snapshot.actionId}`,
    code: "SNAPSHOT_UNSUPPORTED",
    httpStatus: CURSOR_ERROR_HTTP_STATUS.SNAPSHOT_UNSUPPORTED,
  };
}
