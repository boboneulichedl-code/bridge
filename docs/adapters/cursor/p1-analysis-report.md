# Bridge Cursor Adapter — P1 Analysebericht

**Status:** P1 (Analyse & Struktur)  
**Datum:** 2026-05-27  
**Quellen (verbindlich gelesen):** [p0-completion-report.md](p0-completion-report.md), [poc-v1-spec.md](poc-v1-spec.md), [phase-0-implementation-plan.md](phase-0-implementation-plan.md), [p0-manual-testing.md](p0-manual-testing.md)

---

## Kurzstatus P0

P0 ist **technisch abgeschlossen**. Die Capability-Foundation für **10 Actions** ist implementiert, abgesichert, geroutet und auditierbar.

| Kennzahl | Stand |
|----------|-------|
| Registry-Version | `poc-v1.1.0` |
| Actions | 10 (siehe `adapters/cursor/registry/poc-v1-actions.json`) |
| Automatisierte Tests | **127/127** grün (`npm run test:p0`) |
| Pipeline | Client → `/api/v1/cursor/*` → Security Gate → Capability Router → Executor → Audit |
| Snapshots | Erzeugung ja; Restore **nein** (`501 ROLLBACK_NOT_AVAILABLE`) |
| UI | Keine |
| Manuelle Live-Cursor-Tests | Offen, dokumentiert in [p0-manual-testing.md](p0-manual-testing.md); **blockiert P1 nicht** |

---

## Was P1 leisten soll

P1 erarbeitet die **konzeptionelle Struktur** für Bridge als IDE-/Programm-Control-System mit Cursor als **erstem Adapter**:

1. **Cursor Self-Structure** — wie sich Cursor gegenüber Bridge beschreibt (Proposal-JSON, nicht runtime)
2. **Bedienbereiche / Control Domains** — 17 logisch getrennte Domains
3. **Communication Model** — Kanäle, Richtungen, Security, Audit, Phasen
4. **UI-Modul-Modell** — Spezifikation für späteren Modular UI Renderer (Proposal-JSON)
5. **Interface-Reader-Konzept** — Analysemodell ohne Implementierung
6. **Phasentrennung** — P0, P0.1, P1, P1.1, P2, später ([p1-phase-boundaries.md](p1-phase-boundaries.md))

P1 baut **auf** der P0-Pipeline auf und **ersetzt** sie nicht.

---

## Was P1 ausdrücklich nicht leisten darf

| Verbot | Begründung |
|--------|------------|
| Produktivcode, Runtime-Verkabelung | P1 = Dokumentation only |
| Neue REST-Routen oder ausführbare Actions | P0-Foundation frozen |
| Änderung Security Gate, Router, Executor, IPC, Audit | P0-Stabilität |
| Terminal-Whitelist-Erweiterung | P0.1 |
| Snapshot-Restore | P0.1 |
| WebApp, UI-Komponenten, Modular UI Renderer | P2 |
| Interface Reader, GUI-Automation, OCR/Vision | Später / nicht P1 |
| Monolithische Cursor-Control-Seite | Spec + Architekturprinzip |
| Zukünftige Actions als `implemented` markieren | Ehrlichkeit gegenüber P0 |
| `rollbackAvailable: true` behaupten | P0 kommuniziert überall `false` |

---

## Stabile P0-Basis (nicht ersetzen)

Diese Komponenten gelten als **stabile Grundlage** für alle späteren Phasen:

| Komponente | Ort | Rolle |
|------------|-----|-------|
| Action Registry | `adapters/cursor/registry/poc-v1-actions.json` | 10 Actions, Metadaten, `rollbackAvailable: false` |
| Command-Allowlist | `poc-v1-commands.json` | 7 Workbench-Commands für Action 9 |
| Terminal-Whitelist | `poc-v1-terminal-whitelist.json` | 6 exakte Commands |
| Permissions | `poc-v1-permissions.json` | Client → Permission-Mapping |
| Security Gate | `adapters/cursor/src/security/` | Auth, Registry, Version, Permission, Confirmation, Allowlists |
| Capability Router | `adapters/cursor/src/router/` | Extension-first, Fallbacks |
| Executors | `extension`, `cli`, `filesystem` | Ausführung nach Methode |
| Extension IPC | `extension/src/ideControlHost.ts`, `extension/src/ide/ipc/` | `127.0.0.1:3848`, Token User-Config |
| Action Handlers 1–9 | `extension/src/ide/actions/` | VS Code Extension API |
| API | `api/src/cursor/` | Routes, Handler, Audit, Extension-Client |
| Contracts | `shared/src/cursor-contract.ts` | `P0_ACTION_IDS`, Fehlercodes, Typen |
| Audit + Redaction | `adapters/cursor/src/audit/`, `api/src/cursor/audit-service.ts` | JSONL, keine Klartext-Sensitivdaten |
| Snapshots | `adapters/cursor/src/snapshots/` | Erzeugung only |

**Loader-Hinweis:** `load-registry.ts` lädt nur `poc-v1-*.json`. P1-Proposals (`p1-*.proposal.json`) sind **bewusst nicht** eingebunden.

---

## Offene P0-Punkte (blockieren P1 nicht)

| Punkt | Status | Phase |
|-------|--------|-------|
| Manuelle Live-Cursor-Tests (IPC health, Extension status, Terminal, Audit) | Offen | Verifikation parallel zu P1 |
| Snapshot-Restore | `501` | P0.1 |
| `rollbackAvailable: true` in Responses | Nein | P0.1 |
| Agent Action 10 Extension-Fallback | Experimentell / IPC abgelehnt | P0.1 |
| Terminal nur 6 Commands | Restriktiv | P0.1 Erweiterung |
| Designrules/Tokens im Repo | Fehlen | P2 + Open Questions |

---

## Risiken bei vorzeitiger Implementierung (P1 → Code/UI)

| Risiko | Folge | P1-Gegenmaßnahme |
|--------|-------|------------------|
| Monolithische „Cursor Control Page“ | Nicht wiederverwendbar für andere Adapter | Modul-Spec in Proposal-JSON |
| Agent als Hauptzweck von Bridge | Falsches Produktbild | Agent als Subsystem in allen Docs |
| UI ohne Designrules | Inkonsistente Mobile UX | Lücken dokumentieren, nicht erfinden |
| Interface Reader zu früh | Privacy-/Sicherheitsrisiken | Nur Konzept in P1 |
| Proposal-JSON in Runtime laden | Verwechslung mit P0-Registry | `proposalOnly`, `runtimeActive: false` |
| Rollback in UI versprechen | User-Vertrauensverlust | Überall `rollbackAvailable: false` bis P0.1 |

---

## Architekturprinzipien, die P1 schützen muss

1. **Bridge = IDE-/Programm-Control-System** — Steuerung von Programmen (IDEs, Browser, Terminals, …) von externen Clients.
2. **Cursor = erster Adapter** — nicht das Gesamtsystem; gleiches Muster für VS Code, Android Studio, Chrome, Terminal, PowerShell.
3. **Agent = Subsystem** — `domain: agent`, eine von vielen Capabilities; nicht repräsentativ für Bridge.
4. **P0-Pipeline bleibt** — API Security Gate + Capability Router + Executor + Audit.
5. **UI-Pipeline kommt später** — Registry → Router → **Permission Gate (UI)** → Modular UI Renderer → Tokens → Mobile.
6. **Extension-first** — CLI/Filesystem nur dokumentierte Fallbacks.
7. **Audit-Minimierung** — Hashes statt Klartext für Prompts, Inhalte, Befehle, Pfade.
8. **Keine feste Spezial-UI** — Actions → Module, konfigurierbar pro Adapter.

---

## Warum Cursor nicht als monolithische Steuerseite modelliert werden darf

Die [poc-v1-spec.md](poc-v1-spec.md) verbietet ausdrücklich:

- eine feste Seite mit hart codierten Buttons,
- eine monolithische Cursor-Seite,
- eine Spezial-UI ohne Wiederverwendbarkeit.

**Gründe:**

- Spätere Adapter (VS Code, Android Studio, Chrome, …) sollen **dieselbe UI-Architektur** nutzen (`bridge.ui.*`-Module pro Action/Domain).
- Module müssen einzeln deaktivierbar, austauschbar und versionierbar sein.
- Die WebApp ist zentral, aber **zusammengesetzt** aus Registry + Permissions + Designrules — nicht aus Cursor-spezifischem Hardcoding.

P1 modelliert daher **Domains + UI-Module-Proposals**, keine „Cursor Control Page“.

---

## Warum der Agent nur Subsystem ist

| Aspekt | IDE-Domain | Agent-Subsystem |
|--------|------------|-----------------|
| Zweck | Workspace, FS, Settings, Terminal, Commands | Prompt an Cursor-Agent |
| P0-Actions | 9 × `domain: ide` | 1 × `domain: agent` |
| Methode | überwiegend Extension API | primär CLI |
| UI-Modul | IDE-Module + `bridge.ui.agent.prompt` (visuell getrennt) | nicht Hauptnavigation |
| Risiko | Allowlists, Confirmation | `allowFileChanges`, kein `--force` default |

Bridge-orchestrierte **Programmsteuerung** ist das Zielbild; Agent-Prompt ist **eine** optionale Capability.

---

## P0.1-Themen (getrennt von P1 halten)

Diese Punkte gehören **nicht** in P1-Implementierung, sondern in P0.1:

- Snapshot-Restore und `cursor.ide.settings.rollback`
- `rollbackAvailable: true` wo Restore real existiert
- Terminal-Whitelist-Erweiterung
- Agent Extension-Fallback produktionsreif
- Vertiefung Live-Test-Automatisierung

P1 **dokumentiert** sie in Domains und Proposals als `P0.1`, implementiert sie nicht.

---

## Technische Inventur (Pfad-Check)

| Pfad | Status | Anmerkung |
|------|--------|-----------|
| `docs/adapters/cursor/p0-completion-report.md` | vorhanden | Verbindliche Quelle |
| `docs/adapters/cursor/poc-v1-spec.md` | vorhanden | Verbindliche Quelle |
| `docs/adapters/cursor/phase-0-implementation-plan.md` | vorhanden | Verbindliche Quelle |
| `docs/adapters/cursor/p0-manual-testing.md` | vorhanden | Verbindliche Quelle |
| `adapters/cursor/registry/poc-v1-actions.json` | vorhanden | 10 Actions |
| `adapters/cursor/registry/poc-v1-commands.json` | vorhanden | 7 Commands |
| `adapters/cursor/registry/poc-v1-terminal-whitelist.json` | vorhanden | 6 Commands, exact match |
| `adapters/cursor/registry/poc-v1-permissions.json` | vorhanden | |
| `shared/src/cursor-contract.ts` | vorhanden | |
| `adapters/cursor/src/router/*` | vorhanden | |
| `adapters/cursor/src/security/*` | vorhanden | |
| `adapters/cursor/src/audit/*` | vorhanden | |
| `adapters/cursor/src/snapshots/*` | vorhanden | |
| `api/src/cursor/*` | vorhanden | handler, routes, audit-service, extension-client |
| `extension/src/ideControlHost.ts` | vorhanden | |
| `extension/src/ide/actions/*` | vorhanden | Actions 1–9 |
| `adapters/cursor/registry/poc-v1-ui-modules.json` | **fehlt** | Spec-Ziel; P2/P1.1 |
| Designrules / Tokens / Components (Repo) | **fehlt** | Nur in Spec referenziert → [p1-open-questions.md](p1-open-questions.md) |
| `web/` | vorhanden | Legacy/Mobile-Vorstufe; **kein** Modular Cursor UI (P2) |

**Abweichungen:** Keine kritischen Pfad-Abweichungen zur P0-Dokumentation. UI-Module-Registry und Designrules fehlen bewusst (noch nicht implementiert).

---

## P1-Deliverables (Übersicht)

| # | Datei | Typ |
|---|-------|-----|
| 1 | [p1-analysis-report.md](p1-analysis-report.md) | Analyse (dieses Dokument) |
| 2 | [p1-control-domains.md](p1-control-domains.md) | 17 Domains |
| 3 | [p1-communication-model.md](p1-communication-model.md) | Kanäle |
| 4 | [p1-interface-reader-concept.md](p1-interface-reader-concept.md) | Konzept |
| 5 | [p1-phase-boundaries.md](p1-phase-boundaries.md) | Phasen |
| 6 | [p1-open-questions.md](p1-open-questions.md) | Fragen |
| 7 | [p1-review-checklist.md](p1-review-checklist.md) | Checkliste |
| 8 | [p1-cursor-self-structure.proposal.json](../../adapters/cursor/registry/p1-cursor-self-structure.proposal.json) | Proposal |
| 9 | [p1-ui-modules.proposal.json](../../adapters/cursor/registry/p1-ui-modules.proposal.json) | Proposal |

---

## Verwandte Dokumente

- [p1-phase-boundaries.md](p1-phase-boundaries.md)
- [p1-control-domains.md](p1-control-domains.md)
- [p1-communication-model.md](p1-communication-model.md)
