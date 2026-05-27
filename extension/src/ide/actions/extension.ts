import * as vscode from "vscode";
import { requireNonEmptyString } from "./pathGuard";

/** Installs extension only when invoked via registered P0 action dispatch */
export async function installExtension(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const extensionId = requireNonEmptyString(params.extensionId, "extensionId");
  await vscode.commands.executeCommand(
    "workbench.extensions.installExtension",
    extensionId,
    { preRelease: params.preRelease === true }
  );
  return { extensionId, installed: true };
}
