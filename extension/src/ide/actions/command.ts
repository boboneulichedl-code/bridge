import * as vscode from "vscode";
import { isWorkbenchCommandAllowed } from "./allowlists";
import { requireNonEmptyString } from "./pathGuard";

export async function executeCommand(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const commandId = requireNonEmptyString(params.commandId, "commandId");
  if (!isWorkbenchCommandAllowed(commandId)) {
    throw new Error("Command not in allowlist");
  }
  const args = Array.isArray(params.args) ? params.args : [];
  await vscode.commands.executeCommand(commandId, ...args);
  return { commandId, executed: true };
}
