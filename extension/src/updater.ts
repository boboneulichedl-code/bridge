import * as vscode from "vscode";
import * as fs from "node:fs";
import * as path from "node:path";
import { spawn } from "node:child_process";

function getBridgeRoot(context: vscode.ExtensionContext): string {
  return path.join(context.extensionPath, "..");
}

function runBridge(args: string[], cwd: string): Promise<string> {
  const bridgeJs = path.join(cwd, "cli", "dist", "index.js");
  return new Promise((resolve) => {
    if (!fs.existsSync(bridgeJs)) {
      resolve("");
      return;
    }
    const child = spawn(process.execPath, [bridgeJs, ...args], { cwd });
    let out = "";
    child.stdout?.on("data", (d: Buffer) => {
      out += d.toString();
    });
    child.on("close", () => resolve(out.trim()));
    child.on("error", () => resolve(""));
  });
}

export async function checkAndNotifyUpdates(context: vscode.ExtensionContext): Promise<void> {
  const bridgeRoot = getBridgeRoot(context);
  const config = vscode.workspace.getConfiguration("bridge");
  const autoUpdate = config.get<boolean>("autoUpdate", true);

  const raw = await runBridge(["update", "check"], bridgeRoot);
  if (!raw) return;

  try {
    const result = JSON.parse(raw) as {
      updateAvailable?: boolean;
      message?: string;
      current?: { version?: string };
    };

    if (!result.updateAvailable) return;

    const message = result.message ?? "Bridge Update verfügbar";
    const choice = autoUpdate
      ? "Jetzt updaten"
      : await vscode.window.showInformationMessage(
          `Bridge: ${message}`,
          "Jetzt updaten",
          "Später"
        );

    if (choice === "Jetzt updaten") {
      const applyOut = await runBridge(["update", "apply"], bridgeRoot);
      void vscode.window.showInformationMessage(
        applyOut ? `Bridge: Update angewendet` : "Bridge: Update fehlgeschlagen — siehe Output"
      );
      void vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  } catch {
    /* ignore parse errors */
  }
}

export function startUpdateWatcher(context: vscode.ExtensionContext): void {
  const intervalMin = vscode.workspace
    .getConfiguration("bridge")
    .get<number>("updateCheckIntervalMinutes", 30);

  if (intervalMin <= 0) return;

  const timer = setInterval(
    () => void checkAndNotifyUpdates(context),
    intervalMin * 60 * 1000
  );
  context.subscriptions.push({ dispose: () => clearInterval(timer) });
}
