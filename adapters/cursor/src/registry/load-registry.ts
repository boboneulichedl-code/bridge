import * as fs from "node:fs";
import * as path from "node:path";
import type {
  ActionsRegistry,
  CommandsRegistry,
  PermissionsRegistry,
  TerminalWhitelistRegistry,
} from "../types/action";

let cached: {
  actions: ActionsRegistry;
  commands: CommandsRegistry;
  terminal: TerminalWhitelistRegistry;
  permissions: PermissionsRegistry;
} | null = null;

function registryDir(): string {
  const fromEnv = process.env.BRIDGE_CURSOR_REGISTRY_DIR;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  const dist = path.join(__dirname, "..", "registry");
  if (fs.existsSync(dist)) return dist;
  return path.join(__dirname, "..", "..", "registry");
}

function loadJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(registryDir(), file), "utf8")) as T;
}

export function loadRegistries(): void {
  cached = {
    actions: loadJson<ActionsRegistry>("poc-v1-actions.json"),
    commands: loadJson<CommandsRegistry>("poc-v1-commands.json"),
    terminal: loadJson<TerminalWhitelistRegistry>("poc-v1-terminal-whitelist.json"),
    permissions: loadJson<PermissionsRegistry>("poc-v1-permissions.json"),
  };
}

function ensureLoaded(): NonNullable<typeof cached> {
  if (!cached) loadRegistries();
  return cached!;
}

export function getRegistryVersion(): string {
  return ensureLoaded().actions.registryVersion;
}

export function getAction(actionId: string) {
  return ensureLoaded().actions.actions.find((a) => a.actionId === actionId);
}

export function listActions() {
  return ensureLoaded().actions.actions;
}

export function getCommandsRegistry(): CommandsRegistry {
  return ensureLoaded().commands;
}

export function getTerminalWhitelist(): TerminalWhitelistRegistry {
  return ensureLoaded().terminal;
}

export function getPermissionsRegistry(): PermissionsRegistry {
  return ensureLoaded().permissions;
}

export function getClientPermissions(clientId: string): string[] {
  const reg = getPermissionsRegistry();
  const entry = reg.clients[clientId] ?? reg.clients[reg.defaultClientId];
  return entry?.permissions ?? [];
}

/** Test helper */
export function resetRegistryCache(): void {
  cached = null;
}
