import * as vscode from "vscode";
import { requireNonEmptyString } from "./pathGuard";

export async function openWorkspace(params: Record<string, unknown>): Promise<{
  data: Record<string, unknown>;
  snapshotPayload: unknown;
}> {
  const targetPath = requireNonEmptyString(params.path, "path");
  const newWindow = params.newWindow === true;
  const previousWorkspaceFolders =
    vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) ?? [];

  const uri = vscode.Uri.file(targetPath);
  const forceNewWindow = newWindow;
  await vscode.commands.executeCommand("vscode.openFolder", uri, forceNewWindow);

  return {
    data: { path: targetPath, newWindow },
    snapshotPayload: { previousWorkspaceFolders },
  };
}
