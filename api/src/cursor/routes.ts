import { CURSOR_API_SPEC } from "@bridge/shared";

/** Stable route → actionId mapping for all 10 P0 actions */
export const CURSOR_ACTION_ROUTE_MAP: Record<string, string> = {
  [`${CURSOR_API_SPEC}/ide/status`]: "cursor.ide.status.get",
  [`${CURSOR_API_SPEC}/ide/workspace/open`]: "cursor.ide.workspace.open",
  [`${CURSOR_API_SPEC}/ide/fs/mkdir`]: "cursor.ide.fs.mkdir",
  [`${CURSOR_API_SPEC}/ide/fs/write`]: "cursor.ide.fs.write",
  [`${CURSOR_API_SPEC}/ide/settings/get`]: "cursor.ide.settings.get",
  [`${CURSOR_API_SPEC}/ide/settings/set`]: "cursor.ide.settings.set",
  [`${CURSOR_API_SPEC}/ide/extension/install`]: "cursor.ide.extension.install",
  [`${CURSOR_API_SPEC}/ide/terminal/run`]: "cursor.ide.terminal.run",
  [`${CURSOR_API_SPEC}/ide/command/execute`]: "cursor.ide.command.execute",
  [`${CURSOR_API_SPEC}/agent/prompt`]: "cursor.agent.prompt.send",
};

export const CURSOR_META_ROUTES = {
  registry: `${CURSOR_API_SPEC}/registry`,
  version: `${CURSOR_API_SPEC}/version`,
  audit: `${CURSOR_API_SPEC}/audit`,
} as const;

export function listCursorActionRoutes(): Array<{ path: string; actionId: string; method: "GET" | "POST" }> {
  return Object.entries(CURSOR_ACTION_ROUTE_MAP).map(([path, actionId]) => ({
    path,
    actionId,
    method: actionId === "cursor.ide.status.get" ? "GET" : "POST",
  }));
}

export function actionIdForCursorPath(pathname: string): string | undefined {
  return CURSOR_ACTION_ROUTE_MAP[pathname];
}
