# Bridge — Cursor Adapter PoC v1 Spezifikation

**Status:** Entwurf (verbindlich vor Implementierung)  
**Version:** `poc-v1.1.0`  
**Datum:** 2026-05-27  

## Zweck

Diese Spezifikation definiert den **ersten Proof of Concept** für den Cursor-Adapter von **Bridge**.

Bridge ist ein **IDE-/Programm-Control-System**. Die Steuerung des Cursor-Agenten ist **nur ein Subsystem** (`domain: agent`), nicht das Zielbild.

PoC v1 beweist, dass Bridge vom Smartphone (via WebApp → Backend → lokaler IDE-Control-Host):

1. den **Zustand** der laufenden Cursor-IDE liest,
2. **Workspace und Dateisystem** steuert,
3. **Settings versioniert** ändert,
4. **Extensions** installiert,
5. **Terminal und Commands** ausführt,
6. optional **einen Agent-Prompt** (Subsystem) sendet.

**Kein Produktivcode** vor Freigabe dieser Spec.

---

## Architektur (PoC v1)

```
Mobile WebApp (modular, smartphone-first)
    │  Modular UI Renderer
    │  ← Designrules / Tokens / UI-Module
    │  REST / WebSocket
    ▼
bridge-api  (:3847)
    │  Action Router + Permission Gate + Security Gate
    ▼
Bridge Extension (IDE-Control-Host, localhost IPC)
    │  VS Code Extension API + Workbench Commands
    ▼
Cursor IDE
    │
    └── agent CLI (nur für cursor.agent.prompt.send)
```

**Routing-Regel (Backend):** Extension-first. CLI/Dateisystem nur als dokumentierter Fallback.

**Routing-Regel (UI):**

```
Action Registry → Capability Router → Permission Gate → Modular UI Renderer → Designrules/Tokens → Mobile View
```

**Nicht erlaubt:** Eine feste Seite mit hart codierten Buttons.

---

## Design / Mobile UX / Modularität

Die Bridge-WebApp ist **kein Nebenprodukt**. Sie ist ein **zentraler Teil des Systems**.

Die UI muss **extrem modular** aufgebaut werden.

### Grundsätze

- Keine riesigen fest verdrahteten Seiten.
- Keine monolithische Cursor-Seite.
- Keine hart codierte Spezial-UI, die später nicht wiederverwendbar ist.
- Jede Funktion soll als **wiederverwendbares UI-Modul** gedacht werden.
- Jede Action aus der Action-Registry soll später ein eigenes UI-Control oder UI-Modul bekommen können.
- Module müssen **konfigurierbar, austauschbar, versionierbar** und **pro Zielprogramm kombinierbar** sein.
- Cursor ist nur der erste Adapter. Die gleiche UI-Architektur muss später auch für VS Code, Android Studio, Chrome, Terminal, PowerShell und weitere Programme nutzbar sein.

### UI ist keine feste Cursor-Seite

Die UI ist eine **modulare Steueroberfläche**, die aus registrierten Actions, Capabilities, Permissions und Designregeln **zusammengesetzt** wird — nicht eine statische „Cursor Control Page“.

### Wiederverwendbare Modul-Bibliothek (Langfristig)

Mobile UI besteht aus modularen Bausteinen, z. B.:

| Modul | Zweck |
|-------|-------|
| `StatusCard` | Kompakter Live-Status |
| `WorkspaceModule` | Projekt/Workspace steuern |
| `FileActionModule` | Datei/Ordner-Aktionen |
| `SettingsModule` | Settings lesen/schreiben |
| `ExtensionModule` | Extensions installieren/verwalten |
| `TerminalModule` | Terminal-Befehle |
| `CommandModule` | Workbench-Commands |
| `GitModule` | Git-Status und -Aktionen |
| `ProblemsModule` | Diagnostics/Fehler |
| `AgentModule` | Agent-Prompt (Subsystem) |
| `AuditHistoryModule` | Aktionen-Verlauf |
| `ConfirmationDialogModule` | Bestätigung gefährlicher Aktionen |
| `PermissionGateModule` | Berechtigungsprüfung vor Render/Aktion |
| `ActionResultModule` | Ergebnis-Feedback |
| `ErrorStateModule` | Fehlerdarstellung |
| `VersionInfoModule` | Adapter-/Programm-/Modul-Versionen |

### UI-Modul-Schema (Pflichtfelder)

Jedes Modul muss klar definieren:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `moduleId` | string | Eindeutige ID, z. B. `bridge.ui.workspace` |
| `version` | semver | Modul-Version (unabhängig von Action-Registry) |
| `supportedActions` | string[] | `actionId`-Liste aus Action-Registry |
| `requiredPermissions` | string[] | Mindest-Permissions zum Rendern |
| `requiredDesignTokens` | string[] | Benötigte Design-Tokens |
| `requiredComponents` | string[] | Benötigte Basis-Komponenten |
| `dataInputs` | object | Erwartete Props/Daten vom Router |
| `emittedEvents` | string[] | Events an Parent/Router (z. B. `action:requested`) |
| `loadingState` | spec | Darstellung während Laden |
| `errorState` | spec | Darstellung bei Fehler |
| `emptyState` | spec | Darstellung ohne Daten |
| `confirmationRules` | spec | Wann ConfirmationDialogModule einbinden |
| `mobileLayoutRules` | spec | Breakpoints, Touch-Ziele, Abstände |
| `rollbackUndoVisibility` | boolean/spec | Rollback/Undo anzeigen, falls Action unterstützt |

Module werden in einer **UI-Module-Registry** versioniert (Zielort PoC: `adapters/cursor/registry/poc-v1-ui-modules.json` — nach Freigabe).

---

## Designrules sind Pflicht

Bestehende Designrules, Design Tokens, Komponentenregeln, Layoutregeln, Spacing-Regeln, Darkmode-Regeln, Motion-Regeln und UX-Regeln **müssen angewendet werden**.

### Checkliste vor jeder UI-Implementierung

1. Gibt es passende **Designrules**?
2. Gibt es passende **Tokens**?
3. Gibt es passende **Komponenten**?
4. Gibt es definierte **States**?
   - loading
   - empty
   - error
   - disabled
   - confirmation required
   - success
   - warning
5. Gibt es **mobile Layoutregeln**?
6. Gibt es Regeln für **gefährliche Aktionen**?
7. Gibt es Regeln für **modulare UI-Blöcke**?

### Wenn eine Designregel fehlt

- **Nicht** einfach trotzdem bauen.
- **Nicht** frei irgendein Design erfinden.
- Fehlende Regel **klar benennen**.
- Eine **konkrete Designrule-Ergänzung vorschlagen**.
- **Erst nach Bestätigung implementieren**.

**Designrules haben Vorrang vor schneller Umsetzung.**

---

## Smartphone-first

Die Bridge-WebApp muss **smartphone-first** sein.

### Priorität (Viewport-Optimierung)

1. Galaxy S25 Ultra optimiert
2. Android allgemein
3. iPhone
4. Tablet
5. schwacher PC / Desktop Browser

### UI-Anforderungen

- **Darkmode-first**
- fingerfreundlich
- große Touch-Ziele (Mindestgröße gemäß Designrules — fehlt Regel → vor Implementierung definieren)
- klare Abstände
- **keine Desktop-IDE kopieren**
- nicht überladen wirken
- schnelle Aktionen ermöglichen
- riskante Aktionen klar bestätigen lassen
- Status und Ergebnisse sofort sichtbar machen
- Audit/History für Aktionen sichtbar machen

---

## Modularitätsregel für Cursor PoC v1

Für den Cursor PoC darf **keine große statische „Cursor Control Page“** gebaut werden.

Die erste UI muss aus **modularen Sektionen** bestehen:

| # | moduleId | supportedActions (PoC v1) | Shared / Wiederverwendbar |
|---|----------|---------------------------|---------------------------|
| 1 | `bridge.ui.cursor.status` | `cursor.ide.status.get` | Basis: `StatusCard` |
| 2 | `bridge.ui.workspace` | `cursor.ide.workspace.open` | `WorkspaceModule` |
| 3 | `bridge.ui.file.create` | `cursor.ide.fs.mkdir`, `cursor.ide.fs.write` | `FileActionModule` |
| 4 | `bridge.ui.settings` | `cursor.ide.settings.get`, `cursor.ide.settings.set` | `SettingsModule` |
| 5 | `bridge.ui.extension.install` | `cursor.ide.extension.install` | `ExtensionModule` |
| 6 | `bridge.ui.terminal.command` | `cursor.ide.terminal.run` | `TerminalModule` |
| 7 | `bridge.ui.ide.command` | `cursor.ide.command.execute` | `CommandModule` |
| 8 | `bridge.ui.agent.prompt` | `cursor.agent.prompt.send` | `AgentModule` |
| 9 | `bridge.ui.audit.history` | alle Actions (read-only) | `AuditHistoryModule` |

**Querschnitts-Module** (nicht eigene Sektion, überall eingebunden):

- `PermissionGateModule` — vor Render und vor Action-Ausführung
- `ConfirmationDialogModule` — wenn `needsConfirmation: true`
- `ActionResultModule` — nach jeder Action
- `ErrorStateModule` — bei Fehlern
- `VersionInfoModule` — Adapter/Spec-Version in Footer oder Settings

Diese Module müssen später **einzeln verschoben, deaktiviert, ersetzt oder für andere Programme wiederverwendet** werden können.

### PoC v1 View-Zusammensetzung (Beispiel)

```
BridgeMobileView (Cursor, adapterId: cursor)
├── PermissionGateModule
├── CursorStatusModule          → bridge.ui.cursor.status
├── WorkspaceModule             → bridge.ui.workspace
├── FileCreateModule            → bridge.ui.file.create
├── SettingsModule              → bridge.ui.settings
├── ExtensionInstallModule      → bridge.ui.extension.install
├── TerminalCommandModule       → bridge.ui.terminal.command
├── IdeCommandModule            → bridge.ui.ide.command
├── AgentPromptModule           → bridge.ui.agent.prompt  (visuell als Subsystem markiert)
├── AuditHistoryModule          → bridge.ui.audit.history
└── VersionInfoModule
```

**Layout:** Vertikaler Stack, eine Modul-Sektion pro Scroll-Block; kein Tab-Monolith mit versteckter Logik.

### Mapping Action → UI-Modul → Confirmation

| actionId | UI-Modul | ConfirmationDialog |
|----------|----------|-------------------|
| `cursor.ide.status.get` | CursorStatusModule | nein |
| `cursor.ide.workspace.open` | WorkspaceModule | ja |
| `cursor.ide.fs.mkdir` | FileCreateModule | nein |
| `cursor.ide.fs.write` | FileCreateModule | bei overwrite |
| `cursor.ide.settings.get` | SettingsModule | nein |
| `cursor.ide.settings.set` | SettingsModule | ja |
| `cursor.ide.extension.install` | ExtensionInstallModule | ja |
| `cursor.ide.terminal.run` | TerminalCommandModule | ja |
| `cursor.ide.command.execute` | IdeCommandModule | ja |
| `cursor.agent.prompt.send` | AgentPromptModule | ja |

---

## Action-Schema (Pflichtfelder)

Jede Action in Bridge wird versioniert registriert:

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `actionId` | string | Eindeutige ID, z. B. `cursor.ide.workspace.open` |
| `domain` | enum | `ide` \| `agent` \| `config` \| `integration` |
| `method` | enum | `extension-api` \| `extension-command` \| `cli` \| `filesystem` \| `composite` |
| `stability` | enum | `stable` \| `probable` \| `experimental` \| `unsupported` |
| `requiredPermission` | enum | `read` \| `workspace` \| `fs-write` \| `fs-delete` \| `settings` \| `extension-manage` \| `terminal` \| `command-exec` \| `agent-run` |
| `destructive` | boolean | Irreversible oder schwer rückgängig zu machende Wirkung |
| `needsConfirmation` | boolean | Mobile UI muss User bestätigen vor Ausführung |
| `rollbackPossible` | boolean | Automatischer oder dokumentierter Rollback möglich |
| `supportedCursorVersions` | string[] | Semver-Ranges, z. B. `>=2.0.0 <3.0.0` |
| `fallbackMethods` | array | Geordnete Fallbacks mit `method` + Bedingung |

---

## PoC v1 — Die 10 Actions

Übersicht:

| # | actionId | Domain | Primärmethode | Fallback | Bestätigung |
|---|----------|--------|---------------|----------|-------------|
| 1 | `cursor.ide.status.get` | ide | extension-api | cli | nein |
| 2 | `cursor.ide.workspace.open` | ide | extension-api | cli | ja |
| 3 | `cursor.ide.fs.mkdir` | ide | extension-api | filesystem | nein |
| 4 | `cursor.ide.fs.write` | ide | extension-api | filesystem | nein |
| 5 | `cursor.ide.settings.get` | ide | extension-api | filesystem | nein |
| 6 | `cursor.ide.settings.set` | ide | extension-api | filesystem | ja |
| 7 | `cursor.ide.extension.install` | ide | extension-command | cli | ja |
| 8 | `cursor.ide.terminal.run` | ide | extension-api | — | ja |
| 9 | `cursor.ide.command.execute` | ide | extension-command | — | ja |
| 10 | `cursor.agent.prompt.send` | agent | cli | extension-command | ja |

---

### 1. `cursor.ide.status.get`

Liest den aktuellen IDE-Zustand (Heartbeat für Mobile UI).

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-api` |
| **stability** | `stable` |
| **requiredPermission** | `read` |
| **destructive** | `false` |
| **needsConfirmation** | `false` |
| **rollbackPossible** | `false` |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension API (primär):**
- Cursor/Extension-Version, Extension-Host lebt
- `vscode.workspace.workspaceFolders` → Workspace-Pfade
- `vscode.window.activeTextEditor` → aktive Datei, Zeile
- `vscode.window.visibleTextEditors` → offene Editoren (Anzahl + Pfade)
- `vscode.languages.getDiagnostics()` → Problems-Anzahl (errors/warnings)
- Terminals: Anzahl + Namen (`window.terminals`)
- Git: via `vscode.extensions.getExtension('vscode.git')` oder Command `git.api.getRepositories` — **probable**, sonst Shell-Fallback in Status only
- Installierte Extensions: `vscode.extensions.all` gefiltert

**CLI (Fallback wenn Extension offline):**
- Prozess `Cursor.exe` / `cursor` läuft?
- `cursor --version` (wenn verfügbar)
- Kein Workspace/Editor-Detail ohne Extension

**Dateisystem:** nicht verwendet

**Request (API):**
```json
GET /api/v1/cursor/ide/status
```

**Response (Beispiel):**
```json
{
  "actionId": "cursor.ide.status.get",
  "ok": true,
  "cursor": { "running": true, "version": "2.3.x" },
  "workspace": { "folders": ["C:\\Projects\\my-app"] },
  "editor": { "activeFile": "src/index.ts", "line": 42 },
  "problems": { "errors": 2, "warnings": 5 },
  "terminals": { "count": 1 },
  "extensions": { "installed": 47 }
}
```

**fallbackMethods:**
```yaml
- method: cli
  when: extension-unreachable
  actions: [process-check, cursor --version]
```

---

### 2. `cursor.ide.workspace.open`

Öffnet einen Ordner/Projekt als Workspace.

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-api` |
| **stability** | `stable` |
| **requiredPermission** | `workspace` |
| **destructive** | `false` |
| **needsConfirmation** | `true` |
| **rollbackPossible** | `true` (vorheriger Workspace in Snapshot) |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension API (primär):**
- `vscode.openFolder(Uri.file(path), { forceNewWindow: false })`
- Vorher: Snapshot `previousWorkspaceFolders` speichern

**CLI (Fallback):**
- `cursor "<path>"` — startet/neu lädt Fenster mit Ordner
- Wenn Cursor nicht läuft: Prozess starten + warten auf Extension-Handshake

**Dateisystem:** Pfad muss existieren; optional vorher `fs.mkdir` via Action 3

**Request:**
```json
POST /api/v1/cursor/ide/workspace/open
{ "path": "C:\\Projects\\my-app", "newWindow": false }
```

**Sicherheit:** Path-Allowlist (konfigurierbare Wurzeln, z. B. `C:\Projects`, `C:\CoreAI`)

**fallbackMethods:**
```yaml
- method: cli
  when: extension-unreachable OR forceCli=true
  command: 'cursor "{path}"'
```

---

### 3. `cursor.ide.fs.mkdir`

Erstellt einen Ordner im Workspace oder unter erlaubtem Pfad.

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-api` |
| **stability** | `stable` |
| **requiredPermission** | `fs-write` |
| **destructive** | `false` |
| **needsConfirmation** | `false` |
| **rollbackPossible** | `true` (Ordner löschen via zukünftige delete-Action) |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension API (primär):**
- `vscode.workspace.fs.createDirectory(Uri.file(path))`
- Rekursive Eltern: vorher prüfen / ggf. einzeln anlegen

**Dateisystem (Fallback):**
- Node `fs.mkdirSync(path, { recursive: true })` vom Backend — **nur** wenn Extension offline und Pfad in Allowlist

**CLI:** nicht verwendet

**Request:**
```json
POST /api/v1/cursor/ide/fs/mkdir
{ "path": "C:\\Projects\\my-app\\src\\components" }
```

**fallbackMethods:**
```yaml
- method: filesystem
  when: extension-unreachable
  guard: path-in-allowlist
```

---

### 4. `cursor.ide.fs.write`

Erstellt oder überschreibt eine Datei.

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-api` |
| **stability** | `stable` |
| **requiredPermission** | `fs-write` |
| **destructive** | `false` (true wenn Überschreiben — siehe Flag) |
| **needsConfirmation** | `false` (true wenn `overwriteExisting: true`) |
| **rollbackPossible** | `true` (Snapshot vorheriger Inhalt) |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension API (primär):**
- Vor Write: bestehenden Inhalt lesen → `ConfigSnapshot` / ContentSnapshot
- `vscode.workspace.fs.writeFile(uri, Buffer.from(content))`
- Optional: `window.showTextDocument` nach Write

**Dateisystem (Fallback):**
- Backend schreibt Datei direkt — nur Allowlist + Extension offline

**Request:**
```json
POST /api/v1/cursor/ide/fs/write
{
  "path": "C:\\Projects\\my-app\\README.md",
  "content": "# Hello",
  "overwriteExisting": true,
  "openAfterWrite": true
}
```

**Versionierung:** Jeder Write erzeugt `contentSnapshotId` für Rollback.

**fallbackMethods:**
```yaml
- method: filesystem
  when: extension-unreachable
  guard: path-in-allowlist
```

---

### 5. `cursor.ide.settings.get`

Liest eine Einstellung (User oder Workspace).

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-api` |
| **stability** | `stable` |
| **requiredPermission** | `read` |
| **destructive** | `false` |
| **needsConfirmation** | `false` |
| **rollbackPossible** | `false` |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension API (primär):**
- `vscode.workspace.getConfiguration(section).get(key)`

**Dateisystem (Fallback):**
- `.vscode/settings.json` oder User-Settings-Pfad parsen — **nur** wenn Extension offline; Ziel (`global` vs `workspace`) beachten

**Request:**
```json
POST /api/v1/cursor/ide/settings/get
{ "section": "editor", "key": "fontSize", "target": "workspace" }
```

**fallbackMethods:**
```yaml
- method: filesystem
  when: extension-unreachable
  path: .vscode/settings.json | user settings.json
```

---

### 6. `cursor.ide.settings.set`

Schreibt eine Einstellung mit versioniertem Snapshot vor Änderung.

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-api` |
| **stability** | `stable` |
| **requiredPermission** | `settings` |
| **destructive** | `false` |
| **needsConfirmation** | `true` |
| **rollbackPossible** | `true` (Snapshot → restore) |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension API (primär):**
- Snapshot: alter Wert + `configVersion`
- `workspace.getConfiguration(section).update(key, value, target)`
- `target`: `Workspace` | `Global` | `WorkspaceFolder`

**Dateisystem (Fallback + Rollback-Quelle):**
- `.vscode/settings.json` merge/write mit vorherigem JSON-Snapshot

**Request:**
```json
POST /api/v1/cursor/ide/settings/set
{
  "section": "editor",
  "key": "fontSize",
  "value": 14,
  "target": "workspace"
}
```

**Response enthält:** `snapshotId` für Rollback-Action (PoC v1.1: `cursor.ide.settings.rollback`)

---

### 7. `cursor.ide.extension.install`

Installiert eine VS Code/Cursor-Extension.

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-command` |
| **stability** | `probable` |
| **requiredPermission** | `extension-manage` |
| **destructive** | `false` |
| **needsConfirmation** | `true` |
| **rollbackPossible** | `true` (deinstallieren) |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension Command (primär):**
- `workbench.extensions.installExtension` mit Extension-ID (z. B. `dbaeumer.vscode-eslint`)
- Warten auf Activation / in Liste verifizieren

**CLI (Fallback):**
- `cursor --install-extension <id>` (VS-Code-kompatibel)
- Wenn IDE nicht läuft: CLI startet ggf. neuen Prozess

**Dateisystem:** nicht direkt; Extensions liegen in User-Extension-Dir

**Request:**
```json
POST /api/v1/cursor/ide/extension/install
{ "extensionId": "dbaeumer.vscode-eslint", "preRelease": false }
```

**fallbackMethods:**
```yaml
- method: cli
  when: extension-command-failed OR extension-unreachable
  command: 'cursor --install-extension {extensionId}'
```

**Risiko:** Marketplace-Netzwerk nötig; in PoC dokumentieren wenn offline fehlschlägt.

---

### 8. `cursor.ide.terminal.run`

Führt einen Befehl in einem Terminal aus.

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-api` |
| **stability** | `stable` |
| **requiredPermission** | `terminal` |
| **destructive** | `true` (beliebige Shell-Befehle) |
| **needsConfirmation** | `true` |
| **rollbackPossible** | `false` |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension API (primär):**
- `window.createTerminal({ name, cwd })` oder existierendes Terminal wählen
- `terminal.sendText(command, addNewLine: true)`
- Output-Erfassung PoC v1: **begrenzt** — Shell Integration API wenn verfügbar, sonst nur „sent OK”

**CLI / Dateisystem:** kein Fallback in PoC v1 (zu unsicher ohne IDE-Kontext)

**Request:**
```json
POST /api/v1/cursor/ide/terminal/run
{
  "command": "npm run build",
  "cwd": "C:\\Projects\\my-app",
  "terminalName": "bridge"
}
```

**Sicherheit:** Command-Allowlist oder Pattern-Whitelist in PoC-Konfig (z. B. nur `npm *`, `git status`, `git diff`)

---

### 9. `cursor.ide.command.execute`

Führt einen registrierten Workbench-/Extension-Command aus (Command-Palette-Äquivalent).

| Feld | Wert |
|------|------|
| **domain** | `ide` |
| **method** | `extension-command` |
| **stability** | `probable` (command-id abhängig) |
| **requiredPermission** | `command-exec` |
| **destructive** | `true` (command-abhängig) |
| **needsConfirmation** | `true` |
| **rollbackPossible** | `false` |
| **supportedCursorVersions** | `>=2.0.0` |

**Extension Command (primär):**
- `vscode.commands.executeCommand(commandId, ...args)`
- PoC v1: Command muss in **Allowlist** der Registry stehen

**Beispiele erlaubter Commands (PoC v1 Allowlist):**
| commandId | Zweck |
|-----------|-------|
| `workbench.action.terminal.new` | Neues Terminal |
| `workbench.action.files.saveAll` | Alle speichern |
| `workbench.action.closeActiveEditor` | Editor schließen |
| `workbench.view.explorer` | Explorer fokussieren |
| `workbench.view.scm` | Git-Panel |
| `workbench.actions.view.problems` | Problems-Panel |
| `workbench.action.tasks.runTask` | Task (mit Task-Name als Arg) |

**Request:**
```json
POST /api/v1/cursor/ide/command/execute
{
  "commandId": "workbench.view.explorer",
  "args": []
}
```

**Fallback:** keine in PoC v1 — unbekannte Commands werden blockiert

**Panels/Fenster:** diese Action ist der generische Hebel für Panel-Fokus in PoC v1. Dedizierte `cursor.ide.panel.focus` kommt in v1.1.

---

### 10. `cursor.agent.prompt.send` (Subsystem)

Sendet einen Prompt an den Cursor-Agenten — **nicht** repräsentativ für Bridge als Ganzes.

| Feld | Wert |
|------|------|
| **domain** | `agent` |
| **method** | `cli` |
| **stability** | `stable` (CLI) / `experimental` (Extension-UI-Fallback) |
| **requiredPermission** | `agent-run` |
| **destructive** | `true` (kann Dateien ändern mit `--force`) |
| **needsConfirmation** | `true` |
| **rollbackPossible** | `false` (Git-Rollback manuell) |
| **supportedCursorVersions** | `>=2.0.0` |

**CLI (primär):**
- `agent -p --output-format text [--mode agent|plan|ask] [--force] [--trust] "<prompt>"`
- Job-ID + Output über Backend/WebSocket

**Extension Command (Fallback — IDE-UI):**
- Bestehende Logik aus `sendPromptToAgent` (Clipboard + `composer.newAgentChat`)
- Nur wenn `preferIdeUi: true` und CLI nicht gewünscht

**Request:**
```json
POST /api/v1/cursor/agent/prompt
{
  "prompt": "Fix the failing tests",
  "mode": "agent",
  "headless": true,
  "allowFileChanges": false
}
```

**fallbackMethods:**
```yaml
- method: extension-command
  when: headless=false OR cli-unavailable
  candidates:
    - cursor.startComposerPrompt
    - composer.newAgentChat + clipboard-paste
  stability: experimental
```

---

## Methoden-Verteilung (PoC v1)

| Methode | Actions |
|---------|---------|
| **extension-api** | 1, 2, 3, 4, 5, 6, 8 |
| **extension-command** | 7, 9 (+ Agent-Fallback 10) |
| **cli** | 2 (fallback), 7 (fallback), 10 (primär), 1 (teilweise) |
| **filesystem** | 3, 4, 5, 6 (nur Fallback) |
| **composite** | — (ab v1.1) |

---

## Fallback-Übersicht

| actionId | Fallback | Bedingung |
|----------|----------|-----------|
| `cursor.ide.status.get` | cli | Extension offline |
| `cursor.ide.workspace.open` | cli | Extension offline |
| `cursor.ide.fs.mkdir` | filesystem | Extension offline + Allowlist |
| `cursor.ide.fs.write` | filesystem | Extension offline + Allowlist |
| `cursor.ide.settings.get` | filesystem | Extension offline |
| `cursor.ide.settings.set` | filesystem | Extension offline + Snapshot |
| `cursor.ide.extension.install` | cli | Command fehlgeschlagen |
| `cursor.ide.terminal.run` | — | Kein Fallback (blockiert) |
| `cursor.ide.command.execute` | — | Kein Fallback (blockiert) |
| `cursor.agent.prompt.send` | extension-command | headless=false / CLI fehlt |

---

## Bestätigungspflicht (Mobile UI)

| actionId | needsConfirmation | Grund |
|----------|-------------------|-------|
| `cursor.ide.status.get` | nein | Read-only |
| `cursor.ide.workspace.open` | ja | Kontextwechsel |
| `cursor.ide.fs.mkdir` | nein | Reversibel |
| `cursor.ide.fs.write` | nur bei overwrite | Datenverlust möglich |
| `cursor.ide.settings.get` | nein | Read-only |
| `cursor.ide.settings.set` | ja | Verhalten der IDE ändert sich |
| `cursor.ide.extension.install` | ja | Code-Ausführung durch Extension |
| `cursor.ide.terminal.run` | ja | Beliebige Shell |
| `cursor.ide.command.execute` | ja | Command-abhängig |
| `cursor.agent.prompt.send` | ja | AI + optionale File-Changes |

---

## Sicherheitsmodell (PoC v1)

### Pflicht für alle Actions
- `Authorization: Bearer <BRIDGE_API_TOKEN>` (bereits in API vorhanden)
- Audit-Log: `actionId`, `timestamp`, `clientId`, `paramsHash`, `result`, `methodUsed`

### Path-Allowlist
- Konfiguration: `BRIDGE_ALLOWED_PATHS=C:\Projects,C:\CoreAI`
- Gilt für: fs.mkdir, fs.write, workspace.open, terminal.run (cwd)

### Command-Allowlist
- Gilt für: `cursor.ide.command.execute`
- Registry-Datei: `adapters/cursor/registry/poc-v1-commands.json` (später)

### Terminal-Whitelist (PoC)
- Erlaubte Prefixe: `npm `, `git status`, `git diff`, `git log`, `node `, `npx `
- Erweiterung nur durch Config-Update + Version-Bump

### Agent-Subsystem
- `allowFileChanges: false` als Default → kein `--force` am CLI
- Explizites Opt-in für Max-Access (bestehendes Modell)

---

## Versionierung

### Spec-Version
- Diese Datei: `poc-v1.1.0` (UI/Modularitäts-Abschnitt ergänzt)
- Änderungen an Actions → Minor-Bump + Migrationseintrag
- Änderungen an UI-Modulen → eigenes `moduleVersion` in UI-Module-Registry

### Action-Registry (Zielort)
```
adapters/cursor/registry/poc-v1-actions.json
```

Jeder Eintrag enthält alle Pflichtfelder des Action-Schemas.

### Runtime-Checks vor Ausführung
1. `actionId` in Registry?
2. Cursor-Version in `supportedCursorVersions`?
3. Client hat `requiredPermission`?
4. `needsConfirmation` erfüllt?
5. Pfad/Command in Allowlist?

### Rollback (PoC v1)
- `cursor.ide.settings.set` → Snapshot restore
- `cursor.ide.fs.write` → Content-Snapshot restore
- `cursor.ide.workspace.open` → previous workspace snapshot

---

## Erfolgskriterien PoC v1

### Backend / Actions

| Kriterium | Messung |
|-----------|---------|
| IDE-Status vom Handy lesbar | Action 1 via Mobile UI |
| Projekt remote öffnen | Action 2 |
| Ordner + Datei anlegen | Actions 3 + 4 |
| Setting lesen + ändern + Rollback | Actions 5 + 6 |
| Extension installieren | Action 7 |
| Terminal-Befehl (whitelist) | Action 8 |
| Panel fokussieren (Explorer/Git/Problems) | Action 9 |
| Agent-Prompt (Subsystem) | Action 10 |
| Jede Action in Audit-Log | Backend |
| Fallback dokumentiert getestet | Mind. 1 Fallback pro Typ |

### Mobile UI / Modularität

| Kriterium | Messung |
|-----------|---------|
| Keine monolithische Cursor-Seite | View = 9 Module + Querschnittsmodule |
| Jedes Modul hat `moduleId` + `version` | UI-Module-Registry |
| Actions nur über Module-Registry geroutet | Kein hardcodierter `fetch` in Modulen ohne `actionId` |
| Designrules-Check vor UI-Build | Checkliste dokumentiert; fehlende Regeln gemeldet |
| Smartphone-first Darkmode | Galaxy S25 Ultra Viewport getestet |
| Confirmation bei riskanten Actions | ConfirmationDialogModule bei allen `needsConfirmation: true` |
| AuditHistory sichtbar | AuditHistoryModule zeigt letzte N Aktionen |
| Agent visuell als Subsystem | AgentPromptModule getrennt von IDE-Modulen |
| Modul austauschbar | Mind. 1 Modul in Registry deaktivierbar ohne Code-Änderung in anderen Modulen |

---

## Bewusst nicht in PoC v1

- Datei/Ordner **löschen** (`cursor.ide.fs.delete`) → v1.1
- Extension **deaktivieren/deinstallieren** → v1.1
- Dedizierte **Panel-State-API** → v1.1 (teilweise via Action 9)
- **Tasks/Debug** starten → v1.1
- **Git commit/push** → v1.1 (nur status via Action 1)
- Interface Reader / Vision
- GUI-Automation

---

## Phase 0 — Technical Foundation (nächster Chat)

**Chat-Titel:** `Bridge P0 — Technical Foundation / Capability Foundation`

Phase 0 baut die **technische Basis** für die 10 PoC-Actions — **ohne UI**.

### In Scope

| Komponente | Deliverable |
|------------|-------------|
| **Action Registry** | `adapters/cursor/registry/poc-v1-actions.json` |
| **Capability Router** | Extension-first; Fallback gemäß Spec |
| **Security Gate** | Token, Allowlists, `requiredPermission`, Confirmation-Flag (API-seitig) |
| **IDE-Control-Host** | Extension-Modul + localhost IPC-Server |
| **localhost-Kommunikation** | Sicheres Protokoll API ↔ Extension (127.0.0.1 only) |
| **Audit / History** | Persistente/logische History pro Action |
| **Versionierung** | Registry-Version, Cursor-Compatibility-Check, Snapshots für Rollback |
| **Testplan** | Testmatrix für 10 Actions + dokumentierte Fallbacks |

### Explizit nicht in Phase 0

- Keine fertige UI / kein Modular UI Renderer
- Keine Phase 1 Self-Structure
- Kein Interface Reader
- Keine große Design-Implementierung
- Kein `poc-v1-ui-modules.json` (Spec in v1.1.0 reicht; Umsetzung später)
- Keine Designrules-Audit-Umsetzung (nur identifizieren, falls Blocker)

### P0 Architektur-Ziel

```
bridge-api
  → Capability Router
  → Security Gate
  → localhost IPC
  → Bridge Extension (IDE-Control-Host)
  → Cursor IDE / agent CLI (Subsystem)
  → Audit Log
```

UI-Pipeline (`Modular UI Renderer`) kommt **nach** P0.

---

## Nächster Schritt nach Freigabe

### Phase 0 (zuerst)

1. `adapters/cursor/registry/poc-v1-actions.json` generieren
2. Capability Router + Security Gate in `shared/` oder `core/`
3. Extension `ideControlHost.ts` + localhost IPC
4. API-Routen `/api/v1/cursor/ide/*` + `/api/v1/cursor/agent/prompt`
5. Audit/History-Service
6. Testplan + Tests für 10 Actions

### Später (nach P0)

7. `poc-v1-ui-modules.json` + Designrules-Audit
8. Mobile Web: modulare View (9 Module)
9. UI-Modul-States (loading/error/empty)

**Phase 0 startet im neuen Chat — nicht in diesem.**
