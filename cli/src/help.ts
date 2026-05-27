export const SHORTCUTS_TEXT = `
Agent Bridge — Tastenkürzel & CLI Referenz
==========================================

BRIDGE EXTENSION (Cursor IDE)
  Ctrl+Alt+A          Agent-Chat öffnen
  Ctrl+Alt+P          Prompt-Dialog
  Ctrl+Alt+Shift+A    Auswahl an Agent senden
  Ctrl+Alt+.          Generierung stoppen
  Ctrl+Alt+K          Shortcuts anzeigen
  Ctrl+Alt+Shift+I    Multi-Source Untersuchung

CURSOR IDE
  Ctrl+I              Composer (inline)
  Ctrl+Shift+I        Composer Vollbild
  Ctrl+L              Chat
  Ctrl+K              Inline Edit
  Shift+Tab           Modus: Agent → Plan → Ask
  Ctrl+Enter          Nachricht senden

CURSOR CLI (agent)
  Shift+Tab           Modi rotieren
  Shift+Enter         Zeilenumbruch (Ctrl+J in tmux)
  Ctrl+D (2×)         Beenden
  Ctrl+R              Änderungen reviewen
  ↑ / ↓               Verlauf
  /plan /ask          Modus wechseln
  /resume             Session fortsetzen
  /compress           Kontext komprimieren
  & prefix            Cloud Agent

BRIDGE CLI
  bridge prompt "…"              Agent starten
  bridge prompt "…" --print      Non-interactive
  bridge prompt "…" --mode plan  Plan-Modus
  bridge sessions                Sessions auflisten
  bridge resume [id]             Session fortsetzen
  bridge open composer|chat      IDE öffnen
  bridge acp                     ACP-Server starten
  bridge shortcuts               Diese Hilfe
  bridge plugins list            Integrationen + Status
  bridge route errors "…"        Intent → MCP-Tools
  bridge investigate "…"         Multi-Source Plan
  bridge manifest                MCP-Manifest anzeigen
`;

export interface ParsedFlags {
  print?: boolean;
  force?: boolean;
  trust?: boolean;
  worktree?: boolean;
  continue?: boolean;
  mode?: string;
  format?: string;
  workspace?: string;
  resume?: string;
  safe?: boolean;
  maxAccess?: boolean;
}

export function parseArgs(argv: string[]): {
  flags: ParsedFlags;
  positional: string[];
} {
  const flags: ParsedFlags = {};
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--print" || arg === "-p") {
      flags.print = true;
    } else if (arg === "--force" || arg === "-f") {
      flags.force = true;
    } else if (arg === "--trust") {
      flags.trust = true;
    } else if (arg === "--worktree") {
      flags.worktree = true;
    } else if (arg === "--continue" || arg === "-c") {
      flags.continue = true;
    } else if (arg === "--mode" && argv[i + 1]) {
      flags.mode = argv[++i];
    } else if (arg.startsWith("--mode=")) {
      flags.mode = arg.slice("--mode=".length);
    } else if (arg === "--output-format" && argv[i + 1]) {
      flags.format = argv[++i];
    } else if (arg === "--workspace" && argv[i + 1]) {
      flags.workspace = argv[++i];
    } else if (arg === "--resume" && argv[i + 1]) {
      flags.resume = argv[++i];
    } else if (arg === "--safe") {
      flags.safe = true;
    } else if (arg === "--max-access") {
      flags.maxAccess = true;
    } else if (arg === "--no-max-access") {
      flags.maxAccess = false;
    } else if (arg.startsWith("-")) {
      // ignore unknown flags
    } else {
      positional.push(arg);
    }
  }

  return { flags, positional };
}

export function printHelp(): void {
  console.log(`bridge — Cursor Agent Bridge CLI

Verwendung:
  bridge prompt "Aufgabe" [Optionen]   Prompt an Agent senden
  bridge sessions                      Sessions auflisten (agent ls)
  bridge resume [id]                   Session fortsetzen
  bridge open <ziel>                   IDE öffnen (composer|chat|agent|fullscreen)
  bridge acp                           ACP JSON-RPC Server starten
  bridge shortcuts                     Tastenkürzel anzeigen
  bridge plugins list|guide|install-mcp|install-all  Integrationen verwalten
  bridge route <intent> [query]        Intent → MCP-Tools routen
  bridge investigate "Thema"           Multi-Source Debugging-Plan
  bridge manifest                      Empfohlene mcp.json-Einträge
  bridge max-access on|off|status      Maximaler Agent-Zugriff
  bridge update check|apply|sync       Versionierung & Auto-Update
  bridge serve                         API + Mobile Web UI starten
  bridge config show                   CLI-Konfiguration anzeigen
  bridge agent [args…]                 Direkt an 'agent' weiterleiten

Prompt-Optionen:
  --print, -p              Non-interactive (Ausgabe auf stdout)
  --force, -f              Auto-approve (für --print)
  --trust                  Workspace vertrauen (CI)
  --mode agent|plan|ask    Modus
  --worktree               In Git-Worktree arbeiten
  --continue, -c           Letzte Session fortsetzen
  --resume <id>            Bestimmte Session laden
  --output-format text|json
  --safe                   Max Access deaktivieren (Sicherheitsmodus)
  (Standard: Max Access AN → --force --trust --approve-mcps)

Umgebungsvariablen:
  BRIDGE_AGENT_BIN         Pfad zur agent-Binary
  CURSOR_API_KEY           Für SDK/Cloud (optional)

Beispiele:
  bridge prompt "Fix failing tests"
  bridge prompt "Review PR" --print --force
  bridge prompt "Design API" --mode plan
  bridge resume abc123
  bridge route errors "500 on login"
  bridge investigate "CI failing on main"
  bridge plugins list
`);
}
