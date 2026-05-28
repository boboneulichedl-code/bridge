import type { IncomingMessage, ServerResponse } from "node:http";
import * as crypto from "node:crypto";
import {
  CapabilityRouter,
  buildRegistryResponse,
  buildUiModulesResponse,
  evaluateSecurityGate,
  getAction,
  getRegistryVersion,
  loadRegistries,
  restoreBySnapshot,
} from "@bridge/cursor-adapter";
import type { CapabilityRouterResult } from "@bridge/cursor-adapter";
import type { CursorErrorCode, CursorActionId } from "@bridge/shared";
import {
  CURSOR_API_SPEC,
  CURSOR_ERROR_HTTP_STATUS,
  CURSOR_SNAPSHOT_RESTORE_ACTION_ID,
  P0_ROLLBACK_AVAILABLE,
  type CursorActionResponse,
  type CursorWsEvent,
} from "@bridge/shared";
import { isCursorVersionCompatible } from "@bridge/cursor-adapter";
import { appendAuditEntry, listAuditEntries } from "./audit-service";
import {
  createExtensionClientAdapter,
  getExtensionHealth,
  isExtensionReachable,
  restoreViaExtension,
} from "./extension-client";
import {
  CURSOR_META_ROUTES,
  actionIdForCursorPath,
  listCursorActionRoutes,
} from "./routes";

export type JsonResponder = (res: ServerResponse, status: number, body: unknown) => void;
export type BodyReader = (req: IncomingMessage) => Promise<string>;
export type EventBroadcaster = (event: CursorWsEvent) => void;

export interface CursorHandlerDeps {
  getRouter: () => CapabilityRouter;
  getExtensionHealth: typeof getExtensionHealth;
}

let routerSingleton: CapabilityRouter | null = null;

function defaultGetRouter(): CapabilityRouter {
  if (!routerSingleton) {
    loadRegistries();
    routerSingleton = new CapabilityRouter({
      extensionClient: createExtensionClientAdapter(),
      cwd: process.cwd(),
    });
  }
  return routerSingleton;
}

let handlerDeps: CursorHandlerDeps = {
  getRouter: defaultGetRouter,
  getExtensionHealth,
};

export function configureCursorHandlerDeps(overrides: Partial<CursorHandlerDeps>): void {
  handlerDeps = { ...handlerDeps, ...overrides };
}

export function resetCursorHandlerDeps(): void {
  routerSingleton = null;
  handlerDeps = {
    getRouter: defaultGetRouter,
    getExtensionHealth,
  };
}

export { listCursorActionRoutes, actionIdForCursorPath, CURSOR_META_ROUTES };

function clientIdFrom(req: IncomingMessage): string {
  return (
    (req.headers["x-bridge-client-id"] as string) ||
    process.env.BRIDGE_DEFAULT_CLIENT_ID ||
    "bridge-default"
  );
}

function rollbackForAction(actionId: CursorActionId): boolean {
  const def = getAction(actionId);
  return def?.rollbackAvailable === true;
}

function actionResponse<T>(
  actionId: CursorActionId,
  ok: boolean,
  extra: Partial<CursorActionResponse<T>> = {}
): CursorActionResponse<T> {
  return {
    ok,
    actionId,
    rollbackAvailable: rollbackForAction(actionId),
    ...extra,
  };
}

function httpStatusForResult(result: CapabilityRouterResult): number {
  if (result.ok) return 200;
  if (result.code) return CURSOR_ERROR_HTTP_STATUS[result.code] ?? 500;
  return 500;
}

function blockResponse(
  res: ServerResponse,
  json: JsonResponder,
  input: {
    actionId: CursorActionId;
    clientId: string;
    params: Record<string, unknown>;
    requestId: string;
    gate: ReturnType<typeof evaluateSecurityGate>;
    started: number;
  }
): void {
  appendAuditEntry({
    actionId: input.actionId,
    clientId: input.clientId,
    params: input.params,
    result: "blocked",
    durationMs: Date.now() - input.started,
    errorCode: input.gate.errorCode as CursorErrorCode | undefined,
    requestId: input.requestId,
    riskClass: input.gate.riskClass,
  });
  json(
    res,
    input.gate.httpStatus ?? 403,
    actionResponse(input.actionId, false, {
      error: input.gate.message,
      code: input.gate.errorCode as CursorErrorCode | undefined,
    })
  );
}

async function runAction(
  req: IncomingMessage,
  res: ServerResponse,
  json: JsonResponder,
  actionId: CursorActionId,
  params: Record<string, unknown>,
  broadcast?: EventBroadcaster
): Promise<void> {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  const clientId = clientIdFrom(req);

  let cursorVersion: string | undefined;
  try {
    const health = await handlerDeps.getExtensionHealth();
    cursorVersion = health.cursorVersion;
  } catch {
    /* extension offline */
  }

  const gate = evaluateSecurityGate({
    actionId,
    params,
    clientId,
    confirmed: params.confirmed === true,
    cursorVersion,
  });

  if (!gate.allowed) {
    blockResponse(res, json, { actionId, clientId, params, requestId, gate, started });
    return;
  }

  const routedParams = gate.params ?? params;
  const result = await handlerDeps.getRouter().execute({
    actionId,
    params: routedParams,
    clientId,
    requestId,
    forceCli: params.forceCli === true,
    cursorVersion,
    gate,
    riskClass: gate.riskClass,
  });

  const auditResult = result.ok ? "success" : "failure";
  appendAuditEntry({
    actionId,
    clientId,
    params: routedParams,
    result: auditResult,
    methodUsed: result.methodUsed,
    durationMs: Date.now() - started,
    snapshotId: result.snapshotId,
    requestId,
    riskClass: gate.riskClass,
    errorCode: result.ok ? undefined : result.code,
  });

  if (broadcast) {
    broadcast({
      type: "cursor.action.done",
      actionId,
      result: auditResult,
      durationMs: Date.now() - started,
      riskClass: gate.riskClass,
    });
  }

  json(
    res,
    httpStatusForResult(result),
    actionResponse(actionId, result.ok, {
      data: result.data,
      error: result.error,
      code: result.code,
      methodUsed: result.methodUsed,
      snapshotId: result.snapshotId,
      jobId: actionId === "cursor.agent.prompt.send" && result.ok ? requestId : undefined,
    })
  );
}

export async function handleCursorApi(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  json: JsonResponder,
  readBody: BodyReader,
  broadcast?: EventBroadcaster
): Promise<boolean> {
  if (!pathname.startsWith(CURSOR_API_SPEC)) return false;

  loadRegistries();

  if (pathname === CURSOR_META_ROUTES.registry && req.method === "GET") {
    json(res, 200, buildRegistryResponse());
    return true;
  }

  if (pathname === CURSOR_META_ROUTES.uiModules && req.method === "GET") {
    json(res, 200, buildUiModulesResponse());
    return true;
  }

  if (pathname === CURSOR_META_ROUTES.version && req.method === "GET") {
    let extensionHostVersion: string | undefined;
    let cursorVersion: string | undefined;
    try {
      const health = await handlerDeps.getExtensionHealth();
      extensionHostVersion = health.extensionVersion;
      cursorVersion = health.cursorVersion;
    } catch {
      /* offline */
    }
    const actions = buildRegistryResponse().actions;
    const compatibleActions = actions
      .filter((a) => {
        const def = getAction(a.actionId);
        if (!def || !cursorVersion) return !cursorVersion;
        return isCursorVersionCompatible(cursorVersion, def.supportedCursorVersions);
      })
      .map((a) => a.actionId);

    json(res, 200, {
      registryVersion: getRegistryVersion(),
      extensionHostVersion,
      cursorVersion,
      compatibleActions,
      snapshotRestoreAvailable: P0_ROLLBACK_AVAILABLE,
      rollbackAvailable: P0_ROLLBACK_AVAILABLE,
    });
    return true;
  }

  if (pathname === CURSOR_META_ROUTES.audit && req.method === "GET") {
    const url = new URL(req.url || "", "http://localhost");
    const limit = Number(url.searchParams.get("limit") || 50);
    const actionId = url.searchParams.get("actionId") || undefined;
    json(res, 200, {
      entries: listAuditEntries(limit, actionId),
      limit,
    });
    return true;
  }

  if (pathname.startsWith(`${CURSOR_API_SPEC}/snapshots/`) && req.method === "POST") {
    const match = pathname.match(
      new RegExp(`^${CURSOR_API_SPEC.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/snapshots/([^/]+)/restore$`)
    );
    if (!match) {
      json(res, 404, {
        ok: false,
        error: "Not found",
        code: "SNAPSHOT_NOT_FOUND",
        rollbackAvailable: P0_ROLLBACK_AVAILABLE,
      });
      return true;
    }

    const snapshotId = match[1]!;
    const started = Date.now();
    const requestId = crypto.randomUUID();
    const clientId = clientIdFrom(req);

    const raw = await readBody(req);
    let params: Record<string, unknown>;
    try {
      params = JSON.parse(raw || "{}") as Record<string, unknown>;
    } catch {
      json(res, 400, {
        ok: false,
        error: "Invalid JSON body",
        code: "ACTION_UNKNOWN",
        rollbackAvailable: P0_ROLLBACK_AVAILABLE,
      });
      return true;
    }

    const result = await restoreBySnapshot({
      snapshotId,
      clientId,
      confirmed: params.confirmed === true,
      cwd: typeof params.cwd === "string" ? params.cwd : process.cwd(),
      requestId,
      transport: {
        extensionReachable: isExtensionReachable,
        restoreViaExtension,
      },
    });

    const auditResult = result.ok ? "success" : "failure";
    appendAuditEntry({
      actionId: CURSOR_SNAPSHOT_RESTORE_ACTION_ID,
      clientId,
      params: { snapshotId, confirmed: params.confirmed === true },
      result: auditResult,
      durationMs: Date.now() - started,
      snapshotId: result.ok ? snapshotId : undefined,
      requestId,
      errorCode: result.ok ? undefined : (result.code as CursorErrorCode | undefined),
      riskClass: "destructive",
    });

    if (result.ok) {
      json(res, 200, {
        ok: true,
        snapshotId,
        actionId: result.actionId,
        rollbackAvailable: true,
      });
    } else {
      json(res, result.httpStatus ?? 500, {
        ok: false,
        error: result.error,
        code: result.code ?? "METHOD_BLOCKED",
        rollbackAvailable: P0_ROLLBACK_AVAILABLE,
      });
    }
    return true;
  }

  const actionId = actionIdForCursorPath(pathname);
  if (!actionId) {
    json(res, 404, { ok: false, error: "Not found", rollbackAvailable: false });
    return true;
  }

  const typedActionId = actionId as CursorActionId;

  if (typedActionId === "cursor.ide.status.get" && req.method === "GET") {
    await runAction(req, res, json, typedActionId, {}, broadcast);
    return true;
  }

  if (req.method === "POST") {
    const raw = await readBody(req);
    let params: Record<string, unknown>;
    try {
      params = JSON.parse(raw || "{}") as Record<string, unknown>;
    } catch {
      json(res, 400, {
        ok: false,
        error: "Invalid JSON body",
        rollbackAvailable: false,
      });
      return true;
    }
    await runAction(req, res, json, typedActionId, params, broadcast);
    return true;
  }

  json(res, 405, { ok: false, error: "Method not allowed", rollbackAvailable: false });
  return true;
}
