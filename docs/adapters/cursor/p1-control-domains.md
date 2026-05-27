# Bridge Cursor Adapter — P1 Control Domains (Bedienbereiche)

**Status:** P1 (Analyse & Struktur)  
**Datum:** 2026-05-27  
**Referenz:** [poc-v1-spec.md](poc-v1-spec.md), [p1-cursor-self-structure.proposal.json](../../adapters/cursor/registry/p1-cursor-self-structure.proposal.json)

Cursor wird in **17 logisch getrennte Bedienbereiche** gegliedert. **P0-Actions** sind implementiert; alle anderen Actions sind **`proposed` / `future`** — nicht als implementiert darstellen.

**Legende Phasen:** `P0` = implementiert | `P0.1` = technische Erweiterung P0 | `P1` = Struktur/Doku | `P1.1` = Proposal-Review | `P2` = UI | `later` = Interface Reader / Vision

---

## 1. IDE Status / Runtime State

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.ide.status` |
| **Name** | IDE Status / Runtime State |
| **Zweck** | Heartbeat, Liveness, IDE-/Extension-Version, grober Laufzeitkontext für Clients |
| **Owner** | IDE (+ Bridge für Aggregation) |
| **P0-Actions (implementiert)** | `cursor.ide.status.get` |
| **Proposed future actions** | `cursor.ide.health.subscribe` (WS-Stream), `cursor.ide.process.restart` |
| **Dateninputs** | — (GET); optional `includeExtensions`, `includeDiagnostics` |
| **Events** | `cursor.action.done` (nach anderen Actions); proposed: `cursor.ide.status.changed` |
| **Permissions** | `read` |
| **Risiko-Level** | low |
| **Bestätigungspflicht** | nein |
| **Audit** | result, methodUsed, durationMs; keine Workspace-Pfade in Klartext (Policy: Hash optional) |
| **UI-Modul-Kandidat** | `bridge.ui.cursor.status` |
| **Wiederverwendbarkeit** | VS Code (gleiche Extension API), Android Studio (IDE online/offline), Chrome (Tab count), Terminal (session alive), PowerShell (host version) |
| **Phase** | Domain-Modell **P1**; Action **P0**; Live-Stream **P2** |

---

## 2. Workspace / Project Control

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.workspace` |
| **Name** | Workspace / Project Control |
| **Zweck** | Ordner/Projekt als Workspace öffnen, Kontext wechseln |
| **Owner** | IDE |
| **P0-Actions (implementiert)** | `cursor.ide.workspace.open` |
| **Proposed future actions** | `cursor.ide.workspace.close`, `cursor.ide.workspace.list`, `cursor.snapshots.restore` (workspace snapshot) |
| **Dateninputs** | `path`, `newWindow`, `confirmed` |
| **Events** | `cursor.action.done`; proposed: `cursor.workspace.changed` |
| **Permissions** | `workspace` |
| **Risiko-Level** | medium |
| **Bestätigungspflicht** | ja (`needsConfirmation: true`) |
| **Audit** | paramsHash (Pfad gehasht), snapshotId optional, `rollbackAvailable: false` (P0) |
| **UI-Modul-Kandidat** | `bridge.ui.workspace` |
| **Wiederverwendbarkeit** | VS Code, Android Studio (Projekt open), Chrome (Profile/Window — anderes Modell) |
| **Phase** | Action **P0**; Restore **P0.1** |

---

## 3. File System / File Creation

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.fs` |
| **Name** | File System / File Creation |
| **Zweck** | Ordner und Dateien unter Allowlist anlegen/ändern |
| **Owner** | IDE (+ Bridge FS-Fallback) |
| **P0-Actions (implementiert)** | `cursor.ide.fs.mkdir`, `cursor.ide.fs.write` |
| **Proposed future actions** | `cursor.ide.fs.delete`, `cursor.ide.fs.read`, `cursor.ide.fs.rename`, Content-Snapshot-Restore |
| **Dateninputs** | `path`, `content`, `overwriteExisting`, `openAfterWrite`, `confirmed` (bei overwrite) |
| **Events** | `cursor.action.done` |
| **Permissions** | `fs-write` (delete später: `fs-delete`) |
| **Risiko-Level** | medium (high bei overwrite) |
| **Bestätigungspflicht** | mkdir nein; write bei `overwriteExisting` |
| **Audit** | Inhalte nur Hash + Byte-Länge; Pfade gehasht |
| **UI-Modul-Kandidat** | `bridge.ui.file.create` |
| **Wiederverwendbarkeit** | VS Code, Terminal/PowerShell (file ops), Android Studio (resource files) |
| **Phase** | Actions **P0**; delete/read **P0.1+** |

---

## 4. Editor / Open Files / Active Document

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.editor` |
| **Name** | Editor / Open Files / Active Document |
| **Zweck** | Aktive Datei, sichtbare Editoren, optional öffnen nach Write |
| **Owner** | IDE |
| **P0-Actions (implementiert)** | *(indirekt)* `cursor.ide.status.get` (activeFile, visibleTextEditors), `cursor.ide.fs.write` (`openAfterWrite`) |
| **Proposed future actions** | `cursor.ide.editor.open`, `cursor.ide.editor.close`, `cursor.ide.editor.reveal` |
| **Dateninputs** | Status: —; Write: `openAfterWrite`; proposed: `path`, `line` |
| **Events** | proposed: `cursor.editor.active.changed` |
| **Permissions** | `read` (status), `fs-write` (open via write) |
| **Risiko-Level** | low–medium |
| **Bestätigungspflicht** | nur bei destruktiven proposed Actions |
| **Audit** | Editor-Pfade in Status-Response erlaubt (API); Audit weiterhin redigiert |
| **UI-Modul-Kandidat** | `bridge.ui.editor` |
| **Wiederverwendbarkeit** | VS Code, Android Studio (open file), Chrome (active tab — anderes Modell) |
| **Phase** | Lesen **P0**; dedizierte Editor-Actions **P0.1/P2** |

---

## 5. Settings / Configuration

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.settings` |
| **Name** | Settings / Configuration |
| **Zweck** | User/Workspace-Konfiguration lesen und ändern (versioniert) |
| **Owner** | IDE (+ FS-Fallback) |
| **P0-Actions (implementiert)** | `cursor.ide.settings.get`, `cursor.ide.settings.set` |
| **Proposed future actions** | `cursor.ide.settings.rollback` |
| **Dateninputs** | `section`, `key`, `value`, `target`, `confirmed` (set) |
| **Events** | `cursor.action.done` |
| **Permissions** | `read`, `settings` |
| **Risiko-Level** | medium (set) |
| **Bestätigungspflicht** | get nein; set ja |
| **Audit** | Settings-Werte gehasht; snapshotId bei set |
| **UI-Modul-Kandidat** | `bridge.ui.settings` |
| **Wiederverwendbarkeit** | VS Code, Android Studio (gradle/settings), Chrome (prefs — Adapter-spezifisch) |
| **Phase** | Actions **P0**; rollback Action **P0.1** |

---

## 6. Extensions / Plugin Management

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.extensions` |
| **Name** | Extensions / Plugin Management |
| **Zweck** | Extensions installieren (Marketplace / CLI-Fallback) |
| **Owner** | IDE |
| **P0-Actions (implementiert)** | `cursor.ide.extension.install` |
| **Proposed future actions** | `cursor.ide.extension.uninstall`, `cursor.ide.extension.list`, `cursor.ide.extension.disable` |
| **Dateninputs** | `extensionId`, `preRelease`, `confirmed` |
| **Events** | `cursor.action.done` |
| **Permissions** | `extension-manage` |
| **Risiko-Level** | high (`externalCode: true`) |
| **Bestätigungspflicht** | immer ja |
| **Audit** | `riskClass: external-code`, paramsHash |
| **UI-Modul-Kandidat** | `bridge.ui.extension.install` |
| **Wiederverwendbarkeit** | VS Code, Android Studio (plugins), Chrome (extensions) |
| **Phase** | install **P0**; uninstall **P0.1** |

---

## 7. Terminal

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.terminal` |
| **Name** | Terminal |
| **Zweck** | Whitelist-Befehle in IDE-Terminal senden |
| **Owner** | IDE |
| **P0-Actions (implementiert)** | `cursor.ide.terminal.run` |
| **Proposed future actions** | `cursor.ide.terminal.output.read`, `cursor.ide.terminal.create`, `cursor.ide.terminal.kill` |
| **Dateninputs** | `command`, `cwd`, `terminalName`, `confirmed` |
| **Events** | `cursor.action.done` |
| **Permissions** | `terminal` |
| **Risiko-Level** | high (`destructive: true`) |
| **Bestätigungspflicht** | ja |
| **Audit** | Command gehasht; Whitelist-Match-Flag |
| **UI-Modul-Kandidat** | `bridge.ui.terminal.command` |
| **Wiederverwendbarkeit** | VS Code, Terminal/PowerShell (native), Android Studio (Gradle terminal) |
| **Phase** | run **P0** (6 exakte Commands); Erweiterung **P0.1** |

**P0-Whitelist:** `npm run build`, `npm test`, `npm run test`, `git status`, `git diff`, `git log`

---

## 8. Commands / Command Palette / Workbench Commands

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.commands` |
| **Name** | Commands / Command Palette |
| **Zweck** | Registrierte Workbench-Commands ausführen (Allowlist) |
| **Owner** | IDE |
| **P0-Actions (implementiert)** | `cursor.ide.command.execute` |
| **Proposed future actions** | `cursor.ide.command.list`, `cursor.ide.command.search` |
| **Dateninputs** | `commandId`, `args`, `confirmed` |
| **Events** | `cursor.action.done` |
| **Permissions** | `command-exec` |
| **Risiko-Level** | high (command-abhängig) |
| **Bestätigungspflicht** | ja |
| **Audit** | commandId in Metadaten; args gehasht |
| **UI-Modul-Kandidat** | `bridge.ui.ide.command` |
| **Wiederverwendbarkeit** | VS Code, Android Studio (actions), Chrome (kein Palette — anders) |
| **Phase** | execute **P0** |

**P0-Allowlist (7):** `workbench.action.terminal.new`, `workbench.action.files.saveAll`, `workbench.action.closeActiveEditor`, `workbench.view.explorer`, `workbench.view.scm`, `workbench.actions.view.problems`, `workbench.action.tasks.runTask`

---

## 9. Panels / Explorer / SCM / Problems / Search

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.panels` |
| **Name** | Panels / Side Bar Views |
| **Zweck** | Workbench-Views fokussieren (Explorer, SCM, Problems, …) |
| **Owner** | IDE |
| **P0-Actions (implementiert)** | *(indirekt)* `cursor.ide.command.execute` (Panel-Commands in Allowlist) |
| **Proposed future actions** | `cursor.ide.panel.focus`, `cursor.ide.panel.getState`, `cursor.ide.search.open` |
| **Dateninputs** | commandId + args (P0); proposed: `panelId`, `visible` |
| **Events** | proposed: `cursor.panel.focus.changed` |
| **Permissions** | `command-exec` (P0) |
| **Risiko-Level** | low–medium |
| **Bestätigungspflicht** | ja (via command.execute) |
| **Audit** | wie command.execute |
| **UI-Modul-Kandidat** | `bridge.ui.panels` |
| **Wiederverwendbarkeit** | VS Code; Android Studio (Tool Windows); Chrome (DevTools panels) |
| **Phase** | indirekt **P0**; dedizierte Panel-API **P0.1/P2** |

---

## 10. Git / Source Control

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.git` |
| **Name** | Git / Source Control |
| **Zweck** | Repository-Status, SCM-Panel, eingeschränkte Git-Befehle |
| **Owner** | IDE (+ Terminal für Git-CLI) |
| **P0-Actions (implementiert)** | *(indirekt)* `cursor.ide.status.get` (Git probable), `cursor.ide.terminal.run` (`git status`, `git diff`, `git log`), `cursor.ide.command.execute` (`workbench.view.scm`) |
| **Proposed future actions** | `cursor.ide.git.status`, `cursor.ide.git.commit`, `cursor.ide.git.push` |
| **Dateninputs** | Terminal: command + cwd; proposed: branch, message |
| **Events** | `cursor.action.done` |
| **Permissions** | `read`, `terminal`, `command-exec` |
| **Risiko-Level** | medium (commit/push später: high) |
| **Bestätigungspflicht** | Terminal/Command ja; status nein |
| **Audit** | Git-Befehle gehasht |
| **UI-Modul-Kandidat** | `bridge.ui.git.status` |
| **Wiederverwendbarkeit** | VS Code, Android Studio (VCS), Terminal |
| **Phase** | indirekt **P0**; dedizierte Git-Actions **P0.1+** |

---

## 11. Problems / Diagnostics

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.problems` |
| **Name** | Problems / Diagnostics |
| **Zweck** | Fehler-/Warnungszählung, Problems-Panel |
| **Owner** | IDE |
| **P0-Actions (implementiert)** | *(indirekt)* `cursor.ide.status.get` (errors/warnings), `cursor.ide.command.execute` (`workbench.actions.view.problems`) |
| **Proposed future actions** | `cursor.ide.diagnostics.list`, `cursor.ide.diagnostics.clear` |
| **Dateninputs** | Status: —; proposed: `uri`, `severity` |
| **Events** | proposed: `cursor.diagnostics.changed` |
| **Permissions** | `read`, `command-exec` |
| **Risiko-Level** | low |
| **Bestätigungspflicht** | Command ja; read nein |
| **Audit** | Aggregat-Zahlen ok in API; keine vollen Diagnostic-Messages in Audit |
| **UI-Modul-Kandidat** | `bridge.ui.problems` |
| **Wiederverwendbarkeit** | VS Code, Android Studio (Lint/Build), Chrome (console — anders) |
| **Phase** | Aggregat **P0**; Liste **P2** |

---

## 12. Tasks / Build / Test / Debug

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.tasks` |
| **Name** | Tasks / Build / Test / Debug |
| **Zweck** | Tasks ausführen, Build/Test anstoßen |
| **Owner** | IDE |
| **P0-Actions (implementiert)** | *(indirekt)* `cursor.ide.terminal.run` (`npm run build`, `npm test`, …), `cursor.ide.command.execute` (`workbench.action.tasks.runTask`) |
| **Proposed future actions** | `cursor.ide.debug.start`, `cursor.ide.debug.stop`, `cursor.ide.task.run` |
| **Dateninputs** | Terminal command oder task name in args |
| **Events** | `cursor.action.done` |
| **Permissions** | `terminal`, `command-exec` |
| **Risiko-Level** | medium–high |
| **Bestätigungspflicht** | ja |
| **Audit** | command/task gehasht |
| **UI-Modul-Kandidat** | *(Teil von Terminal/Command-Modulen; später eigenes Task-Modul proposed)* |
| **Wiederverwendbarkeit** | VS Code, Android Studio (Gradle), Terminal |
| **Phase** | indirekt **P0**; dediziert **P0.1+** |

---

## 13. Agent / AI Composer / Agent Chat (Subsystem)

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.agent` |
| **Name** | Agent / AI Composer (Subsystem) |
| **Zweck** | Prompt an Cursor-Agent senden — **nicht** Hauptzweck von Bridge |
| **Owner** | **Agent-Subsystem** (unter Adapter `cursor`) |
| **P0-Actions (implementiert)** | `cursor.agent.prompt.send` |
| **Proposed future actions** | `cursor.agent.job.status`, `cursor.agent.job.cancel`, `cursor.agent.session.list` |
| **Dateninputs** | `prompt`, `mode`, `headless`, `allowFileChanges`, `confirmed` |
| **Events** | `cursor.action.done`; Legacy WS events für Jobs |
| **Permissions** | `agent-run` |
| **Risiko-Level** | high |
| **Bestätigungspflicht** | ja |
| **Audit** | Prompt nur Hash + Länge; kein Klartext |
| **UI-Modul-Kandidat** | `bridge.ui.agent.prompt` (visuell als Subsystem) |
| **Wiederverwendbarkeit** | Cursor-spezifisch; andere IDEs haben eigene AI-Subsysteme |
| **Phase** | send **P0** (CLI primär); Extension-Fallback **P0.1** |

**Hinweis:** `subsystem: true`, `parentAdapter: cursor` — siehe Self-Structure Proposal.

---

## 14. Audit / History / Action Feedback

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.audit` |
| **Name** | Audit / History / Action Feedback |
| **Zweck** | Nachvollziehbarkeit aller Actions für Clients |
| **Owner** | Bridge (+ API) |
| **P0-Actions (implementiert)** | *(keine execute-Action)* — `GET /api/v1/cursor/audit` |
| **Proposed future actions** | `bridge.audit.export`, `bridge.audit.filter.subscribe` |
| **Dateninputs** | `limit`, `actionId` (Query) |
| **Events** | `cursor.action.done` (WebSocket) |
| **Permissions** | `read` |
| **Risiko-Level** | low (Leakage-Risiko wenn Redaction fehlschlägt → high) |
| **Bestätigungspflicht** | nein (read-only) |
| **Audit** | Meta-Audit nicht rekursiv in Klartext |
| **UI-Modul-Kandidat** | `bridge.ui.audit.history` |
| **Wiederverwendbarkeit** | Alle Adapter (einheitliches Audit-Schema) |
| **Phase** | Service **P0**; UI **P2** |

---

## 15. Permissions / Confirmations / Risk States

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.permissions` |
| **Name** | Permissions / Confirmations / Risk |
| **Zweck** | Zugriffskontrolle, Bestätigung, Risiko-Klassen |
| **Owner** | **Cross-Cutting** (Bridge Security Gate P0; UI Permission Gate P2) |
| **P0-Actions (implementiert)** | *(Querschnitt)* — erzwungen durch Security Gate auf allen 10 Actions |
| **Proposed future actions** | — (Policy-Änderungen über Registry-Version) |
| **Dateninputs** | `confirmed: true`, Bearer token, optional `X-Bridge-Client-Id` |
| **Events** | `cursor.action.done` mit `result: blocked` |
| **Permissions** | alle `ActionPermission`-Werte |
| **Risiko-Level** | cross-cutting |
| **Bestätigungspflicht** | action-spezifisch |
| **Audit** | blocked-Entries mit errorCode |
| **UI-Modul-Kandidat** | `bridge.ui.permission.gate`, `bridge.ui.confirmation.dialog` |
| **Wiederverwendbarkeit** | Alle Adapter |
| **Phase** | API Gate **P0**; UI Gate **P2** |

---

## 16. Version / Compatibility / Capability Discovery

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.version` |
| **Name** | Version / Compatibility / Discovery |
| **Zweck** | Registry-, Cursor-, Extension-Versionen; kompatible Actions |
| **Owner** | Bridge + IDE (health) |
| **P0-Actions (implementiert)** | *(Meta)* `GET /api/v1/cursor/registry`, `GET /api/v1/cursor/version`; Extension `GET /health`, `GET /capabilities` |
| **Proposed future actions** | `bridge.adapter.capabilities.diff` |
| **Dateninputs** | — |
| **Events** | proposed: `bridge.registry.updated` |
| **Permissions** | `read` |
| **Risiko-Level** | low |
| **Bestätigungspflicht** | nein |
| **Audit** | optional bei blocked VERSION_INCOMPATIBLE |
| **UI-Modul-Kandidat** | `bridge.ui.version.info` |
| **Wiederverwendbarkeit** | Alle Adapter |
| **Phase** | Endpoints **P0**; UI **P2** |

**P0:** `snapshotRestoreAvailable: false` in Version-Response.

---

## 17. Interface Reader / IDE Surface Observation

| Feld | Wert |
|------|------|
| **domainId** | `cursor.domain.interface-reader` |
| **Name** | Interface Reader / Surface Observation |
| **Zweck** | Strukturiert erfassen, welche IDE-Oberflächen sichtbar/fokussiert sind |
| **Owner** | Bridge (konzeptionell); Beobachtung via Extension API (später) |
| **P0-Actions (implementiert)** | **keine** |
| **Proposed future actions** | `cursor.ide.surface.get`, `cursor.ide.panel.getVisibility`, `cursor.ide.ui.tree.snapshot` |
| **Dateninputs** | proposed: `surfaceIds[]`, `depth` |
| **Events** | proposed: `cursor.surface.changed` |
| **Permissions** | `read` (strikt); evtl. separate `surface-read` |
| **Risiko-Level** | medium–high (Privacy, Über-Beobachtung) |
| **Bestätigungspflicht** | proposed: konfigurierbar |
| **Audit** | Keine UI-Klartexte, keine Screenshots in Audit |
| **UI-Modul-Kandidat** | *(kein dediziertes P2-Modul in PoC-Liste; optional Status-Erweiterung)* |
| **Wiederverwendbarkeit** | VS Code (API); Chrome (DOM — anderer Ansatz); GUI-Automation **nicht** empfohlen |
| **Phase** | Konzept **P1** ([p1-interface-reader-concept.md](p1-interface-reader-concept.md)); Implementierung **later** |

**P1:** Kein Interface Reader, kein OCR, keine GUI-Automation.

---

## Domain-Übersicht (Matrix)

| # | domainId | P0 Actions | Phase Domain |
|---|----------|------------|--------------|
| 1 | `cursor.domain.ide.status` | status.get | P1 |
| 2 | `cursor.domain.workspace` | workspace.open | P1 |
| 3 | `cursor.domain.fs` | fs.mkdir, fs.write | P1 |
| 4 | `cursor.domain.editor` | (indirekt) | P1 |
| 5 | `cursor.domain.settings` | settings.get/set | P1 |
| 6 | `cursor.domain.extensions` | extension.install | P1 |
| 7 | `cursor.domain.terminal` | terminal.run | P1 |
| 8 | `cursor.domain.commands` | command.execute | P1 |
| 9 | `cursor.domain.panels` | (indirekt) | P1 |
| 10 | `cursor.domain.git` | (indirekt) | P1 |
| 11 | `cursor.domain.problems` | (indirekt) | P1 |
| 12 | `cursor.domain.tasks` | (indirekt) | P1 |
| 13 | `cursor.domain.agent` | agent.prompt.send | P1 |
| 14 | `cursor.domain.audit` | GET audit | P1 |
| 15 | `cursor.domain.permissions` | (Querschnitt) | P1 |
| 16 | `cursor.domain.version` | registry, version | P1 |
| 17 | `cursor.domain.interface-reader` | — | P1 / later impl |

---

## Verwandte Dokumente

- [p1-interface-reader-concept.md](p1-interface-reader-concept.md)
- [p1-communication-model.md](p1-communication-model.md)
- [p1-ui-modules.proposal.json](../../adapters/cursor/registry/p1-ui-modules.proposal.json)
