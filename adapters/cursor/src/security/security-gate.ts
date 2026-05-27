import { getAction, getClientPermissions } from "../registry/load-registry";
import type { ActionDefinition } from "../types/action";
import { isCursorActionId, type CursorErrorCode } from "@bridge/shared";
import { pathFieldsForAction, actionRequiresPathAllowlist } from "./action-path-policy";
import { normalizeAgentParams } from "./agent-policy";
import { isCommandAllowed } from "./command-allowlist";
import { isPathAllowed } from "./path-allowlist";
import {
  securityGateAllowed,
  securityGateDenied,
  type SecurityGateInput,
  type SecurityGateResult,
} from "./types";
import { isTerminalCommandAllowed } from "./terminal-whitelist";
import { isCursorVersionCompatible } from "../version/compatibility";

function needsConfirmationForAction(
  action: ActionDefinition,
  params: Record<string, unknown>
): boolean {
  if (action.externalCode) return true;
  if (action.needsConfirmation) return true;
  if (action.needsConfirmationOnOverwrite && params.overwriteExisting === true) {
    return true;
  }
  return false;
}

function deriveRiskClass(
  action: ActionDefinition
): "external-code" | "destructive" | "read" {
  if (action.externalCode) return "external-code";
  if (action.destructive) return "destructive";
  return "read";
}

function isConfirmed(input: SecurityGateInput): boolean {
  return input.confirmed === true || input.params.confirmed === true;
}

/**
 * P0 Security Gate — registry, version, permissions, allowlists, confirmation.
 * Does not execute actions or route to extension/CLI.
 */
export function evaluateSecurityGate(input: SecurityGateInput): SecurityGateResult {
  if (!isCursorActionId(input.actionId)) {
    return securityGateDenied("ACTION_UNKNOWN", `Unknown action: ${input.actionId}`);
  }

  const action = getAction(input.actionId);
  if (!action) {
    return securityGateDenied("ACTION_UNKNOWN", `Action not in registry: ${input.actionId}`);
  }

  if (
    input.cursorVersion &&
    !isCursorVersionCompatible(input.cursorVersion, action.supportedCursorVersions)
  ) {
    return securityGateDenied(
      "VERSION_INCOMPATIBLE",
      `Cursor version ${input.cursorVersion} not compatible`
    );
  }

  const perms = getClientPermissions(input.clientId);
  if (!perms.includes(action.requiredPermission)) {
    return securityGateDenied(
      "PERMISSION_DENIED",
      `Missing permission: ${action.requiredPermission}`
    );
  }

  if (actionRequiresPathAllowlist(input.actionId)) {
    for (const field of pathFieldsForAction(input.actionId)) {
      const value = input.params[field];
      if (typeof value === "string" && value && !isPathAllowed(value)) {
        return securityGateDenied(
          "ALLOWLIST_VIOLATION",
          `Path not in allowlist: ${field}`
        );
      }
    }
    const pathValue = input.params.path;
    if (
      fieldRequiresPath(input.actionId) &&
      (typeof pathValue !== "string" || !pathValue)
    ) {
      return securityGateDenied("ALLOWLIST_VIOLATION", "path is required");
    }
  }

  if (input.actionId === "cursor.ide.command.execute") {
    const commandId = input.params.commandId;
    if (typeof commandId !== "string" || !isCommandAllowed(commandId)) {
      return securityGateDenied("ALLOWLIST_VIOLATION", "Command not in allowlist");
    }
  }

  if (input.actionId === "cursor.ide.terminal.run") {
    const command = input.params.command;
    if (typeof command !== "string" || !command) {
      return securityGateDenied("ALLOWLIST_VIOLATION", "Terminal command is required");
    }
    if (!isTerminalCommandAllowed(command)) {
      return securityGateDenied(
        "ALLOWLIST_VIOLATION",
        "Terminal command not in whitelist"
      );
    }
  }

  if (needsConfirmationForAction(action, input.params) && !isConfirmed(input)) {
    return securityGateDenied(
      "CONFIRMATION_REQUIRED",
      "User confirmation required (confirmed: true)",
      deriveRiskClass(action)
    );
  }

  let params = { ...input.params };
  if (input.actionId === "cursor.agent.prompt.send") {
    params = normalizeAgentParams(params);
  }

  return securityGateAllowed(params, deriveRiskClass(action));
}

function fieldRequiresPath(actionId: string): boolean {
  return (
    actionId === "cursor.ide.workspace.open" ||
    actionId === "cursor.ide.fs.mkdir" ||
    actionId === "cursor.ide.fs.write"
  );
}

/** Map gate result to stable error code for audit/logging */
export function gateErrorCode(result: SecurityGateResult): CursorErrorCode | undefined {
  return result.allowed ? undefined : result.errorCode;
}
