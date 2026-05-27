# Bridge Cursor Adapter — P1 Phasengrenzen

**Status:** P1 (Analyse & Struktur)  
**Datum:** 2026-05-27  
**Referenz:** [p0-completion-report.md](p0-completion-report.md), [poc-v1-spec.md](poc-v1-spec.md), [phase-0-implementation-plan.md](phase-0-implementation-plan.md)

Dieses Dokument trennt **P0**, **P0.1**, **P1**, **P1.1**, **P2** und **spätere Phasen** verbindlich. P1 ersetzt keine P0-Komponente.

---

## P0 — Technical Action Foundation (abgeschlossen)

**Status:** Technisch abgeschlossen (127/127 automatisierte Tests). Manuelle Live-Cursor-Tests dokumentiert, blockieren P1 nicht.

### Enthält

| Bereich | Deliverable |
|---------|-------------|
| Actions | 10 PoC-Actions in `adapters/cursor/registry/poc-v1-actions.json` |
| REST | `/api/v1/cursor/*` (10 Action-Routen + Registry, Version, Audit) |
| Security Gate | Registry, Version, Permission, Allowlists, Confirmation |
| Capability Router | Extension-first + CLI/Filesystem-Fallbacks |
| Executor | Extension IPC, CLI, Filesystem |
| Extension IPC Host | `127.0.0.1:3848`, Token in User-Config |
| Audit | Append-only JSONL, Redaction, `paramsHash` |
| Snapshots | Erzeugung vor reversiblen Actions |
| Contracts | `shared/src/cursor-contract.ts` |

### Pipeline (frozen)

```
Client → /api/v1/cursor/* → Security Gate → Capability Router → Executor → Audit
```

### Explizit nicht in P0

- Kein UI / kein Modular UI Renderer
- Kein Snapshot-Restore (`501 ROLLBACK_NOT_AVAILABLE`)
- `rollbackAvailable: false` in API und Registry-Metadaten
- Kein Interface Reader / GUI-Automation / Vision
- Keine Actions über die 10 hinaus
- Keine `poc-v1-ui-modules.json` (Runtime)

---

## P0.1 — Technische Erweiterungen an P0

**Scope:** Direkte Erweiterung der P0-Basis — noch **keine** große UI, **keine** P1-Self-Structure-Umsetzung.

| Thema | Beschreibung |
|-------|--------------|
| Snapshot-Restore | `POST /api/v1/cursor/snapshots/:id/restore` implementieren |
| Rollback-Metadaten | `rollbackAvailable: true` nur wo Restore real verfügbar ist |
| Settings-Rollback | Action `cursor.ide.settings.rollback` (Spec v1.1) |
| Terminal-Whitelist | Erweiterung (Registry-Bump oder bestätigte Ad-hoc-Commands) |
| Agent Extension-Fallback | Action 10 per Extension-IPC produktionsreif (P0: in Extension abgelehnt) |
| Live-Tests | Vertiefung automatisierter Tests gegen laufende Cursor-Instanz |

**Abgrenzung zu P1:** P0.1 ist **Implementierung** an bestehender Pipeline; P1 ist **nur Dokumentation und Proposals**.

---

## P1 — Self-Structure & Communication Model (dieser Scope)

**Scope:** Analyse, Struktur, Modelle — **keine Implementierung**.

### Enthält (Deliverables)

| Datei | Zweck |
|-------|-------|
| [p1-analysis-report.md](p1-analysis-report.md) | P0-Status, P1-Ziele, Risiken, Inventur |
| [p1-control-domains.md](p1-control-domains.md) | 17 Bedienbereiche |
| [p1-communication-model.md](p1-communication-model.md) | Kanäle, Security, Audit, Phasen |
| [p1-interface-reader-concept.md](p1-interface-reader-concept.md) | Oberflächen-Erfassung (Konzept only) |
| [p1-phase-boundaries.md](p1-phase-boundaries.md) | Dieses Dokument |
| [p1-open-questions.md](p1-open-questions.md) | Offene Fragen |
| [p1-review-checklist.md](p1-review-checklist.md) | Review-Checkliste |
| [p1-cursor-self-structure.proposal.json](../../adapters/cursor/registry/p1-cursor-self-structure.proposal.json) | Self-Structure (nicht runtime-aktiv) |
| [p1-ui-modules.proposal.json](../../adapters/cursor/registry/p1-ui-modules.proposal.json) | UI-Module-Spec (nicht runtime-aktiv) |

### Explizit nicht in P1

- Kein Produktivcode, keine Runtime-Verkabelung
- Keine neuen REST-Routen oder ausführbaren Actions
- Keine Änderung an Security Gate, Router, Executor, IPC, Audit
- Keine WebApp, keine UI-Komponenten, kein Modular UI Renderer
- Kein Interface Reader, keine GUI-Automation, kein OCR/Vision
- Keine Änderung an `poc-v1-*.json` (nur neue `p1-*.proposal.json`)

---

## P1.1 — Registry-Verfeinerung & Proposal-Review

**Scope:** Review und ggf. Promotion der P1-Proposals — **noch keine große UI**.

| Thema | Beschreibung |
|-------|--------------|
| Proposal-Review | `p1-cursor-self-structure.proposal.json`, `p1-ui-modules.proposal.json` |
| Domain-IDs | Abgleich mit Multi-Adapter-Strategie (VS Code, Android Studio, …) |
| UI-Module-Promotion | Entscheidung: `poc-v1-ui-modules.json` aus Proposals ableiten (Runtime) |
| Open Questions | Klärung aus [p1-open-questions.md](p1-open-questions.md) |

**Abgrenzung zu P2:** P1.1 bereitet Registry vor; P2 implementiert Renderer und Module.

---

## P2 — Modular UI & Mobile

**Scope:** UI-Implementierung auf bestehender P0-Pipeline.

| Thema | Beschreibung |
|-------|--------------|
| Modular UI Renderer | Konsumiert Action Registry + Capability-Metadaten |
| Permission Gate (UI) | Vor Render und vor Action (zusätzlich zu API Security Gate) |
| UI-Module | Implementierung der in [p1-ui-modules.proposal.json](../../adapters/cursor/registry/p1-ui-modules.proposal.json) spezifizierten Module |
| Designrules/Tokens | Anwendung sobald im Repo vorhanden (siehe Open Questions) |
| Mobile View | Smartphone-first, Darkmode, modulare View-Zusammensetzung |
| Live-Updates | WebSocket/SSE für Clients (Erweiterung über `cursor.action.done` hinaus) |

**Ziel-Pipeline (aus Spec):**

```
Action Registry → Capability Router → Permission Gate → Modular UI Renderer → Designrules/Tokens → Mobile View
```

**Abgrenzung:** P2 baut **auf** P0 auf; ersetzt Security Gate, Router und Executor nicht.

---

## Später — Interface Reader, erweiterte Beobachtung, weitere Adapter

| Thema | Phase | Beschreibung |
|-------|-------|--------------|
| Interface Reader (Implementierung) | Später | Strukturierte IDE-Oberflächen-Erfassung (Konzept in P1) |
| GUI-Automation / Vision / OCR | Später (falls überhaupt) | Nur wenn sicher und sinnvoll; nicht P1 |
| Weitere Adapter | Parallel/später | VS Code, Android Studio, Chrome, Terminal, PowerShell |
| Dedizierte Panel-State-API | P0.1/P2+ | Teilweise heute via `command.execute` |
| Git commit/push, Tasks/Debug | P0.1+ | Spec „bewusst nicht in PoC v1“ |

---

## Übersicht: Was darf welche Phase ändern?

| Komponente | P0 | P0.1 | P1 | P1.1 | P2 | Später |
|------------|----|------|----|------|----|--------|
| `poc-v1-actions.json` | ✓ implementiert | erweitern | — | review | — | — |
| Security Gate | ✓ | erweitern | dokumentieren | — | UI-Gate zusätzlich | — |
| Capability Router | ✓ | erweitern | dokumentieren | — | — | — |
| Extension IPC | ✓ | erweitern | dokumentieren | — | — | — |
| Audit | ✓ | erweitern | dokumentieren | — | UI-Anzeige | — |
| Snapshots | create ✓ | restore ✓ | dokumentieren | — | UI-Rollback-Anzeige | — |
| `p1-*.proposal.json` | — | — | ✓ erstellen | review/promote | — | — |
| WebApp / UI-Module | — | — | spec only | review | ✓ implementieren | — |
| Interface Reader | — | — | Konzept | — | — | ✓ implementieren |

---

## Verwandte Dokumente

- [p1-analysis-report.md](p1-analysis-report.md)
- [p1-open-questions.md](p1-open-questions.md)
- [p1-review-checklist.md](p1-review-checklist.md)
