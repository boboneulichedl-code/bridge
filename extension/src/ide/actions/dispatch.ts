import type { IpcExecuteResponse } from "@bridge/shared";
import type { ExtensionExecutorActionId } from "./allowlists";
import { getExtensionActionRejection } from "./dispatchPolicy";
import { getIdeStatus } from "./status";
import { openWorkspace } from "./workspace";
import { mkdirAction, writeFileAction } from "./fs";
import { getSetting, setSetting } from "./settings";
import { installExtension } from "./extension";
import { runTerminalCommand } from "./terminal";
import { executeCommand } from "./command";

export interface DispatchContext {
  extensionVersion: string;
}

export interface DispatchResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  snapshotPayload?: unknown;
}

export async function dispatchExtensionAction(
  actionId: string,
  params: Record<string, unknown>,
  ctx: DispatchContext
): Promise<DispatchResult> {
  const rejection = getExtensionActionRejection(actionId);
  if (rejection) {
    return { ok: false, error: rejection };
  }

  try {
    return await runHandler(actionId as ExtensionExecutorActionId, params, ctx);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function runHandler(
  actionId: ExtensionExecutorActionId,
  params: Record<string, unknown>,
  ctx: DispatchContext
): Promise<DispatchResult> {
  switch (actionId) {
    case "cursor.ide.status.get":
      return { ok: true, data: await getIdeStatus(ctx.extensionVersion) };
    case "cursor.ide.workspace.open": {
      const r = await openWorkspace(params);
      return { ok: true, data: r.data, snapshotPayload: r.snapshotPayload };
    }
    case "cursor.ide.fs.mkdir":
      return { ok: true, data: await mkdirAction(params) };
    case "cursor.ide.fs.write": {
      const r = await writeFileAction(params);
      return { ok: true, data: r.data, snapshotPayload: r.snapshotPayload };
    }
    case "cursor.ide.settings.get":
      return { ok: true, data: await getSetting(params) };
    case "cursor.ide.settings.set": {
      const r = await setSetting(params);
      return { ok: true, data: r.data, snapshotPayload: r.snapshotPayload };
    }
    case "cursor.ide.extension.install":
      return { ok: true, data: await installExtension(params) };
    case "cursor.ide.terminal.run":
      return { ok: true, data: await runTerminalCommand(params) };
    case "cursor.ide.command.execute":
      return { ok: true, data: await executeCommand(params) };
    default: {
      const _exhaustive: never = actionId;
      return { ok: false, error: `Unhandled action: ${_exhaustive}` };
    }
  }
}

export function toIpcExecuteResponse(result: DispatchResult): IpcExecuteResponse {
  return {
    ok: result.ok,
    data: result.data,
    error: result.error,
    snapshotPayload: result.snapshotPayload,
  };
}
