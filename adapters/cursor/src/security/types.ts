import type { CursorErrorCode } from "@bridge/shared";
import { CURSOR_ERROR_HTTP_STATUS } from "@bridge/shared";
import type { AuditRiskClass } from "@bridge/shared";

export interface SecurityGateInput {
  actionId: string;
  params: Record<string, unknown>;
  clientId: string;
  confirmed?: boolean;
  cursorVersion?: string;
}

export interface SecurityGateResult {
  allowed: boolean;
  errorCode?: CursorErrorCode;
  httpStatus?: number;
  message?: string;
  riskClass?: AuditRiskClass;
  /** Normalized params (e.g. agent allowFileChanges default) */
  params?: Record<string, unknown>;
}

export function securityGateDenied(
  errorCode: CursorErrorCode,
  message: string,
  riskClass?: AuditRiskClass
): SecurityGateResult {
  return {
    allowed: false,
    errorCode,
    httpStatus: CURSOR_ERROR_HTTP_STATUS[errorCode],
    message,
    riskClass,
  };
}

export function securityGateAllowed(
  params: Record<string, unknown>,
  riskClass: AuditRiskClass
): SecurityGateResult {
  return { allowed: true, riskClass, params };
}
