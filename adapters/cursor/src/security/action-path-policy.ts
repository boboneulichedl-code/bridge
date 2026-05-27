import type { CursorActionId } from "@bridge/shared";
import { P0_ACTION_IDS } from "@bridge/shared";

const PATH_ACTIONS = new Set<string>([
  "cursor.ide.workspace.open",
  "cursor.ide.fs.mkdir",
  "cursor.ide.fs.write",
  "cursor.ide.terminal.run",
]);

/** Actions that require path/cwd to pass BRIDGE_ALLOWED_PATHS check when provided */
export function actionRequiresPathAllowlist(actionId: string): boolean {
  return PATH_ACTIONS.has(actionId);
}

export function pathFieldsForAction(actionId: string): readonly ("path" | "cwd")[] {
  if (actionId === "cursor.ide.terminal.run") return ["cwd"];
  if (
    actionId === "cursor.ide.workspace.open" ||
    actionId === "cursor.ide.fs.mkdir" ||
    actionId === "cursor.ide.fs.write"
  ) {
    return ["path"];
  }
  return [];
}

export function isP0ActionId(actionId: string): actionId is CursorActionId {
  return (P0_ACTION_IDS as readonly string[]).includes(actionId);
}
