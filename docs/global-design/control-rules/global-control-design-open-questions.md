# Global Control Design Rules — Open Questions

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Status:** D0.1 — Blocker-Fragen resolved (siehe [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md))  
**Version:** 0.1.0-d0.1  
**Datum:** 2026-05-27  

Jede Frage: Status `open` | `resolved` | `deferred`

### Spalte `blocksD0cOrP2`

| Wert | Bedeutung |
|------|-----------|
| **yes** | D0c/P2 durften nicht starten, solange Status `open` war |
| **no** | Blockiert D0c/P2 nicht |

**Nach D0.1:** Keine Einträge mehr mit `blocksD0cOrP2: yes` und Status `open`.

**Gate:** [global-control-design-index.md](global-control-design-index.md) — D0.1 ≠ D0c/P2-Start.

---

## 1. Location / ownership

| ID | Frage | Status | blocksD0cOrP2 | Entscheidung (D0.1) |
|----|-------|--------|---------------|---------------------|
| LQ-001 | Bleiben globale Regeln unter `docs/global-design/control-rules/` im Bridge-Repo? | open | no | Unverändert offen; erste Ablage OK |
| LQ-002 | Wann Extraktion CoreAI-Global-Repo? | deferred | no | — |
| LQ-003 | Pointer in `docs/adapters/cursor/`? | deferred | no | — |
| LQ-004 | Package `packages/design` vs. reine Docs? | **resolved** | yes | D1: Global Consumer; kein produkt-owned Package — [decisions D1](global-control-design-decisions-d0.1.md#d1--global-first-consumer-model-custom) |

---

## 2. Tokens / machine readability

| ID | Frage | Status | blocksD0cOrP2 | Entscheidung (D0.1) |
|----|-------|--------|---------------|---------------------|
| TQ-001 | Wann `control.tokens.json` / CSS? | **resolved** | yes | B1: Vor D0c unter `tokens/` — Datei in **D0c-Execution** |
| TQ-002 | Dual-Format Markdown + JSON/YAML? | **resolved** | yes | D2: Ja — [decisions D2](global-control-design-decisions-d0.1.md#d2--dual-format) |
| TQ-003 | Token-Präfix `control.*` final? | **resolved** | yes | B2: `control.*` — [decisions B2](global-control-design-decisions-d0.1.md#b2--token-präfix) |
| TQ-004 | CI-Check leere `requiredDesignTokens`? | **resolved** | yes | D3: CI fail — Implementierung P2 |

---

## 3. Visual aesthetic

| ID | Frage | Status | blocksD0cOrP2 | Entscheidung (D0.1) |
|----|-------|--------|---------------|---------------------|
| VQ-001 | Blue-gray vs. Brand? | **resolved** | yes | B3: Preset-Architektur; Default `neutral-blue-gray` |
| VQ-002 | Konkrete Hex/RGB? | **resolved** | yes | B4: Im Default-Preset (D0c Token-Datei) |
| VQ-003 | Icon-Set? | open | no | P2 |
| VQ-004 | Elevation-Stufen? | **resolved** | yes | B5: `elevation-profile-a` Default |

---

## 4. Mobile / accessibility

| ID | Frage | Status | blocksD0cOrP2 | Entscheidung (D0.1) |
|----|-------|--------|---------------|---------------------|
| MQ-001 | Touch-Target 44/48/56 dp? | **resolved** | no | 48×48 dp MUST (D0-Korrektur) |
| MQ-002 | Galaxy S25 Ultra Viewport? | **resolved** | yes | C1: `device-profile-default-a` locked |
| MQ-003 | WCAG AA vs. AAA? | **resolved** | yes | C2: AA global; AAA Risk-Primary |
| MQ-004 | Light-Theme v1? | deferred | no | post-P2 |

---

## 5. Motion

| ID | Frage | Status | blocksD0cOrP2 | Entscheidung (D0.1) |
|----|-------|--------|---------------|---------------------|
| MO-001 | Dialog Dauer/Easing? | **resolved** | yes | C3: 200/150ms + Effect-Profile-Architektur |
| MO-002 | prefers-reduced-motion? | **resolved** | yes | C4: Alle Animationen aus |
| MO-003 | Spinner vs. Skeleton? | open | no | P2 |

---

## 6. Preview implementation (D0c)

| ID | Frage | Status | blocksD0cOrP2 | Entscheidung (D0.1) |
|----|-------|--------|---------------|---------------------|
| PQ-001 | Statisches HTML `preview/static/`? | **resolved** | yes | A1: Ja — D0c-Execution |
| PQ-002 | Vite/React Preview-Package? | **resolved** | yes | A1: **Nein** (nicht gewählt) |
| PQ-003 | Route in `web/`? | **resolved** | no | Nein |
| PQ-004 | Banner Text/Platzierung? | **resolved** | yes | A2: Sticky Top-Banner |

---

## 7. Governance / versioning

| ID | Frage | Status | blocksD0cOrP2 |
|----|-------|--------|---------------|
| GQ-001 | Wer darf Regeln ändern? | open | no |
| GQ-002 | Semver Bundle? | open | no |
| GQ-003 | Gruppen- vs. Bundle-Freigabe? | open | no |
| GQ-004 | Changelog pro Gruppe? | deferred | no |

---

## 8. Agent enforcement

| ID | Frage | Status | blocksD0cOrP2 | Entscheidung (D0.1) |
|----|-------|--------|---------------|---------------------|
| AQ-001 | AGENTS.md Verweis? | deferred | no | Optional post-D0c |
| AQ-002 | Agent Stop-Regel? | **resolved** | yes | D4: Hart + **cursorweite** User Rules |
| AQ-003 | Lint Token-Allowlist? | **resolved** | yes | D5: Ja ab P2 — Implementierung P2 |
| AQ-004 | Registry `designrulesStatus`? | deferred | no | post-D0c |

---

## Blocker-Übersicht (D0c / P2) — nach D0.1

**Keine offenen Blocker** (`blocksD0cOrP2: yes` + `open`).

| Status | Anzahl |
|--------|--------|
| resolved (D0.1) | 17 (+ MQ-001, PQ-003 bereits früher) |
| open (non-blocker) | LQ-001, VQ-003, MO-003, GQ-001–003 |
| deferred | LQ-002, LQ-003, MQ-004, GQ-004, AQ-001, AQ-004 |

**D0c/P2-Start:** Erfordert explizite User-Freigabe — siehe [decisions — Gates](global-control-design-decisions-d0.1.md#gates-nach-d01).

---

## Implementierung deferred (nicht Open Question `open`)

| Thema | Phase | Status |
|-------|-------|--------|
| Token-JSON/CSS-Dateien | D0c-Execution | **done** — `tokens/control.tokens.json`, `preview/static/tokens.css` |
| Preview HTML/CSS | D0c-Execution | **done** — `preview/static/index.html`, `preview.css` |
| CI/Lint-Skripte | P2-Execution | pending |
| Cursor User Rule eintragen | User manuell (Text in decisions-Datei) | pending |
| Interaktive Preview-UI | post-D0c Roadmap | pending |

---

## Entscheidungslog

| Datum | ID | Entscheidung | Entschieden von |
|-------|-----|--------------|-----------------|
| 2026-05-27 | MQ-001 | 48×48 dp MUST | D0-Korrektur |
| 2026-05-27 | PQ-001, PQ-002, PQ-004 | A1=A static HTML; PQ-002 Nein; A2=A banner | User D0.1 |
| 2026-05-27 | TQ-001, TQ-003, VQ-001, VQ-002, VQ-004 | B1, B2, B3-custom, B4, B5-custom | User D0.1 |
| 2026-05-27 | MQ-002, MQ-003, MO-001, MO-002 | C1-custom, C2, C3-custom, C4 | User D0.1 |
| 2026-05-27 | LQ-004, TQ-002, TQ-004, AQ-002, AQ-003 | D1-custom, D2, D3, D4-custom, D5 | User D0.1 |
