import type { ActionMethod } from "@bridge/shared";
import type { ActionExecutor, ActionResult, ExecutionContext } from "../../types/action";

export type ExtensionClient = {
  isReachable(): Promise<boolean>;
  getHealth(): Promise<{ cursorVersion?: string }>;
  execute(
    actionId: string,
    params: Record<string, unknown>,
    requestId: string
  ): Promise<{ ok: boolean; data?: unknown; error?: string; snapshotPayload?: unknown }>;
};

export function createExtensionExecutor(client: ExtensionClient): ActionExecutor {
  return {
    method: "extension-api",
    async canExecute(ctx) {
      if (!ctx.extensionReachable) return false;
      if (ctx.actionId === "cursor.agent.prompt.send") {
        return ctx.agentExtensionFallback === true;
      }
      return (
        ctx.action.method === "extension-api" || ctx.action.method === "extension-command"
      );
    },
    async execute(ctx): Promise<ActionResult> {
      const methodUsed: ActionMethod =
        ctx.action.method === "extension-command" ||
        (ctx.actionId === "cursor.agent.prompt.send" && ctx.agentExtensionFallback)
          ? "extension-command"
          : "extension-api";
      const result = await client.execute(ctx.actionId, ctx.params, ctx.requestId);
      return {
        ok: result.ok,
        data: result.data,
        error: result.error,
        methodUsed,
        snapshotPayload: result.snapshotPayload,
      };
    },
  };
}
