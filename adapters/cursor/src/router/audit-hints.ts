import type { AuditRiskClass } from "@bridge/shared";
import { hashRedactedParams } from "../audit/redact-params";
import type { AuditResult } from "../types/audit";

/** Audit payload for Step 7 — router prepares, audit service persists */
export interface RouterAuditHints {
  paramsHash: string;
  result: AuditResult;
  riskClass?: AuditRiskClass;
}

export function prepareRouterAuditHints(input: {
  actionId: string;
  params: Record<string, unknown>;
  ok: boolean;
  riskClass?: AuditRiskClass;
}): RouterAuditHints {
  return {
    paramsHash: hashRedactedParams(input.actionId, input.params),
    result: input.ok ? "success" : "failure",
    riskClass: input.riskClass,
  };
}
