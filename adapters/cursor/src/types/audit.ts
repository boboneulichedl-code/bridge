import type { ActionMethod, CursorErrorCode } from "@bridge/shared";

export type AuditResult = "success" | "failure" | "blocked";

export interface AuditEntry {
  id: string;
  actionId: string;
  timestamp: string;
  clientId: string;
  paramsHash: string;
  result: AuditResult;
  methodUsed?: ActionMethod;
  durationMs: number;
  errorCode?: CursorErrorCode;
  snapshotId?: string;
  requestId?: string;
  riskClass?: "external-code" | "destructive" | "read";
  rollbackAvailable: boolean;
  debugPreview?: string;
}

export interface AuditWriteOptions {
  debugPreview?: string;
}
