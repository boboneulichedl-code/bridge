/** P0 action IDs executable in Extension (1–9). Action 10 is CLI/API primary. */
export const EXTENSION_EXECUTOR_ACTION_IDS = [
  "cursor.ide.status.get",
  "cursor.ide.workspace.open",
  "cursor.ide.fs.mkdir",
  "cursor.ide.fs.write",
  "cursor.ide.settings.get",
  "cursor.ide.settings.set",
  "cursor.ide.extension.install",
  "cursor.ide.terminal.run",
  "cursor.ide.command.execute",
] as const;

export type ExtensionExecutorActionId = (typeof EXTENSION_EXECUTOR_ACTION_IDS)[number];

export function isExtensionExecutorActionId(
  actionId: string
): actionId is ExtensionExecutorActionId {
  return (EXTENSION_EXECUTOR_ACTION_IDS as readonly string[]).includes(actionId);
}

/** Exact terminal whitelist (P0) — defense in depth inside extension */
export const TERMINAL_COMMAND_ALLOWLIST = [
  "npm run build",
  "npm test",
  "npm run test",
  "git status",
  "git diff",
  "git log",
] as const;

export function normalizeTerminalCommand(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

export function isTerminalCommandAllowed(command: string): boolean {
  return (TERMINAL_COMMAND_ALLOWLIST as readonly string[]).includes(
    normalizeTerminalCommand(command)
  );
}

/** Workbench command allowlist (P0) */
export const WORKBENCH_COMMAND_ALLOWLIST = [
  "workbench.action.terminal.new",
  "workbench.action.files.saveAll",
  "workbench.action.closeActiveEditor",
  "workbench.view.explorer",
  "workbench.view.scm",
  "workbench.actions.view.problems",
  "workbench.action.tasks.runTask",
] as const;

export function isWorkbenchCommandAllowed(commandId: string): boolean {
  return (WORKBENCH_COMMAND_ALLOWLIST as readonly string[]).includes(commandId);
}
