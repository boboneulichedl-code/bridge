import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";

export function isMaxAccessMode(): boolean {
  return vscode.workspace.getConfiguration("bridge").get<boolean>("maxAccessMode", true);
}

export function ensureMaxAccessMarker(context: vscode.ExtensionContext): void {
  if (!isMaxAccessMode()) return;

  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) return;

  for (const folder of folders) {
    const marker = path.join(folder.uri.fsPath, ".cursor", "bridge-max-access");
    if (!fs.existsSync(marker)) {
      fs.mkdirSync(path.dirname(marker), { recursive: true });
      fs.writeFileSync(
        marker,
        JSON.stringify({ enabled: true, via: "extension", at: new Date().toISOString() }, null, 2)
      );
    }
  }
}

export async function toggleMaxAccess(context: vscode.ExtensionContext): Promise<void> {
  const config = vscode.workspace.getConfiguration("bridge");
  const current = config.get<boolean>("maxAccessMode", true);
  await config.update("maxAccessMode", !current, vscode.ConfigurationTarget.Global);

  if (!current) {
    ensureMaxAccessMarker(context);
    void vscode.window.showInformationMessage("Bridge Max Access: AN — Auto-Submit, Force, Hooks aktiv.");
  } else {
    void vscode.window.showInformationMessage("Bridge Max Access: AUS — Standard-Sicherheit.");
  }
}
