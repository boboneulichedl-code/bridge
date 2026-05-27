import type { ActionMethod, ActionPermission } from "@bridge/shared";

export type ActionDomain = "ide" | "agent" | "config" | "integration";
export type ActionStability = "stable" | "probable" | "experimental" | "unsupported";

export interface FallbackMethod {
  method: ActionMethod;
  when?: string;
  command?: string;
  guard?: string;
  path?: string;
  actions?: string[];
  stability?: string;
}

export interface ActionDefinition {
  actionId: string;
  domain: ActionDomain;
  method: ActionMethod;
  stability: ActionStability;
  requiredPermission: ActionPermission;
  destructive: boolean;
  needsConfirmation: boolean;
  needsConfirmationOnOverwrite?: boolean;
  externalCode?: boolean;
  rollbackPossible: boolean;
  rollbackAvailable: boolean;
  supportedCursorVersions: string[];
  fallbackMethods: FallbackMethod[];
}

export interface ActionsRegistry {
  registryVersion: string;
  adapterId: string;
  rollbackAvailable: boolean;
  actions: ActionDefinition[];
}

export interface CommandsRegistry {
  version: string;
  allowedCommands: Array<{ commandId: string; description?: string }>;
}

export interface TerminalWhitelistRegistry {
  version: string;
  matchMode: "exact";
  allowedCommands: string[];
}

export interface PermissionsRegistry {
  version: string;
  defaultClientId: string;
  clients: Record<string, { permissions: ActionPermission[] }>;
}

export interface ActionExecutor {
  method: import("@bridge/shared").ActionMethod;
  canExecute(ctx: ExecutionContext): Promise<boolean>;
  execute(ctx: ExecutionContext): Promise<ActionResult>;
}

export interface ActionResult {
  ok: boolean;
  data?: unknown;
  error?: string;
  methodUsed: ActionMethod;
  snapshotPayload?: unknown;
}

export interface ExecutionContext {
  actionId: string;
  action: ActionDefinition;
  params: Record<string, unknown>;
  clientId: string;
  requestId: string;
  cursorVersion?: string;
  extensionReachable: boolean;
  forceCli?: boolean;
  cwd: string;
  /** Agent action 10 — extension fallback after CLI failure */
  agentExtensionFallback?: boolean;
}

export const ROLLBACK_AVAILABLE = true as const;
