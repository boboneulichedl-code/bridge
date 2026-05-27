import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { ensureSnapshotsDir, isRestoreableActionId } from "@bridge/shared";
import type { RollbackAvailableP0 } from "@bridge/shared";

export interface SnapshotRecord {
  snapshotId: string;
  actionId: string;
  createdAt: string;
  payload: unknown;
  rollbackAvailable: RollbackAvailableP0;
}

function snapshotRollbackAvailable(actionId: string, payload: unknown): boolean {
  if (!isRestoreableActionId(actionId)) return false;
  if (actionId === "cursor.ide.fs.write") {
    if (!payload || typeof payload !== "object") return false;
    const p = payload as Record<string, unknown>;
    return typeof p.path === "string" && typeof p.content === "string";
  }
  return true;
}

export function createSnapshot(
  actionId: string,
  payload: unknown
): SnapshotRecord {
  const snapshotId = crypto.randomUUID();
  ensureSnapshotsDir();
  const record: SnapshotRecord = {
    snapshotId,
    actionId,
    createdAt: new Date().toISOString(),
    payload,
    rollbackAvailable: snapshotRollbackAvailable(actionId, payload),
  };
  const file = path.join(ensureSnapshotsDir(), `${snapshotId}.json`);
  fs.writeFileSync(file, JSON.stringify(record, null, 2), { mode: 0o600 });
  return record;
}

export function getSnapshot(snapshotId: string): SnapshotRecord | undefined {
  const file = path.join(ensureSnapshotsDir(), `${snapshotId}.json`);
  if (!fs.existsSync(file)) return undefined;
  const raw = JSON.parse(fs.readFileSync(file, "utf8")) as SnapshotRecord;
  return {
    ...raw,
    rollbackAvailable: snapshotRollbackAvailable(raw.actionId, raw.payload),
  };
}
