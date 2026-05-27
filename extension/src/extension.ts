import * as vscode from "vscode";
import {
  discoverCursorCommands,
  getSelectionOrPrompt,
  openAgentChat,
  openChat,
  openComposer,
  openComposerFullscreen,
  sendPromptToAgent,
  stopGeneration,
} from "./agentControl";
import {
  registerIntegrationMcps,
  runInvestigation,
  showIntegrationStatus,
} from "./integrations";
import { ensureMaxAccessMarker, toggleMaxAccess } from "./maxAccess";
import { checkAndNotifyUpdates, startUpdateWatcher } from "./updater";
import { startIdeControlHost, stopIdeControlHost } from "./ideControlHost";
import { SHORTCUTS } from "./shortcuts";

export function activate(context: vscode.ExtensionContext): void {
  const register = (
    id: string,
    handler: (...args: unknown[]) => Promise<void> | void
  ) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(id, handler)
    );
  };

  register("bridge.openAgentChat", () => openAgentChat());
  register("bridge.openComposer", () => openComposer());
  register("bridge.openComposerFullscreen", () => openComposerFullscreen());
  register("bridge.openChat", () => openChat());
  register("bridge.newChat", () => openAgentChat());

  register("bridge.sendPrompt", async () => {
    const prompt = await vscode.window.showInputBox({
      title: "Bridge: Prompt an Agent senden",
      placeHolder: "Was soll der Agent tun?",
      ignoreFocusOut: true,
    });
    if (prompt?.trim()) {
      await sendPromptToAgent(prompt.trim());
    }
  });

  register("bridge.sendSelectionToAgent", async () => {
    const prompt = getSelectionOrPrompt(
      "Bitte bearbeite den markierten Code."
    );
    await sendPromptToAgent(prompt);
  });

  register("bridge.stopGeneration", () => stopGeneration());

  register("bridge.discoverCommands", () => discoverCursorCommands());
  register("bridge.showIntegrations", () => showIntegrationStatus(context));
  register("bridge.investigate", () => runInvestigation(context));

  register("bridge.toggleMaxAccess", () => toggleMaxAccess(context));

  registerIntegrationMcps(context);
  ensureMaxAccessMarker(context);
  void checkAndNotifyUpdates(context);
  startUpdateWatcher(context);
  startIdeControlHost(context);

  register("bridge.showShortcuts", async () => {
    const lines = [
      "# Agent Bridge — Tastenkürzel",
      "",
      "| Kategorie | Aktion | Windows/Linux | Mac | Hinweis |",
      "|-----------|--------|---------------|-----|---------|",
      ...SHORTCUTS.map(
        (s) =>
          `| ${s.category} | ${s.action} | ${s.winLinux} | ${s.mac} | ${s.notes ?? ""} |`
      ),
      "",
      "## CLI",
      "",
      "```bash",
      "bridge prompt \"Aufgabe\"",
      "bridge sessions",
      "bridge resume",
      "bridge shortcuts",
      "```",
    ];

    const doc = await vscode.workspace.openTextDocument({
      content: lines.join("\n"),
      language: "markdown",
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  });

  // Register bundled plugin path for Cursor discovery
  const pluginsDir = vscode.Uri.joinPath(context.extensionUri, "..");
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cursorApi = (vscode as any).cursor;
    if (cursorApi?.plugins?.registerPath) {
      cursorApi.plugins.registerPath(pluginsDir.fsPath);
      context.subscriptions.push({
        dispose: () => cursorApi.plugins.unregisterPath(pluginsDir.fsPath),
      });
    }
  } catch {
    // Not running in Cursor or API unavailable
  }
}

export function deactivate(): void {
  stopIdeControlHost();
}
