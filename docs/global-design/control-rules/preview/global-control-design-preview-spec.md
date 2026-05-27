# Global Control Design — Preview Specification (D0b)

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Status:** D0b — Markdown only (D0.1 Entscheidungen: [../global-control-design-decisions-d0.1.md](../global-control-design-decisions-d0.1.md))  
**Version:** 0.1.0-d0.1  
**Datum:** 2026-05-27  

**Hinweis:** Diese Spec beschreibt, was eine spätere Preview (D0c) **zeigen muss**. Sie ist **Not Product UI**. Kein HTML/CSS/React in D0.

---

## Spec-Header (für D0c)

| Feld | Wert |
|------|------|
| bannerText | `NOT PRODUCT UI — Global Control Design Review Only` |
| defaultTheme | dark |
| referenceDevice | Samsung Galaxy S25 Ultra (logical frame) |

---

## S01 — Color / Token

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S01 |
| **linkedRuleFiles** | `../global-base-design-rules.md` |
| **purpose** | Beweisen, dass semantische Farbrollen und Token-IDs vollständig und unterscheidbar definiert sind. |
| **mustShow** | Swatches oder Beschriftete Kästen für: bg, surface, surfaceElevated, text, textMuted, accent, ok, warn, danger, border, focus. Token-ID unter jedem Sample. |
| **requiredStates** | n/a (token baseline) |
| **requiredRiskExamples** | n/a — danger/warn als Rollen, nicht als Action |
| **mobileRequirement** | ja — Swatches in schmaler Column (max ~480px) |
| **reviewChecklistItems** | [ ] Alle `control.color.*` Rollen aus Base Rules sichtbar [ ] danger ≠ warn [ ] Keine Hex-Werte aus web/ übernommen ohne Freigabe [ ] Dark background default |
| **blockedIfMissing** | yes |

---

## S02 — Typography

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S02 |
| **linkedRuleFiles** | `../global-base-design-rules.md` |
| **purpose** | Typografie-Skala und Hierarchie prüfbar machen. |
| **mustShow** | Beispiele für caption, body, label, title, headline, mono (sample actionId hash). |
| **requiredStates** | n/a |
| **requiredRiskExamples** | n/a |
| **mobileRequirement** | ja — keine Überlappung bei 360px width |
| **reviewChecklistItems** | [ ] Max 3 weights sichtbar [ ] Mono nur für code/hash [ ] title vs headline unterscheidbar |
| **blockedIfMissing** | yes |

---

## S03 — Spacing

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S03 |
| **linkedRuleFiles** | `../global-base-design-rules.md` |
| **purpose** | 8px-Grid und Modul-Abstände verifizieren. |
| **mustShow** | Visual spacing scale xs–xl; Beispiel zwei Module mit lg gap; inner md padding. |
| **requiredStates** | n/a |
| **requiredRiskExamples** | n/a |
| **mobileRequirement** | ja |
| **reviewChecklistItems** | [ ] xs–xl beschriftet [ ] Module gap ≥ lg [ ] Touch targets nicht durch spacing verkleinert |
| **blockedIfMissing** | yes |

---

## S04 — Radius / Surface

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S04 |
| **linkedRuleFiles** | `../global-base-design-rules.md` |
| **purpose** | Surface-Hierarchie und Elevation prüfen. |
| **mustShow** | Card (radius.lg, shadow.raised), Dialog mock (radius.xl, shadow.overlay), flat surface, border subtle vs strong. |
| **requiredStates** | n/a |
| **requiredRiskExamples** | n/a |
| **mobileRequirement** | ja |
| **reviewChecklistItems** | [ ] Card vs Dialog unterscheidbar [ ] Destructive dialog uses xl radius per rules |
| **blockedIfMissing** | yes |

---

## S05 — Button / Action States

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S05 |
| **linkedRuleFiles** | `../global-control-design-rules.md`, `../global-state-display-rules.md` |
| **purpose** | Interaktive Controls in allen relevanten Zuständen. |
| **mustShow** | Primary, secondary, danger buttons; states: default, pressed (described), disabled, loading on button; action row min touch height. |
| **requiredStates** | disabled, loading, success (on button row context) |
| **requiredRiskExamples** | destructive primary vs accent primary side by side |
| **mobileRequirement** | ja — 48dp min height labeled |
| **reviewChecklistItems** | [ ] danger CTA not used for normal [ ] disabled visible [ ] loading does not shrink target [ ] 48×48 dp MUST documented |
| **blockedIfMissing** | yes |

---

## S06 — Status States (Galerie)

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S06 |
| **linkedRuleFiles** | `../global-state-display-rules.md` |
| **purpose** | Vollständige State-Galerie — alle stateIds einmal sichtbar. |
| **mustShow** | Panels für: loading, empty, success, warning, error, blocked, disabled, offline, unreachable, running, failed, partial success, confirmation required, permission denied, external-code warning, restore available, restore unavailable. |
| **requiredStates** | loading, empty, success, warning, error, blocked, disabled, offline, unreachable, running, failed, partial success, confirmation required, permission denied, external-code warning, restore available, restore unavailable |
| **requiredRiskExamples** | permission denied, external-code warning als State panels |
| **mobileRequirement** | ja — scroll list of panels |
| **reviewChecklistItems** | [ ] All 17 stateIds present [ ] Each has icon+text+color role [ ] No state only color-coded |
| **blockedIfMissing** | yes |

---

## S07 — Risk Actions

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S07 |
| **linkedRuleFiles** | `../global-risk-interaction-rules.md` |
| **purpose** | riskClass und UI-Kategorien unterscheidbar. |
| **mustShow** | Three columns or rows: read (status.get style), destructive (terminal.run style), external-code (extension.install style). Labels with riskClass badge. |
| **requiredStates** | warning, error |
| **requiredRiskExamples** | read-only action, destructive action, external-code action |
| **mobileRequirement** | ja |
| **reviewChecklistItems** | [ ] read/destructive/external-code distinct [ ] Badges on module headers shown |
| **blockedIfMissing** | yes |

---

## S08 — Confirmation Flows

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S08 |
| **linkedRuleFiles** | `../global-risk-interaction-rules.md`, `../global-control-design-rules.md` |
| **purpose** | Confirm-Dialoge für repräsentative Actions. |
| **mustShow** | Mock dialogs: (1) workspace.open medium, (2) extension.install with external-code banner, (3) terminal.run destructive. Cancel + Confirm placement. |
| **requiredStates** | confirmation required |
| **requiredRiskExamples** | normal+confirm, external-code action, destructive action, restore action (snapshotId line) |
| **mobileRequirement** | ja — sheet/fullscreen narrow described |
| **reviewChecklistItems** | [ ] external-code has banner [ ] Cancel always visible [ ] No double-submit note [ ] Restore uses caution not success green |
| **blockedIfMissing** | yes |

---

## S09 — Permission Gate

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S09 |
| **linkedRuleFiles** | `../global-control-design-rules.md`, `../global-risk-interaction-rules.md` |
| **purpose** | Permission denied vs. allowed module render. |
| **mustShow** | Wrapper: child module visible with permission; same module with permission denied (blocked state); allowlist violation error with list hint. |
| **requiredStates** | permission denied, blocked, disabled |
| **requiredRiskExamples** | permission denied, allowlist violation |
| **mobileRequirement** | ja |
| **reviewChecklistItems** | [ ] No submit on denied [ ] Allowlist shows allowed entries concept [ ] Gate before render explained |
| **blockedIfMissing** | yes |

---

## S10 — Audit History

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S10 |
| **linkedRuleFiles** | `../global-control-design-rules.md`, `../global-risk-interaction-rules.md` |
| **purpose** | History list mit risk badges und redaction. |
| **mustShow** | Table/list: time, actionId, riskClass badge, outcome; one row destructive, one external-code, one read; hashed value placeholder `[redacted]`. |
| **requiredStates** | loading, empty |
| **requiredRiskExamples** | audit entries for destructive and external-code |
| **mobileRequirement** | ja — vertical list not wide table |
| **reviewChecklistItems** | [ ] riskClass visible per row [ ] No plaintext secrets [ ] Newest first noted |
| **blockedIfMissing** | yes |

---

## S11 — Module Stack

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S11 |
| **linkedRuleFiles** | `../global-module-composition-rules.md` |
| **purpose** | BridgeMobileView.cursor vertical stack und cross-cutting separation. |
| **mustShow** | ASCII or labeled stack: permission gate → status → … → version; overlay box for confirmation/result/error outside stack. Forbidden: monolithic page label crossed out. |
| **requiredStates** | n/a (structural) |
| **requiredRiskExamples** | risk modules grouped (extension, terminal, command) |
| **mobileRequirement** | ja — full stack scroll |
| **reviewChecklistItems** | [ ] Order matches moduleOrder [ ] crossCutting not in stack [ ] monolithic forbidden shown [ ] Agent before audit |
| **blockedIfMissing** | yes |

---

## S12 — Restore / Rollback

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S12 |
| **linkedRuleFiles** | `../global-control-design-rules.md`, `../global-state-display-rules.md`, `../global-risk-interaction-rules.md` |
| **purpose** | Restore available vs unavailable UI. |
| **mustShow** | Action result with snapshotId; Restore CTA enabled (rollbackAvailable true); same without CTA (false) + explanation; ROLLBACK_NOT_AVAILABLE message. |
| **requiredStates** | restore available, restore unavailable, success |
| **requiredRiskExamples** | restore action, irreversible action (no undo) |
| **mobileRequirement** | ja |
| **reviewChecklistItems** | [ ] No restore button when unavailable [ ] Caution styling for restore [ ] snapshotId shown |
| **blockedIfMissing** | yes |

---

## S13 — Terminal Action

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S13 |
| **linkedRuleFiles** | `../global-control-design-rules.md`, `../global-risk-interaction-rules.md` |
| **purpose** | Whitelist-only terminal picker. |
| **mustShow** | List: npm run build, git status, etc. (6 whitelist entries); no free text field; destructive label; confirm on submit described. |
| **requiredStates** | confirmation required, running, failed |
| **requiredRiskExamples** | terminal action |
| **mobileRequirement** | ja — large touch rows |
| **reviewChecklistItems** | [ ] Exactly whitelist entries [ ] No shell free text [ ] destructive emphasis |
| **blockedIfMissing** | yes |

---

## S14 — Agent Subsystem

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S14 |
| **linkedRuleFiles** | `../global-control-design-rules.md`, `../global-module-composition-rules.md` |
| **purpose** | Agent visuell getrennt vom IDE-Hauptflow. |
| **mustShow** | Section with „Subsystem“ badge; prompt area; allowFileChanges toggle visible; not in bottom primary bar; accordion optional state described. |
| **requiredStates** | confirmation required, running |
| **requiredRiskExamples** | agent action |
| **mobileRequirement** | ja |
| **reviewChecklistItems** | [ ] Subsystem badge present [ ] Not hero CTA [ ] Audit shows redacted prompt |
| **blockedIfMissing** | yes |

---

## S15 — Mobile Frame (Galaxy S25 Ultra)

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S15 |
| **linkedRuleFiles** | `../global-mobile-control-rules.md` |
| **purpose** | Referenz-Viewport und Safe Areas für Review. |
| **mustShow** | Device frame for `device-profile-default-a`: 412×915 logical px; safe top 24px; safe bottom 34px; bottom action zone 72px + safe; sticky status; scroll middle; note: user profiles CRUD in future interactive preview. |
| **requiredStates** | n/a |
| **requiredRiskExamples** | n/a |
| **mobileRequirement** | yes — `deviceProfileId` defines frame |
| **reviewChecklistItems** | [ ] Default profile locked [ ] 412×915 and safe areas [ ] Bottom zone documented [ ] User-profile CRUD noted as roadmap |
| **blockedIfMissing** | yes |

---

## S16 — Darkmode-first

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S16 |
| **linkedRuleFiles** | `../global-base-design-rules.md`, `../global-mobile-control-rules.md` |
| **purpose** | Default dark theme across samples. |
| **mustShow** | Full-page dark bg + surface cards; note light theme deferred; contrast AA note on text pairings. |
| **requiredStates** | n/a |
| **requiredRiskExamples** | n/a |
| **mobileRequirement** | ja |
| **reviewChecklistItems** | [ ] Default is dark [ ] No pure #000 large flats [ ] textMuted readable |
| **blockedIfMissing** | yes |

---

## S17 — Error / Blocked / Offline

| Feld | Inhalt |
|------|--------|
| **previewSectionId** | S17 |
| **linkedRuleFiles** | `../global-state-display-rules.md`, `../global-risk-interaction-rules.md` |
| **purpose** | Gate and connectivity failures. |
| **mustShow** | Panels: CONFIRMATION_REQUIRED inline; ALLOWLIST_VIOLATION; PERMISSION_DENIED; offline; unreachable (extension); blocked action disabled. |
| **requiredStates** | error, blocked, offline, unreachable, disabled |
| **requiredRiskExamples** | blocked action, allowlist violation, permission denied |
| **mobileRequirement** | ja |
| **reviewChecklistItems** | [ ] errorCode shown where applicable [ ] offline vs unreachable distinct [ ] retry only when meaningful |
| **blockedIfMissing** | yes |

---

## Sektions-Index

| ID | Titel | blockedIfMissing |
|----|-------|------------------|
| S01 | Color/Token | yes |
| S02 | Typography | yes |
| S03 | Spacing | yes |
| S04 | Radius/Surface | yes |
| S05 | Button/Action States | yes |
| S06 | Status States | yes |
| S07 | Risk Actions | yes |
| S08 | Confirmation Flows | yes |
| S09 | Permission Gate | yes |
| S10 | Audit History | yes |
| S11 | Module Stack | yes |
| S12 | Restore/Rollback | yes |
| S13 | Terminal | yes |
| S14 | Agent Subsystem | yes |
| S15 | Mobile Frame | yes |
| S16 | Darkmode-first | yes |
| S17 | Error/Blocked/Offline | yes |

---

## Review-Abschluss (D0b)

1. Alle S01–S17 Felder ausgefüllt  
2. [global-control-design-review-checklist.md](../global-control-design-review-checklist.md) abhaken  
3. User `REVIEW_DONE`  
4. Erst dann: D0c oder P2-UI  

**D0b liefert keine implementierte Preview — nur diese Spec.**

---

## D0c — Static implementation

| Artefakt | Pfad |
|----------|------|
| Review gallery | [../preview/static/index.html](../preview/static/index.html) |
| Tokens (source of truth) | [../tokens/control.tokens.json](../tokens/control.tokens.json) |
| CSS mirror | [../preview/static/tokens.css](../preview/static/tokens.css) |

Hex values in the default preset are **review defaults** (not CoreAI brand). User `REVIEW_DONE` for D0c is separate from P2.
