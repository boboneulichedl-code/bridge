import * as vscode from "vscode";
import { assertPathWithinWorkspace, requireNonEmptyString } from "./pathGuard";

function configTarget(target?: string): vscode.ConfigurationTarget {
  if (target === "global") return vscode.ConfigurationTarget.Global;
  if (target === "workspaceFolder") return vscode.ConfigurationTarget.WorkspaceFolder;
  return vscode.ConfigurationTarget.Workspace;
}

export async function restoreSettings(payload: Record<string, unknown>): Promise<void> {
  const section = requireNonEmptyString(payload.section, "section");
  const key = requireNonEmptyString(payload.key, "key");
  const targetLabel = String(payload.target ?? "workspace");
  const target = configTarget(targetLabel);
  const config = vscode.workspace.getConfiguration(section);
  await config.update(key, payload.previous, target);
}

export async function restoreFsWrite(payload: Record<string, unknown>): Promise<void> {
  const targetPath = requireNonEmptyString(payload.path, "path");
  const content = typeof payload.content === "string" ? payload.content : String(payload.content ?? "");
  assertPathWithinWorkspace(targetPath);
  const uri = vscode.Uri.file(targetPath);
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));
}

export async function restoreFromSnapshot(input: {
  actionId: string;
  payload: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const { actionId, payload } = input;
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Missing snapshot payload" };
  }
  const p = payload as Record<string, unknown>;

  if (actionId === "cursor.ide.settings.set") {
    await restoreSettings(p);
    return { ok: true };
  }

  if (actionId === "cursor.ide.fs.write") {
    await restoreFsWrite(p);
    return { ok: true };
  }

  return { ok: false, error: `Restore not supported for ${actionId}` };
}
