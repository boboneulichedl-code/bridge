import type { IpcExecuteResponse, IpcHealthResponse, IpcRestoreResponse } from "@bridge/shared";
import { isRestoreableActionId } from "@bridge/shared";
import { isCursorActionId } from "@bridge/shared";
import { IPC_CAPABILITIES, IPC_MAX_BODY_BYTES, IPC_ROUTES, IPC_TOKEN_HEADER } from "./constants";

export interface IpcHandlerContext {
  extensionVersion: string;
  cursorVersion: string;
  port: number;
  pid: number;
  tokenMatches: (token: string | undefined) => boolean;
  /** Test override — bypasses VS Code action handlers */
  executeAction?: (
    actionId: string,
    params: Record<string, unknown>,
    requestId: string
  ) => Promise<IpcExecuteResponse>;
}

export interface IpcHttpResponse {
  status: number;
  body: unknown;
}

function unauthorized(): IpcHttpResponse {
  return { status: 401, body: { ok: false, error: "Unauthorized" } };
}

function notFound(): IpcHttpResponse {
  return { status: 404, body: { ok: false, error: "Not found" } };
}

export function buildHealthResponse(ctx: IpcHandlerContext): IpcHealthResponse {
  return {
    ok: true,
    extensionVersion: ctx.extensionVersion,
    cursorVersion: ctx.cursorVersion,
    pid: ctx.pid,
    port: ctx.port,
  };
}

export function buildCapabilitiesResponse(): { methods: readonly string[] } {
  return { methods: [...IPC_CAPABILITIES] };
}

export function validateExecuteBody(body: Record<string, unknown>): {
  ok: true;
  actionId: string;
  params: Record<string, unknown>;
  requestId: string;
} | { ok: false; error: string; status: number } {
  const actionId = String(body.actionId ?? "");
  const requestId = body.requestId != null ? String(body.requestId) : "";

  if (!actionId || !isCursorActionId(actionId)) {
    return {
      ok: false,
      status: 400,
      error: `Unknown or missing actionId: ${actionId || "(empty)"}`,
    };
  }
  if (!requestId) {
    return { ok: false, status: 400, error: "requestId is required" };
  }

  return {
    ok: true,
    actionId,
    params: (body.params as Record<string, unknown>) ?? {},
    requestId,
  };
}

export async function executeActionRequest(
  body: Record<string, unknown>,
  ctx: IpcHandlerContext
): Promise<IpcExecuteResponse> {
  const validated = validateExecuteBody(body);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  if (ctx.executeAction) {
    return ctx.executeAction(validated.actionId, validated.params, validated.requestId);
  }

  const rejection = (await import("../actions/dispatchPolicy")).getExtensionActionRejection(
    validated.actionId
  );
  if (rejection) {
    return { ok: false, error: rejection };
  }

  const { dispatchExtensionAction, toIpcExecuteResponse } = await import("../actions/dispatch");
  const result = await dispatchExtensionAction(validated.actionId, validated.params, {
    extensionVersion: ctx.extensionVersion,
  });
  return toIpcExecuteResponse(result);
}

export async function handleIpcRequest(input: {
  method: string;
  pathname: string;
  headers: Record<string, string | string[] | undefined>;
  body?: Record<string, unknown>;
  bodyLength?: number;
  ctx: IpcHandlerContext;
}): Promise<IpcHttpResponse> {
  const tokenHeader = input.headers[IPC_TOKEN_HEADER];
  const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
  if (!input.ctx.tokenMatches(token)) {
    return unauthorized();
  }

  if (input.bodyLength != null && input.bodyLength > IPC_MAX_BODY_BYTES) {
    return { status: 413, body: { ok: false, error: "Request body too large" } };
  }

  const path = input.pathname.split("?")[0] || "/";

  if (path === IPC_ROUTES.health && input.method === "GET") {
    return { status: 200, body: buildHealthResponse(input.ctx) };
  }

  if (path === IPC_ROUTES.capabilities && input.method === "GET") {
    return { status: 200, body: buildCapabilitiesResponse() };
  }

  if (path === IPC_ROUTES.execute && input.method === "POST") {
    const body = input.body ?? {};
    const result = await executeActionRequest(body, input.ctx);
    return { status: result.ok ? 200 : 500, body: result };
  }

  if (path === IPC_ROUTES.snapshotRestore && input.method === "POST") {
    const body = input.body ?? {};
    const result = await restoreSnapshotRequest(body, input.ctx);
    return { status: result.ok ? 200 : 500, body: result };
  }

  return notFound();
}

export function validateRestoreBody(body: Record<string, unknown>): {
  ok: true;
  actionId: string;
  payload: unknown;
  requestId: string;
} | { ok: false; error: string; status: number } {
  const actionId = String(body.actionId ?? "");
  const requestId = body.requestId != null ? String(body.requestId) : "";

  if (!actionId || !isRestoreableActionId(actionId)) {
    return {
      ok: false,
      status: 400,
      error: `Unsupported or missing actionId for restore: ${actionId || "(empty)"}`,
    };
  }
  if (!requestId) {
    return { ok: false, status: 400, error: "requestId is required" };
  }
  if (body.payload === undefined) {
    return { ok: false, status: 400, error: "payload is required" };
  }

  return { ok: true, actionId, payload: body.payload, requestId };
}

export async function restoreSnapshotRequest(
  body: Record<string, unknown>,
  ctx: IpcHandlerContext
): Promise<IpcRestoreResponse> {
  const validated = validateRestoreBody(body);
  if (!validated.ok) {
    return { ok: false, error: validated.error };
  }

  if (ctx.executeAction) {
    return { ok: true };
  }

  const { restoreFromSnapshot } = await import("../actions/restore");
  return restoreFromSnapshot({
    actionId: validated.actionId,
    payload: validated.payload,
  });
}
