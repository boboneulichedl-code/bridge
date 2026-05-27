# Bridge Cursor Adapter — P1 Interface Reader Konzept

**Status:** P1 (Konzept only — **keine Implementierung**)  
**Datum:** 2026-05-27  
**Referenz:** [poc-v1-spec.md](poc-v1-spec.md), [extension/src/ide/actions/status.ts](../../../extension/src/ide/actions/status.ts)

Bridge soll **später** strukturiert verstehen, welche Cursor-Oberflächen sichtbar oder fokussiert sind. **P1 baut keinen Interface Reader**, keine GUI-Automation, kein OCR und kein Vision-System.

---

## Zielbild (später)

Der Interface Reader liefert ein **`SurfaceState`**-Objekt: welche Views/Panels existieren, welche vermutlich sichtbar sind, und welche Daten **ohne** Screenshot aus Extension API oder indirekten Signalen stammen.

```
Bridge API  ←──  Interface Reader Service  ←──  Extension API / Commands
                     (later, not P1)
```

---

## Was kann heute gelesen werden?

### VS Code / Cursor Extension API (P0 Extension Handlers)

Implementiert in `getIdeStatus` und Action-Handlern:

| Signal | API / Quelle | Zuverlässigkeit |
|--------|----------------|-----------------|
| Workspace-Ordner | `vscode.workspace.workspaceFolders` | hoch |
| Aktive Datei + Zeile | `vscode.window.activeTextEditor` | hoch |
| Sichtbare Editoren (Anzahl, Pfade) | `vscode.window.visibleTextEditors` | hoch |
| Diagnostics (errors/warnings count) | `vscode.languages.getDiagnostics` | hoch (aggregiert) |
| Terminals (Anzahl, Namen) | `vscode.window.terminals` | hoch |
| Installierte Extensions (Anzahl) | `vscode.extensions.all` | hoch |
| Cursor/VS Code Version | `vscode.version` | hoch |

### P0 Action `cursor.ide.status.get`

- Primär: Extension API (oben)
- Fallback CLI: Prozess läuft, `cursor --version` — **kein** Editor/Workspace-Detail

### Indirekt über `cursor.ide.command.execute` (P0)

Panel-**Fokus auslösen** (nicht zuverlässig lesen):

| commandId | Panel |
|-----------|-------|
| `workbench.view.explorer` | Explorer |
| `workbench.view.scm` | SCM / Git |
| `workbench.actions.view.problems` | Problems |
| `workbench.action.terminal.new` | Terminal (neu) |

**Grenze:** Command fokussiert View; es gibt in P0 **keine** Action, die den aktuellen Panel-Zustand zuverlässig zurückgibt.

---

## Was könnte später indirekt sichtbar werden?

| Mechanismus | Phase | Beispiel |
|-------------|-------|----------|
| Dedizierte Panel-Commands + State-API | P0.1/P2 | `cursor.ide.panel.getState` |
| `vscode.commands.executeCommand` mit Rückgabewert | P2 | wenn Command Status liefert |
| Terminal Shell Integration | P2 | begrenzter Output (Spec: P0 nur „sent OK”) |
| Tasks/Debug-API | später | Task-Name, Debug-Session aktiv |
| Git-Extension API | probable | Repo-Branch via `vscode.git` |

Alles **proposed** — nicht in P0 implementiert.

---

## Was ist nicht zuverlässig lesbar?

| Oberfläche / Daten | Warum |
|--------------------|-------|
| Aktuell fokussiertes Side-Bar-Panel | Keine stabile öffentliche „active panel“ API in P0 |
| Terminal-Output-Inhalt | P0: nur sendText; Shell Integration variabel |
| Composer / Agent Chat UI-Inhalt | Kein dokumentiertes Read-API; Privacy |
| Command Palette offen/geschlossen | Kein Standard-Status |
| Pixel-genaue UI-Positionen | Nicht Extension API |
| Modal-Dialog-Inhalt (Confirm, etc.) | Nicht ohne invasive Hooks |

---

## Was wäre GUI-Automation — deshalb nicht P1

| Technik | Beschreibung | P1-Status |
|---------|--------------|-----------|
| Clipboard + `composer.newAgentChat` | Agent-Fallback P0 (experimental) | **kein** Interface Reader |
| Simulierte Tastatureingaben | UI-Automation | **verboten** in P1 |
| Externe UI-Driver (Windows UIA, etc.) | Programm-extern | **later**, nur wenn sicher |
| Fokus-Fenster via OS APIs | Fragil, plattformabhängig | **nicht P1** |

GUI-Automation gehört **nicht** zur P1-Analyse-Implementierung und nur kritisch geprüft in **später**.

---

## Was wäre Vision/OCR — deshalb nicht P1

| Technik | Risiko | Phase |
|---------|--------|-------|
| Screenshot + OCR | Privacy, Fehlerquote, Audit-Leaks | **nicht P1** |
| Vision-LLM auf IDE-Fenster | Kosten, Latenz, sensible Daten | **später / evtl. nie** |

P1 dokumentiert nur, dass **Extension API + strukturierte Commands** bevorzugt werden.

---

## Vorschlag: SurfaceState-Struktur (proposal only)

```typescript
// PROPOSAL ONLY — not in runtime
interface SurfaceState {
  observedAt: string;       // ISO
  adapterId: "cursor";
  observationLevel: "api" | "inferred" | "unreliable";
  workspace: { folders: string[] };
  editor: {
    activeFile: string | null;
    visibleEditorCount: number;
  };
  panels: PanelState[];
  terminals: { count: number; names: string[] };
  problems: { errors: number; warnings: number };
  agent: {
    subsystem: true;
    composerVisible: "unknown" | "inferred" | "api";
  };
}

interface PanelState {
  panelId:
    | "explorer"
    | "scm"
    | "problems"
    | "terminal"
    | "search"
    | "extensions"
    | "debug";
  visibility: "unknown" | "visible" | "hidden" | "focused";
  confidence: "high" | "medium" | "low";
  source: "extension-api" | "command-side-effect" | "inferred";
}
```

**P0 befüllbarer Teil:** workspace, editor, terminals, problems (aggregiert) — via `status.get`.  
**panels[].visibility:** meist `unknown` in P0; `focused` erst mit späterer API.

---

## Panel-Modellierung

| panelId | P0 lesbar? | P0 steuerbar? | Später |
|---------|------------|---------------|--------|
| explorer | indirekt (editors) | command.execute | panel.getState |
| scm | nein | command.execute | git API + panel |
| problems | counts ja | command.execute | diagnostics.list |
| terminal | count/names ja | terminal.run | output.read |
| search | nein | proposed command | search API |
| extensions | count ja | extension.install | list/disable |
| debug | nein | proposed | debug API |

---

## Privacy- und Security-Regeln

| Regel | Beschreibung |
|-------|--------------|
| Datenminimierung | Nur strukturierte Felder, keine Screenshots default |
| Keine Composer-Inhalte | Agent-UI nicht auslesen in Bridge Audit |
| Keine Klartext-Prompts | Bereits P0 Audit-Policy |
| Keine vollen Diagnostic-Messages | Nur Counts/Aggregate in API; Detail P2 optional mit Filter |
| User-Consent | Surface-Reader-Features opt-in (später) |
| Rate-Limits | Polling-Intervall begrenzen (P2) |

### Daten, die nie in Audit-Klartext dürfen

- Prompts und Agent-Chat-Inhalt
- Dateiinhalte
- Settings-Werte
- Terminal-Commands und -Output
- Vollständige Pfade (Policy: Hash; API-Status kann relative Pfade liefern — Audit trotzdem redigiert)
- Screenshots / OCR-Text
- Extension-Install-Parameter mit sensiblen IDs optional nur Hash

---

## Später benötigte Actions (proposed)

| actionId | Zweck | Phase |
|----------|-------|-------|
| `cursor.ide.surface.get` | SurfaceState abrufen | P0.1/P2 |
| `cursor.ide.panel.focus` | Panel fokussieren (dediziert) | P0.1 |
| `cursor.ide.panel.getVisibility` | Sichtbarkeit lesen | P2 |
| `cursor.ide.diagnostics.list` | Problems-Detail | P2 |
| `cursor.ide.terminal.output.read` | Terminal-Output (begrenzt) | P2 |

Alle **nicht implementiert** in P0.

---

## Risiken bei zu starker UI-Beobachtung

| Risiko | Mitigation |
|--------|------------|
| Privacy-Leak (Chat, Dateiinhalte) | API-only, keine OCR; strikte Redaction |
| Falsche UI-Annahmen (inferred focus) | `confidence` + `observationLevel` im Schema |
| Performance (Polling) | Event-driven wo möglich; TTL Cache |
| User-Vertrauen | Transparente Permissions `surface-read` |
| Sicherheits-Angriffsfläche | Reader nur localhost + gleiche Gate-Pipeline |
| Wartbarkeit | Kein GUI-Automation als Default |

---

## Abgrenzung P1 / P2 / Später

| Phase | Interface Reader |
|-------|------------------|
| **P1** | Dieses Konzept |
| **P2** | SurfaceState aus status.get + UI-Module für Problems/Git/Panels |
| **P0.1** | panel.focus Action (ohne vollständigen Reader) |
| **Später** | Dedizierter Reader-Service, evtl. erweiterte APIs |

---

## Verwandte Dokumente

- [p1-control-domains.md](p1-control-domains.md) (Domain 17)
- [p1-communication-model.md](p1-communication-model.md) (`channel.future.interface-reader`)
- [p1-cursor-self-structure.proposal.json](../../adapters/cursor/registry/p1-cursor-self-structure.proposal.json)
