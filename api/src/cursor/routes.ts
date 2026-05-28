import { CURSOR_API_ROUTES } from "@bridge/shared";

/** Stable route → actionId mapping for all 10 P0 actions */
export const CURSOR_ACTION_ROUTE_MAP: Record<string, string> = {
  [`${CURSOR_API_ROUTES.status}`]: "cursor.ide.status.get",
  [`${CURSOR_API_ROUTES.workspaceOpen}`]: "cursor.ide.workspace.open",
  [`${CURSOR_API_ROUTES.fsMkdir}`]: "cursor.ide.fs.mkdir",
  [`${CURSOR_API_ROUTES.fsWrite}`]: "cursor.ide.fs.write",
  [`${CURSOR_API_ROUTES.settingsGet}`]: "cursor.ide.settings.get",
  [`${CURSOR_API_ROUTES.settingsSet}`]: "cursor.ide.settings.set",
  [`${CURSOR_API_ROUTES.extensionInstall}`]: "cursor.ide.extension.install",
  [`${CURSOR_API_ROUTES.terminalRun}`]: "cursor.ide.terminal.run",
  [`${CURSOR_API_ROUTES.commandExecute}`]: "cursor.ide.command.execute",
  [`${CURSOR_API_ROUTES.agentPrompt}`]: "cursor.agent.prompt.send",
};

export const CURSOR_META_ROUTES = {
  registry: CURSOR_API_ROUTES.registry,
  version: CURSOR_API_ROUTES.version,
  audit: CURSOR_API_ROUTES.audit,
  uiModules: CURSOR_API_ROUTES.uiModules,
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
