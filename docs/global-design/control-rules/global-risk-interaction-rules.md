# Global Risk Interaction Rules

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Regelgruppe:** 4 — Global Risk Interaction Rules  
**Version:** 0.1.0-d0.1  
**Preview-Sektionen:** S07, S08, S09, S17

---

## 1. Scope

Visuelle und interaktive Regeln für Aktionen nach Risiko, Bestätigung, Permission, Allowlist, Blockierung und Irreversibilität.

---

## 2. Nicht-Ziele

- Keine Security-Gate-Implementierung (API bleibt autoritativ)
- Keine freie Texteingabe für Shell/Commands in UI

---

## 2a. Accessibility für Risk-UI (D0.1)

| Regel | Stufe |
|-------|-------|
| Gesamte UI: WCAG 2.1 AA minimum | MUST |
| destructive / external-code **Primary** Confirm-Buttons: AAA wo möglich | MUST |
| Kontrastprüfung gegen aktives Color-Preset | MUST |

Siehe [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md#c2--wcag).

---

## 3. Risk-Taxonomie (global)

| riskClass | Bedeutung | auditMark |
|-----------|-----------|-----------|
| `read` | Nicht destructive, kein externalCode | yes |
| `destructive` | Kann System/Workspace schädigen | yes |
| `external-code` | Externer Code (Extensions) — übersteuert destructive | yes |

Zusätzliche **Interaktions-Kategorien** (UI-Ebene):

| Kategorie | Beschreibung |
|-----------|--------------|
| read-only action | Kein mutierender Effekt |
| normal action | Mutation mit Standard-Flow |
| destructive action | `destructive: true` in Registry |
| external-code action | `externalCode: true` |
| terminal action | Whitelist-exact terminal |
| agent action | Subsystem, destructive möglich |
| restore action | Snapshot restore |
| permission denied | UI/API Gate |
| allowlist violation | Command/terminal nicht erlaubt |
| confirmation required | `needsConfirmation` oder overwrite |
| blocked action | Gate verweigert Ausführung |
| irreversible action | Kein rollbackAvailable |

---

## 4. Interaktions-Matrix

| Kategorie | Visuell (MUST/SHOULD) | Interaktion (MUST) | Confirm | Preview |
|-----------|----------------------|-------------------|---------|---------|
| read-only action | neutral, `control.color.textMuted` | Tap → read only | Nein | S07 |
| normal action | `control.color.accent` CTA | Standard flow | Nur wenn Registry | S07 |
| destructive action | `control.color.danger` border/icon, Label „Destructive“ | Confirm Dialog | Ja | S07, S08 |
| external-code action | `control.color.warn` Banner + danger CTA | Confirm + Explainer | Ja | S07, S08 |
| terminal action | danger emphasis, monospace command row | Whitelist picker only | Ja | S07, S08, S13 |
| agent action | Subsystem badge, separated section | Confirm, opt-in flags sichtbar | Ja | S07, S08, S14 |
| restore action | caution (warn), nicht ok-green | Confirm + snapshotId | Ja | S08, S12 |
| permission denied | blocked state module | Disable + explain | Nein | S09 |
| allowlist violation | error state | Kein Submit, Hinweis Allowlist | Nein | S09, S17 |
| confirmation required | inline hint + dialog | Block until `confirmed: true` | Ja | S08 |
| blocked action | disabled + reason code | No submit | Nein | S17 |
| irreversible action | disabled undo + copy | No undo button | Nein | S12, S17 |

**Fehlende Zeile in Matrix für geplante Action → Blocker.**

---

## 5. Confirmation Rules

| Regel | Stufe |
|-------|-------|
| Jede `needsConfirmation: true` Action nutzt Confirmation-Modul | MUST |
| `needsConfirmationOnOverwrite` (z. B. fs.write): Dialog nur bei overwrite | MUST |
| Dialog zeigt: actionId, riskClass, Kurzbeschreibung Wirkung | MUST |
| Destructive: primärer Confirm-Button = danger style; Cancel immer sichtbar | MUST |
| external-code: zusätzlicher Warn-Block oberhalb Buttons | MUST |
| Double-submit während Request | MUST NOT |
| Confirm auf Mobile: sheet/fullscreen narrow (Mobile Rules) | SHOULD |

| Token / Pattern | Verwendung |
|-----------------|------------|
| `control.pattern.confirm.destructive` | Danger primary |
| `control.pattern.confirm.externalCode` | Banner + confirm |
| `control.pattern.confirm.restore` | Caution + snapshot id |

**Preview:** S08

---

## 6. Permission & Allowlist

| Regel | Stufe |
|-------|-------|
| UI Permission Gate vor Render und vor Submit | MUST |
| `PERMISSION_DENIED` → blocked state, kein CTA der Action | MUST |
| `ALLOWLIST_VIOLATION` → error state, Liste erlaubter Einträge | MUST |
| `CONFIRMATION_REQUIRED` ohne confirmed → inline + dialog, kein API call | MUST |
| Terminal: nur exakte Whitelist-Einträge wählbar | MUST NOT free text |
| IDE Command: nur `poc-v1-commands` / adapter allowlist | MUST NOT free text |

**Preview:** S09

---

## 7. Restore / Rollback

| Regel | Stufe |
|-------|-------|
| Undo/Restore-Button nur wenn `rollbackAvailable: true` | MUST |
| Label „Restore“ wenn API restore; nicht „Undo“ wenn semantisch restore | MUST |
| `ROLLBACK_NOT_AVAILABLE` → kein Restore-CTA, Erklärung | MUST |
| Erfolg nach Action: `snapshotId` in Result ohne Restore-Versprechen | MUST |

**Preview:** S12

---

## 8. Audit-Sichtbarkeit (Risk)

| Regel | Stufe |
|-------|-------|
| `riskClass` in History-Eintrag sichtbar | MUST |
| Prompts, Secrets, Settings-Werte: gehasht oder redacted in UI | MUST |
| external-code Events: Badge in History | MUST |

**Preview:** S10

---

## 9. Bridge as first use case — Action Mapping

| actionId | riskClass (typ.) | UI-Kategorie | Confirm |
|----------|------------------|--------------|---------|
| `cursor.ide.status.get` | read | read-only | Nein |
| `cursor.ide.workspace.open` | read | normal + confirm | Ja |
| `cursor.ide.fs.mkdir` | read | normal | Nein |
| `cursor.ide.fs.write` | read | normal; overwrite → confirmation required | Bedingt |
| `cursor.ide.settings.get` | read | read-only | Nein |
| `cursor.ide.settings.set` | read | normal + confirm | Ja |
| `cursor.ide.extension.install` | external-code | external-code action | Ja |
| `cursor.ide.terminal.run` | destructive | terminal action | Ja |
| `cursor.ide.command.execute` | destructive | destructive + allowlist | Ja |
| `cursor.agent.prompt.send` | destructive | agent action | Ja |

| Modul | Risk-UI |
|-------|---------|
| `bridge.ui.confirmation.dialog` | alle confirm flows |
| `bridge.ui.permission.gate` | permission denied |
| `bridge.ui.error.state` | allowlist, blocked, gate codes |
| `bridge.ui.extension.install` | external-code banner |

---

## 10. Blocker

- Fehlende Risk-/Confirmation-Regel für Action → **Blocker**
- Fehlendes `requiredRiskExamples` in Preview S07/S08 → **Blocker**
- Agent erfindet Confirm-Copy oder Farben → **verboten**
