import * as vscode from "vscode";
import {
  CURSOR_COMMANDS,
  OPEN_CHAT_CANDIDATES,
  OPEN_COMPOSER_CANDIDATES,
  STOP_COMMAND_CANDIDATES,
  SUBMIT_COMMAND_CANDIDATES,
} from "./shortcuts";
import { isMaxAccessMode } from "./maxAccess";
async function tryCommands(
  ids: readonly string[],
  ...args: unknown[]
): Promise<string | undefined> {
  for (const id of ids) {
    try {
      await vscode.commands.executeCommand(id, ...args);
      return id;
    } catch {
      // Command not available in this Cursor version
    }
  }
  return undefined;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function submitPromptAggressively(pasteDelay: number): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    await delay(pasteDelay);
    const hit = await tryCommands([...SUBMIT_COMMAND_CANDIDATES]);
    if (hit) return;
  }
  // Last resort: focus chat panel and retry generation
  await tryCommands([...OPEN_CHAT_CANDIDATES]);
  await delay(pasteDelay);
  await tryCommands([...SUBMIT_COMMAND_CANDIDATES]);
}

export async function sendPromptToAgent(
  prompt: string,
  options?: { submit?: boolean }
): Promise<void> {
  const config = vscode.workspace.getConfiguration("bridge");
  const maxAccess = isMaxAccessMode();
  const autoSubmit =
    options?.submit ?? config.get<boolean>("autoSubmitPrompt", maxAccess);
  const pasteDelay = config.get<number>("promptPasteDelayMs", maxAccess ? 100 : 150);

  const native = await tryCommands([CURSOR_COMMANDS.chatOpen], prompt);
  if (native) {
    if (autoSubmit) await submitPromptAggressively(pasteDelay);
    return;
  }

  const startPrompt = await tryCommands(
    [CURSOR_COMMANDS.startComposerPrompt],
    prompt
  );
  if (startPrompt) {
    if (autoSubmit) await submitPromptAggressively(pasteDelay);
    return;
  }

  const previousClipboard = await vscode.env.clipboard.readText();
  await vscode.env.clipboard.writeText(prompt);

  await tryCommands([CURSOR_COMMANDS.newAgentChat]);
  await delay(pasteDelay);
  await vscode.commands.executeCommand("editor.action.clipboardPasteAction");

  if (autoSubmit) await submitPromptAggressively(pasteDelay);

  if (previousClipboard !== prompt) {
    await delay(50);
    await vscode.env.clipboard.writeText(previousClipboard);
  }
}

export async function openAgentChat(): Promise<void> {
  await tryCommands([CURSOR_COMMANDS.newAgentChat]);
}

export async function openComposer(): Promise<void> {
  const opened = await tryCommands([...OPEN_COMPOSER_CANDIDATES]);
  if (!opened) {
    await vscode.commands.executeCommand("workbench.action.quickOpen", ">Composer");
  }
}

export async function openComposerFullscreen(): Promise<void> {
  const opened = await tryCommands([
    CURSOR_COMMANDS.openComposerFullscreen,
    "composer.openComposerToSide",
  ]);
  if (!opened) {
    await openComposer();
  }
}

export async function openChat(): Promise<void> {
  const opened = await tryCommands([...OPEN_CHAT_CANDIDATES]);
  if (!opened) {
    await vscode.commands.executeCommand("workbench.action.quickOpen", ">Chat");
  }
}

export async function stopGeneration(): Promise<void> {
  const stopped = await tryCommands([...STOP_COMMAND_CANDIDATES]);
  if (!stopped) {
    void vscode.window.showWarningMessage(
      "Bridge: Kein Stop-Befehl verfügbar in dieser Cursor-Version."
    );
  }
}

export async function discoverCursorCommands(): Promise<void> {
  const all = await vscode.commands.getCommands(true);
  const keywords = ["composer", "aichat", "cursor", "chat", "agent", "inline"];
  const matches = all
    .filter((id) => keywords.some((k) => id.toLowerCase().includes(k)))
    .sort();

  const doc = await vscode.workspace.openTextDocument({
    content: [
      "# Cursor Agent-Befehle (entdeckt)",
      "",
      `Generiert: ${new Date().toISOString()}`,
      `Gefunden: ${matches.length}`,
      "",
      ...matches.map((id) => `- \`${id}\``),
    ].join("\n"),
    language: "markdown",
  });
  await vscode.window.showTextDocument(doc, { preview: false });
}

export function getSelectionOrPrompt(defaultPrompt: string): string {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return defaultPrompt;
  }
  const sel = editor.document.getText(editor.selection);
  if (!sel.trim()) {
    return defaultPrompt;
  }
  const lang = editor.document.languageId;
  return `Analysiere und bearbeite folgenden ${lang}-Code:\n\n\`\`\`${lang}\n${sel}\n\`\`\``;
}
