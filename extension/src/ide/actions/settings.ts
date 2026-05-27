import * as vscode from "vscode";
import { requireNonEmptyString } from "./pathGuard";

function configTarget(target?: string): vscode.ConfigurationTarget {
  if (target === "global") return vscode.ConfigurationTarget.Global;
  if (target === "workspaceFolder") return vscode.ConfigurationTarget.WorkspaceFolder;
  return vscode.ConfigurationTarget.Workspace;
}

export async function getSetting(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const section = requireNonEmptyString(params.section, "section");
  const key = requireNonEmptyString(params.key, "key");
  const config = vscode.workspace.getConfiguration(section);
  const value = config.get(key);
  return { section, key, value, target: params.target ?? "workspace" };
}

export async function setSetting(params: Record<string, unknown>): Promise<{
  data: Record<string, unknown>;
  snapshotPayload: unknown;
}> {
  const section = requireNonEmptyString(params.section, "section");
  const key = requireNonEmptyString(params.key, "key");
  const value = params.value;
  const targetLabel = String(params.target ?? "workspace");
  const target = configTarget(targetLabel);
  const config = vscode.workspace.getConfiguration(section);
  const previous = config.get(key);
  await config.update(key, value, target);
  return {
    data: { section, key, value, target: targetLabel },
    snapshotPayload: { section, key, previous, target: targetLabel },
  };
}
