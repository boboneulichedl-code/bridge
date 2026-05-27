import { isExtensionExecutorActionId } from "./allowlists";

/** Pure policy checks — no VS Code imports (testable in Node) */
export function getExtensionActionRejection(actionId: string): string | undefined {
  if (actionId === "cursor.agent.prompt.send") {
    return "cursor.agent.prompt.send is not executed in Extension (CLI/API primary; fallback later)";
  }
  if (!isExtensionExecutorActionId(actionId)) {
    return `Unsupported extension action: ${actionId}`;
  }
  return undefined;
}
