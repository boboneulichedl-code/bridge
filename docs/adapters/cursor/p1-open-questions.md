# Bridge Cursor Adapter — P1 Open Questions

**Status:** P1 (offene Punkte — nicht implementieren bis geklärt)  
**Datum:** 2026-05-27  

Diese Fragen sind bewusst **nicht** in P1 gelöst. Entscheidungen gehören zu P1.1-Review, P0.1 oder P2.

---

## Architektur

| # | Frage | Kontext | Vorschlag zur Klärung |
|---|--------|---------|------------------------|
| A1 | Sollen `domainId`-Werte adapter-übergreifend identisch sein (`bridge.domain.workspace` vs. `cursor.domain.workspace`)? | Multi-Adapter (VS Code, Android Studio) | P1.1 Review mit Adapter-Roadmap |
| A2 | Wo lebt der **Permission Gate (UI)** technisch — `web/`, neues Package `@bridge/ui`, oder pro Adapter? | Spec-Pipeline: UI Gate zusätzlich zu API Security Gate | P2 Architektur-Entscheidung |
| A3 | Wie bindet der Modular UI Renderer die `web/`-Bestands-App — Erweiterung oder Neues Package? | `web/` existiert, aber nicht modular Cursor | P2 Spike |
| A4 | Soll `GET /api/v1/cursor/registry` künftig UI-Module-Metadaten mischen oder getrennte Endpoints? | P0: nur Actions | P1.1 API-Design |
| A5 | Einheitliches Audit-Schema für alle Adapter vs. cursor-spezifisch? | `cursor.domain.audit` als Bridge-weit denkbar | P1.1 |

---

## Designrules

| # | Frage | Kontext |
|---|--------|---------|
| D1 | Wo liegen Designrules, Tokens und Basis-Komponenten im Repo (Pfad, Package)? | **Aktuell fehlend** — nur in [poc-v1-spec.md](poc-v1-spec.md) referenziert |
| D2 | Mindest-Touch-Target-Größe Mobile? | phase-0-plan §14: evtl. fehlend |
| D3 | ConfirmationDialog: welche Tokens (Farben, Radius, Motion)? | Spec definiert Verhalten, nicht Visuals |
| D4 | Darkmode-first: konkrete Token-Set-Namen? | Spec fordert, Repo liefert keine |
| D5 | `loading` / `empty` / `error` / `disabled` States — globale Spec oder pro Modul? | [p1-ui-modules.proposal.json](../../adapters/cursor/registry/p1-ui-modules.proposal.json) markiert überall TBD |
| D6 | Dürfen Module ohne vollständige Designrules überhaupt gerendert werden? | Spec: **Nein** — blockieren bis Regel existiert |

---

## Security

| # | Frage | Kontext |
|---|--------|---------|
| S1 | Terminal-Erweiterung P0.1: nur Registry-Bump oder ad-hoc mit Extra-Confirmation? | P0: 6 exakte Commands |
| S2 | Scoped Client-Permissions: wann `restricted-client` produktiv nutzen? | `poc-v1-permissions.json` hat Beispiel |
| S3 | Braucht Interface Reader (später) eigene Permission `surface-read`? | Privacy |
| S4 | Dürfen relative Pfade in `status.get`-Response in Mobile UI angezeigt werden, wenn Audit gehasht? | Spannung API vs. Audit-Policy |
| S5 | WS-Events: welche weiteren Event-Typen neben `cursor.action.done`? | P2 Live-Updates |
| S6 | Rate-Limiting REST/WS für Mobile Clients? | Nicht in P0 |

---

## Adapter-Wiederverwendung

| # | Frage | Kontext |
|---|--------|---------|
| R1 | Welches `bridge.ui.*`-Modul ist der erste Nicht-Cursor-Adapter (VS Code vs. Terminal)? | Priorisierung Produkt |
| R2 | Chrome-Adapter: gibt es `command-exec`-Äquivalent oder nur URL/Tab-Actions? | Domain-Mapping abweichend |
| R3 | Android Studio: Extension-IPC analog Cursor oder Gradle/ADB primär? | Kommunikationsmodell |
| R4 | Gemeinsame `SurfaceState`-Schema für alle IDEs? | [p1-interface-reader-concept.md](p1-interface-reader-concept.md) |

---

## Interface Reader

| # | Frage | Kontext |
|---|--------|---------|
| I1 | Reicht Extension API + Commands ohne jemals GUI-Automation? | P1-These: ja bevorzugt |
| I2 | Minimaler `observationLevel` für Mobile (nur counts vs. panel visibility)? | UX vs. Privacy |
| I3 | Polling-Intervall vs. Event-driven für `cursor.surface.changed`? | Performance |
| I4 | Screenshots jemals erlauben (opt-in Debug)? | Vision-Pfad explizit vermeiden |

---

## UI-Module

| # | Frage | Kontext |
|---|--------|---------|
| U1 | Promotion `p1-ui-modules.proposal.json` → `poc-v1-ui-modules.json` in P1.1 — welches Schema versionieren? | Spec: separates `moduleVersion` |
| U2 | Module ohne P0-Action (`editor`, `panels`, `git`, `problems`): read-only aus status oder warten auf Actions? | P2 UX |
| U3 | `rollbackUndoVisibility` in Modulen: erst bei P0.1 Restore oder erst P2? | Kein falsches Undo-UI |
| U4 | Agent-Modul: eigener Tab/Accordion vs. nur visuelle Trennung im Stack? | Subsystem-Darstellung |
| U5 | Deaktivierbarkeit einzelner Module ohne Code-Änderung — Config-Datei wo? | Spec Erfolgskriterium PoC |

---

## P0.1 vs. P1 vs. P2 Abgrenzungen

| # | Frage | Entscheidung nötig |
|---|--------|-------------------|
| P1 | Restore-API (P0.1) vor erstem UI-Modul (P2)? | Empfehlung: ja — API vor Undo-Button |
| P2 | `cursor.ide.panel.focus` — P0.1 Action oder nur P2 UI über command.execute? | Spec: dedizierte API v1.1 |
| P3 | Live IDE-Status-WebSocket — P2 oder P0.1? | Heute nur `cursor.action.done` |
| P4 | Designrules vor P2 oder parallel erster Sprint? | Spec: Designrules Vorrang |
| P5 | Manuelle Live-Cursor-Tests: Gate für P1.1 oder nur P0-Verifikation? | User: blockiert P1 nicht |

---

## Dokumentierte Blocker aus P0 (keine offenen Fragen, aber P2-relevant)

- Designrules/Tokens fehlen im Repository
- `poc-v1-ui-modules.json` runtime fehlt
- `rollbackAvailable: false` bis P0.1

---

## Verwandte Dokumente

- [p1-review-checklist.md](p1-review-checklist.md)
- [p1-phase-boundaries.md](p1-phase-boundaries.md)
- [p1-analysis-report.md](p1-analysis-report.md)
