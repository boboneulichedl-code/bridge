import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  debugPreview,
  hashRedactedParams,
} from "@bridge/cursor-adapter";
import type { AuditEntry } from "@bridge/cursor-adapter";
import type { ActionMethod, CursorErrorCode, RollbackAvailableP0 } from "@bridge/shared";
import { P0_ROLLBACK_AVAILABLE } from "@bridge/shared";
import { ensureAuditDir, getAuditDir } from "@bridge/shared";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ring: AuditEntry[] = [];

const SENSITIVE_PLAINTEXT_KEYS = [
  "prompt",
  "content",
  "command",
  "value",
  "path",
  "cwd",
] as const;

function auditFilePath(): string {
  return path.join(ensureAuditDir(), "cursor-actions.jsonl");
}

function rotateIfNeeded(file: string): void {
  try {
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_FILE_BYTES) {
      const rotated = `${file}.${Date.now()}.archive`;
      fs.renameSync(file, rotated);
    }
  } catch {
    /* ignore */
  }
}

export function appendAuditEntry(input: {
  actionId: string;
  clientId: string;
  params: Record<string, unknown>;
  result: AuditEntry["result"];
  methodUsed?: ActionMethod;
  durationMs: number;
  errorCode?: CursorErrorCode;
  snapshotId?: string;
  requestId?: string;
  riskClass?: AuditEntry["riskClass"];
}): AuditEntry {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    actionId: input.actionId,
    timestamp: new Date().toISOString(),
    clientId: input.clientId,
    paramsHash: hashRedactedParams(input.actionId, input.params),
    result: input.result,
    methodUsed: input.methodUsed,
    durationMs: input.durationMs,
    errorCode: input.errorCode,
    snapshotId: input.snapshotId,
    requestId: input.requestId,
    riskClass: input.riskClass,
    rollbackAvailable: P0_ROLLBACK_AVAILABLE as RollbackAvailableP0,
    debugPreview: debugPreview(input.params),
  };

  ring.unshift(entry);
  if (ring.length > 100) ring.pop();

  const file = auditFilePath();
  rotateIfNeeded(file);
  fs.appendFileSync(file, JSON.stringify(entry) + "\n", { mode: 0o600 });

  return entry;
}

export function listAuditEntries(limit = 50, actionId?: string): AuditEntry[] {
  const fromRing = ring.filter((e) => !actionId || e.actionId === actionId);
  if (fromRing.length >= limit) return fromRing.slice(0, limit);

  const file = path.join(getAuditDir(), "cursor-actions.jsonl");
  if (!fs.existsSync(file)) return fromRing.slice(0, limit);

  const lines = fs.readFileSync(file, "utf8").trim().split("\n").filter(Boolean);
  const fromFile: AuditEntry[] = [];
  for (let i = lines.length - 1; i >= 0 && fromFile.length < limit; i--) {
    try {
      const e = JSON.parse(lines[i]!) as AuditEntry;
      if (!actionId || e.actionId === actionId) fromFile.push(e);
    } catch {
      /* skip */
    }
  }

  const seen = new Set<string>();
  const merged = [...fromRing, ...fromFile].filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
  return merged.slice(0, limit);
}

/** Test helper — verify audit entries never store sensitive plaintext fields */
export function auditEntryContainsSensitivePlaintext(entry: AuditEntry): boolean {
  const serialized = JSON.stringify(entry);
  for (const key of SENSITIVE_PLAINTEXT_KEYS) {
    if (serialized.includes(`"${key}":`)) return true;
  }
  return false;
}

/** Test helper */
export function clearAuditRing(): void {
  ring.length = 0;
}

/** Test helper — remove JSONL audit file in current user config dir */
export function clearAuditFileForTests(): void {
  const file = path.join(getAuditDir(), "cursor-actions.jsonl");
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
