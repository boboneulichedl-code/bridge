# Global Control Design Rules — Review Checklist

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Status:** D0c — Static preview implementiert; User REVIEW_DONE ausstehend  
**Version:** 0.1.0-d0c  
**Datum:** 2026-05-27  

---

## D0.1 — Entscheidungs-Pass (abgeschlossen)

- [x] [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md) vorhanden
- [x] User-Entscheidungen A1–D5 dokumentiert (inkl. Custom-Architekturen)
- [x] Open Questions: keine `blocksD0cOrP2: yes` + `open`
- [x] 48×48 dp Touch MUST (MQ-001 resolved)
- [x] D0.1 ≠ D0c-Start ≠ P2-Start (Index + decisions)
- [ ] User: D4 Rule in **cursorweite** Cursor User Rules eingetragen (manuell, Text in decisions-Datei)

## Globale Prüfpunkte (alle Gruppen)

- [ ] Pflicht-Kopfzeile in jeder Regeldatei vorhanden
- [ ] Keine verbotenen Begriffe (nur: Global Control Design Rules, global wiederverwendbar, nicht produkt-/adapter-spezifisch)
- [ ] Harte Gates im Index verstanden und akzeptiert
- [ ] Keine Token-JSON/CSS/HTML in D0/D0.1-Deliverables
- [ ] `web/` und `overlay/` nicht als normative Quelle verwendet
- [x] Alle Open Questions haben Spalte `blocksD0cOrP2`
- [x] Keine Open Question mit `blocksD0cOrP2: yes` und Status `open`
- [x] 48×48 dp Touch-Minimum MUST (D0.1)
- [x] **D0.1-Freigabe ist nicht automatisch D0c-/P2-Freigabe**

### REVIEW_DONE — nur D0-Dokumentation

| Prüfung | Für D0 `REVIEW_DONE` | Für D0c-Start | Für P2-Start |
|---------|----------------------|---------------|--------------|
| Regeldateien + Preview-Spec inhaltlich OK | ✓ | ✓ | ✓ |
| Checklist global abgehakt | ✓ | ✓ | ✓ |
| `blocksD0cOrP2: yes` alle resolved oder deferred | optional | ✓ Pflicht | ✓ Pflicht |
| Explizite User-Freigabe D0c / P2 | — | ✓ Pflicht | ✓ Pflicht |

---

## Prüfmatrix pro Regelgruppe

Für jede Zeile: alle Spalten müssen erfüllt sein, sonst **Blocker**.

| Regelgruppe | Rule exists | Preview section | States covered | Risk covered | Mobile covered | No product UI | No legacy normative | Open questions |
|-------------|-------------|-----------------|----------------|--------------|----------------|---------------|---------------------|----------------|
| **Index** | [global-control-design-index.md](global-control-design-index.md) | — | — | — | — | [x] | [x] | [x] |
| **D0.1 Decisions** | [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md) | — | — | — | — | [x] | [x] | [x] |
| **Base** | [global-base-design-rules.md](global-base-design-rules.md) | S01–S04, S16 | [ ] | n/a | S16 | [ ] | [ ] | [ ] |
| **Control** | [global-control-design-rules.md](global-control-design-rules.md) | S05, S08–S14 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **Mobile** | [global-mobile-control-rules.md](global-mobile-control-rules.md) | S15, S16 | [ ] | n/a | [ ] | [ ] | [ ] | [ ] |
| **Risk** | [global-risk-interaction-rules.md](global-risk-interaction-rules.md) | S07, S08, S09, S17 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **Module composition** | [global-module-composition-rules.md](global-module-composition-rules.md) | S11, S14 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **State display** | [global-state-display-rules.md](global-state-display-rules.md) | S05, S06, S12, S17 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **Preview (meta)** | [global-preview-rules.md](global-preview-rules.md) | alle S01–S17 | [ ] | [ ] | S15 | [ ] | [ ] | [ ] |
| **Preview-Spec (D0b)** | [preview/global-control-design-preview-spec.md](preview/global-control-design-preview-spec.md) | self | [ ] | [ ] | S15 | [ ] | [ ] | [ ] |

---

## Detail-Checkliste: Base Design Rules

- [ ] Token-Naming-Schema `control.*` dokumentiert
- [ ] Semantische Farbrollen definiert (Werte offen oder in Open Questions)
- [ ] Typografie-Skala definiert
- [ ] Spacing-Grid definiert
- [ ] Darkmode-first als MUST
- [ ] Kontrast-Anforderung dokumentiert
- [ ] Preview S01–S04 verlinkt mit `blockedIfMissing: yes`

---

## Detail-Checkliste: Control Design Rules

- [ ] Keine monolithische Control-Page (MUST NOT)
- [ ] Allowlist/Whitelist-Picker für Command und Terminal
- [ ] Agent als Subsystem visuell getrennt
- [ ] Restore nur bei `rollbackAvailable: true`
- [ ] Confirmation an `bridge.ui.confirmation.dialog` gebunden
- [ ] Audit: riskClass sichtbar, keine sensiblen Klartexte
- [ ] Preview S05, S08–S14 vollständig

---

## Detail-Checkliste: Mobile Control Rules

- [ ] Touch-Minimum 48×48 dp als MUST (D0-Default; MQ-001 resolved)
- [ ] Checkbox/Radio hit area 48×48 als MUST
- [ ] Safe areas (`env(safe-area-inset-*)`) als MUST
- [ ] Viewport-Priorität: Galaxy S25 Ultra zuerst
- [ ] Bottom action zone definiert
- [ ] Preview S15 Frame-Spec lesbar

---

## Detail-Checkliste: Risk Interaction Rules

- [ ] Alle riskClass-Werte abgedeckt: read, destructive, external-code
- [ ] Gate-Outcomes: permission denied, allowlist violation, confirmation required, blocked
- [ ] external-code Banner-Regel
- [ ] irreversible / rollback not available
- [ ] Preview S07, S08 mit `requiredRiskExamples`

---

## Detail-Checkliste: Module Composition Rules

- [ ] vertical-stack only für `BridgeMobileView.*`
- [ ] `moduleOrder` aus Proposal referenziert (Bridge first use case)
- [ ] crossCuttingModules als Overlay, nicht im Stack
- [ ] Agent-Section mit Subsystem-Badge
- [ ] Preview S11 Stack-Beispiel

---

## Detail-Checkliste: State Display Rules

- [ ] Alle 17 State-IDs definiert
- [ ] Jeder State: visuell + Copy + Token-Referenz
- [ ] Modul-Overrides erlaubt, aber globaler Default Pflicht
- [ ] Preview S06 listet alle States in `requiredStates`

---

## Detail-Checkliste: Preview Rules (meta)

- [ ] Jede Regelgruppe hat mindestens eine Preview-Sektion
- [ ] Preview ist nicht Produkt-UI (MUST NOT)
- [ ] Kein UI-Sprint ohne abgehakte Preview-Checkliste
- [x] D0c static preview unter `preview/static/` vorhanden
- [ ] D0c User `REVIEW_DONE` (visuell gegen Spec)

---

## D0c — Static Preview (S01–S17)

Öffnen: [preview/static/index.html](preview/static/index.html) (Doppelklick oder lokaler HTTP-Server).

| Sektion | Geprüft |
|---------|---------|
| S01 Color/Token | [ ] |
| S02 Typography | [ ] |
| S03 Spacing | [ ] |
| S04 Radius/Surface | [ ] |
| S05 Button/Action States | [ ] |
| S06 Status States (17) | [ ] |
| S07 Risk Actions | [ ] |
| S08 Confirmation Flows | [ ] |
| S09 Permission Gate | [ ] |
| S10 Audit History | [ ] |
| S11 Module Stack | [ ] |
| S12 Restore/Rollback | [ ] |
| S13 Terminal | [ ] |
| S14 Agent Subsystem | [ ] |
| S15 Mobile Frame (nur S15 framed) | [ ] |
| S16 Darkmode-first | [ ] |
| S17 Error/Blocked/Offline | [ ] |

Zusätzlich:

- [ ] Sticky Banner „NOT PRODUCT UI — Global Control Design Review Only“
- [ ] `tokens/control.tokens.json` und `tokens.css` 1:1 (JSON wins)
- [ ] `preview.css` nur `var(--control-*)` (keine freien Hex)
- [ ] Hex = Review Defaults (nicht CoreAI Brand)
- [ ] Kein Link/Integration in `web/`

---

## Detail-Checkliste: Preview-Spec (D0b)

Für **jede** Sektion S01–S17:

- [ ] `previewSectionId` gesetzt
- [ ] `linkedRuleFiles` nicht leer
- [ ] `purpose`, `mustShow`, `requiredStates` ausgefüllt
- [ ] `requiredRiskExamples` oder `n/a` begründet
- [ ] `mobileRequirement` ja/nein korrekt
- [ ] `reviewChecklistItems` abhakbar
- [ ] `blockedIfMissing: yes`

---

## Freigabe

| Phase | Rolle | Datum | Ergebnis |
|-------|-------|-------|----------|
| D0 | User | 2026-05-27 | REVIEW_DONE (inhaltlich) |
| D0.1 | User | 2026-05-27 | Entscheidungen completed |
| D0c | User | | Execution done — REVIEW_DONE ausstehend |
| P2 | User | | Wartet — explizite Freigabe |

**Bei Korrektur:** Regeldatei ändern → decisions/Open Questions → Preview-Spec → Checklist.

**D0.1 done** berechtigt **nicht** zu D0c-HTML oder P2-Code.

**Vor D0c:** User-Freigabe + D0c-Plan + `tokens/` + `preview/static/`.

**Vor P2:** User-Freigabe + P2-Plan + CI/Lint (D3/D5) + global consumer package.
