import { getTerminalWhitelist } from "../registry/load-registry";

export function normalizeTerminalCommand(command: string): string {
  return command.trim().replace(/\s+/g, " ");
}

export function isTerminalCommandAllowed(command: string): boolean {
  const normalized = normalizeTerminalCommand(command);
  const reg = getTerminalWhitelist();
  return reg.allowedCommands.includes(normalized);
}

export function listAllowedTerminalCommands(): string[] {
  return [...getTerminalWhitelist().allowedCommands];
}
