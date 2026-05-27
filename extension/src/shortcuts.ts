export interface ShortcutEntry {
  category: string;
  action: string;
  winLinux: string;
  mac: string;
  notes?: string;
}

export const SHORTCUTS: ShortcutEntry[] = [
  {
    category: "Bridge",
    action: "Agent-Chat öffnen",
    winLinux: "Ctrl+Alt+A",
    mac: "Cmd+Alt+A",
  },
  {
    category: "Bridge",
    action: "Prompt senden",
    winLinux: "Ctrl+Alt+P",
    mac: "Cmd+Alt+P",
  },
  {
    category: "Bridge",
    action: "Auswahl an Agent",
    winLinux: "Ctrl+Alt+Shift+A",
    mac: "Cmd+Alt+Shift+A",
  },
  {
    category: "Bridge",
    action: "Generierung stoppen",
    winLinux: "Ctrl+Alt+.",
    mac: "Cmd+Alt+.",
  },
  {
    category: "Bridge",
    action: "Tastenkürzel anzeigen",
    winLinux: "Ctrl+Alt+K",
    mac: "Cmd+Alt+K",
  },
  {
    category: "Cursor IDE",
    action: "Composer (inline)",
    winLinux: "Ctrl+I",
    mac: "Cmd+I",
  },
  {
    category: "Cursor IDE",
    action: "Composer Vollbild",
    winLinux: "Ctrl+Shift+I",
    mac: "Cmd+Shift+I",
  },
  {
    category: "Cursor IDE",
    action: "Chat",
    winLinux: "Ctrl+L",
    mac: "Cmd+L",
  },
  {
    category: "Cursor IDE",
    action: "Inline Edit",
    winLinux: "Ctrl+K",
    mac: "Cmd+K",
  },
  {
    category: "Cursor IDE",
    action: "Modus wechseln (Agent/Plan/Ask)",
    winLinux: "Shift+Tab",
    mac: "Shift+Tab",
    notes: "Im Composer/CLI-Fokus",
  },
  {
    category: "Cursor IDE",
    action: "Nachricht senden",
    winLinux: "Ctrl+Enter",
    mac: "Cmd+Enter",
  },
  {
    category: "Cursor CLI",
    action: "Zeilenumbruch",
    winLinux: "Shift+Enter / Ctrl+J",
    mac: "Shift+Enter / Ctrl+J",
  },
  {
    category: "Cursor CLI",
    action: "Beenden",
    winLinux: "Ctrl+D (2×)",
    mac: "Ctrl+D (2×)",
  },
  {
    category: "Cursor CLI",
    action: "Änderungen reviewen",
    winLinux: "Ctrl+R",
    mac: "Ctrl+R",
  },
  {
    category: "Cursor CLI",
    action: "Verlauf",
    winLinux: "↑ / ↓",
    mac: "↑ / ↓",
  },
];

/** Cursor-interne Befehle, die Bridge nutzt oder als Fallback versucht. */
export const CURSOR_COMMANDS = {
  newAgentChat: "composer.newAgentChat",
  openComposer: "composer.openComposer",
  openComposerFullscreen: "composer.openComposerFullscreen",
  startComposerPrompt: "cursor.startComposerPrompt",
  startGeneration: "composer.startGeneration",
  cancelGeneration: "composer.cancelGeneration",
  chatOpen: "workbench.action.chat.open",
  chatSubmit: "workbench.action.chat.submit",
  chatStop: "workbench.action.chat.stop",
  inlineChat: "inlineChat.start",
  openChat: "aichat.open",
  newChat: "aichat.newchataction",
} as const;

export const SUBMIT_COMMAND_CANDIDATES = [
  CURSOR_COMMANDS.startGeneration,
  CURSOR_COMMANDS.chatSubmit,
  "composer.submitPrompt",
  "cursor.submitComposer",
  "aichat.submit",
  "composer.submit",
  "cursor.composer.submit",
  "workbench.action.acceptSelectedQuickOpen",
] as const;

export const STOP_COMMAND_CANDIDATES = [
  CURSOR_COMMANDS.cancelGeneration,
  CURSOR_COMMANDS.chatStop,
  "composer.stopGeneration",
  "cursor.stopGeneration",
  "workbench.action.chat.cancel",
] as const;

export const OPEN_COMPOSER_CANDIDATES = [
  CURSOR_COMMANDS.openComposer,
  "composer.focusComposer",
  "cursor.openComposer",
] as const;

export const OPEN_CHAT_CANDIDATES = [
  CURSOR_COMMANDS.chatOpen,
  CURSOR_COMMANDS.openChat,
  "workbench.panel.aichat.view.focus",
] as const;
