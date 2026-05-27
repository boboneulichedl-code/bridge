import * as vscode from "vscode";
import { isTerminalCommandAllowed, normalizeTerminalCommand } from "./allowlists";
import { assertPathWithinWorkspace, requireNonEmptyString } from "./pathGuard";

export async function runTerminalCommand(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const command = normalizeTerminalCommand(requireNonEmptyString(params.command, "command"));
  if (!isTerminalCommandAllowed(command)) {
    throw new Error("Terminal command not in whitelist");
  }

  const cwd = params.cwd ? String(params.cwd) : undefined;
  if (cwd) {
    assertPathWithinWorkspace(cwd);
  }

  const name = params.terminalName ? String(params.terminalName) : "bridge";

  let terminal = vscode.window.terminals.find((t) => t.name === name);
  if (!terminal) {
    terminal = vscode.window.createTerminal({ name, cwd });
  }
  terminal.show();
  terminal.sendText(command, true);
  return { sent: true, command, terminalName: name };
}
