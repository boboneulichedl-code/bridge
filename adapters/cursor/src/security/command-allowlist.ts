import { getCommandsRegistry } from "../registry/load-registry";

export function isCommandAllowed(commandId: string): boolean {
  const reg = getCommandsRegistry();
  return reg.allowedCommands.some((c) => c.commandId === commandId);
}

export function listAllowedCommandIds(): string[] {
  return getCommandsRegistry().allowedCommands.map((c) => c.commandId);
}
