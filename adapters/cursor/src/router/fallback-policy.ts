import type { ActionMethod } from "@bridge/shared";
import type { ActionDefinition, FallbackMethod } from "../types/action";

export interface FallbackContext {
  extensionReachable: boolean;
  primaryMethod: ActionMethod;
  primaryAttempted: boolean;
  primaryOk: boolean;
  cliUnavailable: boolean;
}

/** Only registry-documented fallbacks; never invent methods */
export function listEligibleFallbackMethods(
  action: ActionDefinition,
  ctx: FallbackContext
): ActionMethod[] {
  const methods: ActionMethod[] = [];
  for (const fb of action.fallbackMethods) {
    if (isFallbackEligible(fb, ctx) && !methods.includes(fb.method)) {
      methods.push(fb.method);
    }
  }
  return methods;
}

export function isFallbackEligible(fb: FallbackMethod, ctx: FallbackContext): boolean {
  const when = fb.when ?? "extension-unreachable";
  switch (when) {
    case "extension-unreachable":
      return !ctx.extensionReachable;
    case "extension-command-failed":
      return (
        ctx.extensionReachable &&
        ctx.primaryMethod === "extension-command" &&
        ctx.primaryAttempted &&
        !ctx.primaryOk
      );
    case "cli-unavailable":
      return ctx.primaryMethod === "cli" && ctx.primaryAttempted && !ctx.primaryOk;
    default:
      return false;
  }
}

export function isPrimaryApplicable(
  action: ActionDefinition,
  extensionReachable: boolean
): boolean {
  switch (action.method) {
    case "extension-api":
    case "extension-command":
      return extensionReachable;
    case "cli":
    case "filesystem":
      return true;
    default:
      return false;
  }
}

export function resolveExecutorMethod(method: ActionMethod): ActionMethod {
  if (method === "extension-command") return "extension-api";
  return method;
}
