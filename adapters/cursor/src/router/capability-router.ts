import type { ActionMethod, AuditRiskClass, CursorErrorCode } from "@bridge/shared";
import { getAction } from "../registry/load-registry";
import type { ActionExecutor, ActionResult, ExecutionContext } from "../types/action";
import type { SecurityGateResult } from "../security/types";
import { isCursorVersionCompatible } from "../version/compatibility";
import type { ExtensionClient } from "./executors/extension";
import { createExtensionExecutor } from "./executors/extension";
import { createCliExecutor } from "./executors/cli";
import { createFilesystemExecutor } from "./executors/filesystem";
import { createSnapshot } from "../snapshots/snapshot-service";
import { prepareRouterAuditHints, type RouterAuditHints } from "./audit-hints";
import {
  isPrimaryApplicable,
  listEligibleFallbackMethods,
  resolveExecutorMethod,
} from "./fallback-policy";

export interface CapabilityRouterDeps {
  extensionClient: ExtensionClient;
  cwd?: string;
  /** Test override — replaces default executor set */
  executors?: ActionExecutor[];
}

export interface CapabilityRouterExecuteInput {
  actionId: string;
  params: Record<string, unknown>;
  clientId: string;
  requestId: string;
  forceCli?: boolean;
  cursorVersion?: string;
  /** Must be gate-allowed before routing (defense in depth when provided) */
  gate?: SecurityGateResult;
  riskClass?: AuditRiskClass;
}

export interface CapabilityRouterResult {
  ok: boolean;
  actionId: string;
  data?: unknown;
  error?: string;
  code?: CursorErrorCode;
  methodUsed: ActionMethod;
  snapshotId?: string;
  auditHints: RouterAuditHints;
}

function failureResult(
  input: CapabilityRouterExecuteInput,
  methodUsed: ActionMethod,
  error: string,
  code?: CursorErrorCode,
  riskClass?: AuditRiskClass
): CapabilityRouterResult {
  return {
    ok: false,
    actionId: input.actionId,
    error,
    code,
    methodUsed,
    auditHints: prepareRouterAuditHints({
      actionId: input.actionId,
      params: input.params,
      ok: false,
      riskClass,
    }),
  };
}

function successResult(
  input: CapabilityRouterExecuteInput,
  result: ActionResult,
  snapshotId?: string,
  riskClass?: AuditRiskClass
): CapabilityRouterResult {
  return {
    ok: true,
    actionId: input.actionId,
    data: result.data,
    methodUsed: result.methodUsed,
    snapshotId,
    auditHints: prepareRouterAuditHints({
      actionId: input.actionId,
      params: input.params,
      ok: true,
      riskClass,
    }),
  };
}

export class CapabilityRouter {
  private readonly extensionClient: ExtensionClient;
  private readonly cwd: string;
  private readonly executors: ActionExecutor[];

  constructor(deps: CapabilityRouterDeps) {
    this.extensionClient = deps.extensionClient;
    this.cwd = deps.cwd ?? process.cwd();
    this.executors =
      deps.executors ?? [
        createExtensionExecutor(deps.extensionClient),
        createCliExecutor(),
        createFilesystemExecutor(),
      ];
  }

  async execute(input: CapabilityRouterExecuteInput): Promise<CapabilityRouterResult> {
    const riskClass = input.riskClass ?? input.gate?.riskClass;
    const params = input.gate?.params ?? input.params;

    if (input.gate && !input.gate.allowed) {
      return failureResult(
        { ...input, params },
        "extension-api",
        input.gate.message ?? "Security gate denied",
        input.gate.errorCode,
        input.gate.riskClass
      );
    }

    const action = getAction(input.actionId);
    if (!action) {
      return failureResult(
        { ...input, params },
        "extension-api",
        "Action not found",
        "ACTION_UNKNOWN",
        riskClass
      );
    }

    const extensionReachable = await this.extensionClient.isReachable();
    let cursorVersion = input.cursorVersion;
    if (!cursorVersion && extensionReachable) {
      try {
        const health = await this.extensionClient.getHealth();
        cursorVersion = health.cursorVersion;
      } catch {
        /* ignore */
      }
    }

    if (
      cursorVersion &&
      !isCursorVersionCompatible(cursorVersion, action.supportedCursorVersions)
    ) {
      return failureResult(
        { ...input, params },
        action.method,
        `Cursor version ${cursorVersion} not compatible`,
        "VERSION_INCOMPATIBLE",
        riskClass
      );
    }

    const ctx: ExecutionContext = {
      actionId: input.actionId,
      action,
      params,
      clientId: input.clientId,
      requestId: input.requestId,
      cursorVersion,
      extensionReachable,
      forceCli: input.forceCli,
      cwd: this.cwd,
    };

    const primaryApplicable = isPrimaryApplicable(action, extensionReachable);
    let primaryAttempted = false;
    let primaryOk = false;
    let lastResult: ActionResult | undefined;

    if (primaryApplicable) {
      primaryAttempted = true;
      const primaryResult = await this.tryMethod(action.method, ctx);
      if (primaryResult?.ok) {
        primaryOk = true;
        return this.finalize(input, primaryResult, action, riskClass);
      }
      lastResult = primaryResult ?? lastResult;
    }

    const fallbackMethods = listEligibleFallbackMethods(action, {
      extensionReachable,
      primaryMethod: action.method,
      primaryAttempted,
      primaryOk,
      cliUnavailable: primaryAttempted && !primaryOk && action.method === "cli",
    });

    for (const method of fallbackMethods) {
      const fallbackCtx: ExecutionContext = {
        ...ctx,
        agentExtensionFallback:
          input.actionId === "cursor.agent.prompt.send" && method === "extension-command",
      };
      const result = await this.tryMethod(method, fallbackCtx);
      if (result?.ok) {
        return this.finalize(input, result, action, riskClass);
      }
      lastResult = result ?? lastResult;
    }

    if (
      !extensionReachable &&
      (action.method === "extension-api" || action.method === "extension-command") &&
      action.fallbackMethods.length === 0
    ) {
      return failureResult(
        { ...input, params },
        action.method,
        "Extension unreachable and no fallback available",
        "EXTENSION_UNREACHABLE",
        riskClass
      );
    }

    if (!primaryApplicable && !extensionReachable && fallbackMethods.length === 0) {
      return failureResult(
        { ...input, params },
        action.method,
        "Extension unreachable and no fallback available",
        "EXTENSION_UNREACHABLE",
        riskClass
      );
    }

    return failureResult(
      { ...input, params },
      lastResult?.methodUsed ?? action.method,
      lastResult?.error ?? "No executor could handle action",
      "METHOD_BLOCKED",
      riskClass
    );
  }

  private async tryMethod(
    method: ActionMethod,
    ctx: ExecutionContext
  ): Promise<ActionResult | undefined> {
    const executorKey = resolveExecutorMethod(method);
    const executor = this.executors.find((e) => e.method === executorKey);
    if (!executor) return undefined;
    if (!(await executor.canExecute(ctx))) return undefined;
    return executor.execute(ctx);
  }

  private finalize(
    input: CapabilityRouterExecuteInput,
    result: ActionResult,
    action: ReturnType<typeof getAction>,
    riskClass?: AuditRiskClass
  ): CapabilityRouterResult {
    let snapshotId: string | undefined;
    if (action?.rollbackPossible && result.snapshotPayload !== undefined) {
      snapshotId = createSnapshot(input.actionId, result.snapshotPayload).snapshotId;
    }
    return successResult({ ...input, params: input.gate?.params ?? input.params }, result, snapshotId, riskClass);
  }
}

export { prepareRouterAuditHints } from "./audit-hints";
export type { RouterAuditHints } from "./audit-hints";
