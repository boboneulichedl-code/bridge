import * as vscode from "vscode";
import { assertPathWithinWorkspace, requireNonEmptyString } from "./pathGuard";

export async function mkdirAction(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const targetPath = requireNonEmptyString(params.path, "path");
  assertPathWithinWorkspace(targetPath);
  const uri = vscode.Uri.file(targetPath);
  await vscode.workspace.fs.createDirectory(uri);
  return { path: targetPath };
}

export async function writeFileAction(params: Record<string, unknown>): Promise<{
  data: Record<string, unknown>;
  snapshotPayload?: unknown;
}> {
  const targetPath = requireNonEmptyString(params.path, "path");
  const content = typeof params.content === "string" ? params.content : String(params.content ?? "");
  const overwriteExisting = params.overwriteExisting === true;
  const openAfterWrite = params.openAfterWrite === true;

  assertPathWithinWorkspace(targetPath);
  const uri = vscode.Uri.file(targetPath);

  let previousContent: string | null = null;
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    previousContent = Buffer.from(bytes).toString("utf8");
  } catch {
    /* new file */
  }

  if (previousContent !== null && !overwriteExisting) {
    throw new Error("File exists; set overwriteExisting: true");
  }

  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));

  if (openAfterWrite) {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc);
  }

  return {
    data: { path: targetPath, written: true },
    snapshotPayload:
      previousContent !== null
        ? { path: targetPath, content: previousContent }
        : undefined,
  };
}
