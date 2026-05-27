# Global Control Design Rules — Index

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Status:** D0c (Preview Foundation implementiert — Review ausstehend)  
**Version:** 0.1.0-d0c  
**Datum:** 2026-05-27  
**Pfad:** `docs/global-design/control-rules/`

---

## Zweck

Dieses Verzeichnis enthält die **Global Control Design Rules** — normative Designregeln für modulare Control-/Programmsteuerungs-Oberflächen (Smartphone-first, risk-aware, modular).

Sie gelten für Bridge und spätere Control-Produkte. Sie sind **global wiederverwendbar**, **nicht produkt-/adapter-spezifisch** und **kein** fertiges Designsystem mit implementierten Komponenten.

---

## Regelgruppen (7 + Rahmen)

| # | Datei | Inhalt |
|---|-------|--------|
| 1 | [global-base-design-rules.md](global-base-design-rules.md) | Farben, Typografie, Spacing, Radius, Borders, Shadows, Darkmode, Kontrast, Icons, Layout, Token-Naming |
| 2 | [global-control-design-rules.md](global-control-design-rules.md) | Action-Module, Cards, Status, Command/Terminal/Agent, Restore, Audit, Permission, Confirmation |
| 3 | [global-mobile-control-rules.md](global-mobile-control-rules.md) | Touch, Thumb-Zone, Scroll, Bottom Actions, Safe Areas, Galaxy S25 Ultra |
| 4 | [global-risk-interaction-rules.md](global-risk-interaction-rules.md) | Risk-Stufen, Confirmation, Gate-Outcomes |
| 5 | [global-module-composition-rules.md](global-module-composition-rules.md) | Modul-Stack, Hierarchie, Agent-Subsystem, Progressive Disclosure |
| 6 | [global-state-display-rules.md](global-state-display-rules.md) | loading, empty, success, warning, error, blocked, … |
| 7 | [global-preview-rules.md](global-preview-rules.md) | Meta: Regel ↔ Preview, Review-Gate, nicht Produkt-UI |

| Rahmen | Datei |
|--------|-------|
| Index | Diese Datei |
| **D0.1 Entscheidungen** | [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md) |
| Offene Fragen | [global-control-design-open-questions.md](global-control-design-open-questions.md) |
| Review | [global-control-design-review-checklist.md](global-control-design-review-checklist.md) |
| Preview-Spec (D0b) | [preview/global-control-design-preview-spec.md](preview/global-control-design-preview-spec.md) |
| Tokens (D0c) | [tokens/control.tokens.json](tokens/control.tokens.json) · [tokens/README.md](tokens/README.md) |
| Static Preview (D0c) | [preview/static/index.html](preview/static/index.html) · [preview/static/README.md](preview/static/README.md) |

---

## Harte Gates (verbindlich)

| Bedingung | Ergebnis |
|-----------|----------|
| Fehlende Regel | **Blocker** — keine UI-Implementierung |
| Fehlende Preview-Sektion (D0b) | **Blocker** |
| Fehlender State (Rules + Preview-Spec) | **Blocker** |
| Fehlende Risk-/Confirmation-Regel | **Blocker** |
| UI-Anforderung nicht durch Regeln gedeckt | Regeländerung vorschlagen → User-Freigabe → dann Umsetzung |
| Agent/Cursor trifft Designentscheidung allein | **Verboten** |

**Agenten dürfen fehlende Designentscheidungen nicht selbst lösen.**

Designregeln haben Vorrang vor schneller Umsetzung (vgl. `docs/adapters/cursor/poc-v1-spec.md`).

---

## D0-Phasen

| Phase | Inhalt | Status |
|-------|--------|--------|
| **D0a** | Markdown-Regeldateien (dieses Verzeichnis) | Abgeschlossen (`REVIEW_DONE`) |
| **D0b** | Markdown-Preview-Spezifikation (`preview/`) | Abgeschlossen |
| **D0.1** | User-Entscheidungen → Markdown | Abgeschlossen (siehe [decisions](global-control-design-decisions-d0.1.md)) |
| **D0c** | Token-JSON + statisches HTML Preview | **Execution done** — User `REVIEW_DONE` ausstehend |
| **P2** | UI / Renderer / CI | **Blockiert bis explizite User-Freigabe** |

**D0c Deliverables:** `tokens/control.tokens.json`, `preview/static/` (index.html, tokens.css, preview.css). Review Defaults — nicht CoreAI Brand.

Token-Präfix **`control.*`** final (D0.1). `tokens.css` spiegelt JSON manuell 1:1 (kein Generator in D0c).

---

## Bridge as first use case

| Kontext | Referenz (read-only, nicht normativ für Visuals) |
|---------|--------------------------------------------------|
| PoC-Spec | `docs/adapters/cursor/poc-v1-spec.md` |
| UI-Module-Proposal | `adapters/cursor/registry/p1-ui-modules.proposal.json` |
| Runtime Actions | `adapters/cursor/registry/poc-v1-actions.json` |
| View | `BridgeMobileView.cursor` — vertical-stack |

Modul-IDs nutzen Präfix `bridge.ui.*` als **erster** Consumer; Regeln selbst sind adapter-neutral formuliert.

**D0.1 (D1):** Bridge/P2 ist **Consumer** eines globalen Design-Standards — kein produkt-owned Design-Package als Endarchitektur.

---

## Legacy — non-normative

| Pfad | Rolle |
|------|-------|
| `web/` | Legacy-Mobile-PWA — **darf nicht** als Token-, Komponenten- oder Style-Quelle dienen |
| `overlay/bridge-overlay/` | Electron-Overlay — **darf nicht** als visuelle Wahrheit dienen |

D0 erzeugt **keine** Migration und **keine** Anpassung von `web/` oder `overlay/`.

---

## Was D0 nicht ist

- Keine Bridge-Control-Produkt-UI
- Kein Modular UI Renderer
- Kein P2-UI-Sprint
- Keine Änderung an P0/P0.1a/P1/P1.1-Dokumenten oder Runtime-Registry

---

## Review-Ablauf

### D0-Dokumentation (diese Korrekturrunde)

1. Alle Regeldateien lesen
2. [global-control-design-review-checklist.md](global-control-design-review-checklist.md) abarbeiten
3. [preview/global-control-design-preview-spec.md](preview/global-control-design-preview-spec.md) S01–S17 prüfen
4. [global-control-design-open-questions.md](global-control-design-open-questions.md) — jede Zeile mit `blocksD0cOrP2` prüfen
5. User-Freigabe → **`REVIEW_DONE` (nur D0-Dokumentation)**

### Was `REVIEW_DONE` für D0 bedeutet — und was nicht

| `REVIEW_DONE` (D0) | Ja | Nein |
|--------------------|----|------|
| D0a/D0b Markdown ist inhaltlich freigegeben | ✓ | |
| D0c (visuelle Preview) darf starten | | ✓ — separate Freigabe |
| P2-UI darf starten | | ✓ — separate Freigabe |
| Open Questions mit `blocksD0cOrP2: yes` dürfen `open` bleiben | | ✓ — müssen `resolved` oder begründet `deferred` sein |

**Nach D0.1:** Keine `blocksD0cOrP2: yes` + `open` mehr in Open Questions.

**D0c und P2 starten nicht automatisch** nach D0.1 — jeweils explizite User-Freigabe + separater Execution-Plan erforderlich.

| Freigabe | Voraussetzung |
|----------|----------------|
| **D0.1 done** | [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md) liegt vor |
| **D0c** | User: „D0c starten" + D0c-Plan (tokens/, preview/static/) |
| **P2** | User: „P2 starten" + P2-Plan (global consumer, CI, Renderer) |
| **D4 cursorweit** | User trägt Rule-Text aus decisions-Datei in Cursor User Rules ein |

---

## Terminologie

| Nicht verwenden (Ziel-Namespace) | Verwenden |
|----------------------------------|-----------|
| Produkt-/adapter-spezifische Designregeln als Global-Standard | **Global Control Design Rules**, **global control rules**, **global wiederverwendbar** |
| Bridge als alleiniger Regel-Owner | **Bridge as first use case** |
