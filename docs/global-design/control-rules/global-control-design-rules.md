# Global Control Design Rules

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Regelgruppe:** 2 — Global Control Design Rules  
**Version:** 0.1.0-d0.1  
**Preview-Sektionen:** S05, S08, S09, S10, S12, S13, S14

---

## 1. Scope

Action-Module, Capability-Cards, Statusbereiche, Command-Ausführung, Terminal, Agent, Restore/Rollback, Audit/History, Permission-Gates, Confirmation-Flows.

---

## 2. Nicht-Ziele

- Keine fest verdrahtete Produktseiten
- Keine freie Command-/Terminal-Eingabe
- Keine Agent-UI als Hauptnavigation
- Kein produkt-owned Design-Package als globaler Standard (D0.1 D1)

---

## 2a. Global Consumer (D0.1)

Siehe [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md#d1--global-first-consumer-model-custom).

| Regel | Stufe |
|-------|-------|
| Diese Regeln sind global; Bridge ist Consumer | MUST |
| P2 importiert globales Design-Artefakt — kein Owner-Package im Produkt-Namespace | MUST |

---

## 3. Action-Module (allgemein)

| Regel | Stufe |
|-------|-------|
| Ein Modul bedient definierte `supportedActions` aus Registry | MUST |
| Modul-Header: Titel + optional risk badge + collapse | SHOULD |
| Modul-Body: Inputs + primary CTA + secondary actions | SHOULD |
| Modul ohne erfüllte `requiredPermissions` → nicht rendern (Gate) | MUST |
| Modul ohne dokumentierte Design-Tokens → nicht rendern | MUST |
| Kein Hardcode von Action-Buttons außerhalb Registry-Modell | MUST NOT |

| Pattern-ID | Beschreibung |
|------------|--------------|
| `control.module.action` | Standard Action Module |
| `control.module.readonly` | Read-only summary card |

---

## 4. Capability-Cards

| Regel | Stufe |
|-------|-------|
| Kompakte Summary: 1–3 Zeilen Status + 1 primary CTA | SHOULD |
| Card nutzt `control.color.surface`, `control.radius.lg` | MUST |
| Header und Footer konsistent über Module | SHOULD |
| Keine mehr als 2 primary CTAs pro Card | MUST NOT |

---

## 5. Statusbereiche

| Regel | Stufe |
|-------|-------|
| Live-Status kompakt, scanbar | MUST |
| Sticky nur für primäres Status-Modul (siehe Mobile Rules) | MUST |
| Connection/adapter health sichtbar wenn unreachable | MUST |
| Kein Volldump von IDE-State in Mobile Card | MUST NOT |

**Bridge:** `bridge.ui.cursor.status` — StatusCard Pattern.

---

## 6. Command-Ausführung (IDE)

| Regel | Stufe |
|-------|-------|
| UI zeigt nur Allowlist-Einträge (Picker/List) | MUST |
| Kein Freitext-Feld für `commandId` | MUST NOT |
| Ausgewählter Command: monospace preview | SHOULD |
| destructive styling vor Confirm | MUST |
| `confirmed: true` erst nach Dialog | MUST |

**Bridge:** `bridge.ui.ide.command` → `cursor.ide.command.execute`, `poc-v1-commands.json`.

**Preview:** S13 (shared patterns), S08

---

## 7. Terminal-Aktionen

| Regel | Stufe |
|-------|-------|
| Whitelist exact-match only | MUST |
| Jeder Eintrag als große Touch-Zeile | SHOULD |
| Command in Audit UI gehasht, nicht vollständig im Klartext | MUST |
| Label „Terminal — destructive“ | SHOULD |

**Bridge:** `bridge.ui.terminal.command` → `cursor.ide.terminal.run`.

**Preview:** S13

---

## 8. Agent-Aktionen

| Regel | Stufe |
|-------|-------|
| Agent als Subsystem-Section (Composition Rules) | MUST |
| Prompt-Eingabe: multiline, kein Klartext in Audit-Anzeige | MUST |
| `allowFileChanges` o. ä. Flags sichtbar vor Submit | SHOULD |
| Nicht in Bottom-Primary-CTA Zone | MUST NOT |

**Bridge:** `bridge.ui.agent.prompt` → `cursor.agent.prompt.send`.

**Preview:** S14

---

## 9. Restore / Rollback

| Regel | Stufe |
|-------|-------|
| Restore-CTA nur bei `rollbackAvailable: true` | MUST |
| snapshotId in Result anzeigen, getrennt von Restore-CTA | MUST |
| Restore-Flow: caution + Confirm (Risk Rules) | MUST |
| Kein grüner Success-Stil für Restore-Aktion | MUST NOT |

**Bridge:** settings.set, fs.write (P0.1a restore); workspace wenn API verfügbar.

**Preview:** S12

---

## 10. Audit / History

| Regel | Stufe |
|-------|-------|
| Liste chronologisch, neueste oben | SHOULD |
| Spalten/Badges: time, actionId, riskClass, outcome | MUST |
| Sensitive Werte redacted | MUST |
| Tap: Detail-Panel ohne Klartext-Secrets | MUST |

**Bridge:** `bridge.ui.audit.history`

**Preview:** S10

---

## 11. Permission Gates

| Regel | Stufe |
|-------|-------|
| Gate prüft `requiredPermissions` vor Render | MUST |
| Gate prüft erneut vor `action:requested` | MUST |
| Fehlende Permission: Modul hidden oder `permission denied` state | MUST |
| Kein „Submit anyway“ | MUST NOT |

**Bridge:** `bridge.ui.permission.gate` — konsumiert `poc-v1-permissions.json`.

**Preview:** S09

---

## 12. Confirmation-Flows

| Regel | Stufe |
|-------|-------|
| Bindung an `bridge.ui.confirmation.dialog` (oder globales Äquivalent) | MUST |
| Dialog-Inhalt: action label, risk, consequences bullet list | MUST |
| Cancel immer erreichbar, nicht danger-styled | MUST |
| Confirm disabled bis Pflichtfelder gesetzt | SHOULD |

Siehe [global-risk-interaction-rules.md](global-risk-interaction-rules.md).

**Preview:** S08

---

## 13. Action Result & Feedback

| Regel | Stufe |
|-------|-------|
| Ergebnis über `bridge.ui.action.result` oder Äquivalent | SHOULD |
| success / warning / partial success States | MUST |
| snapshotId anzeigen ohne Restore zu implizieren | MUST |
| Toast blockiert nicht Confirmation | MUST |

---

## 14. Bridge as first use case — Modul-Übersicht

| moduleId | Pattern | Risk |
|----------|---------|------|
| `bridge.ui.cursor.status` | readonly card | low |
| `bridge.ui.workspace` | action | medium |
| `bridge.ui.file.create` | action | medium-high |
| `bridge.ui.settings` | action | medium |
| `bridge.ui.extension.install` | action + external-code | high |
| `bridge.ui.terminal.command` | action whitelist | high |
| `bridge.ui.ide.command` | action allowlist | high |
| `bridge.ui.agent.prompt` | subsystem action | high |
| `bridge.ui.editor` | readonly collapsed | low |
| `bridge.ui.panels` | shortcuts | medium |
| `bridge.ui.git.status` | readonly | medium |
| `bridge.ui.problems` | readonly + focus | low |
| `bridge.ui.audit.history` | readonly list | low |
| `bridge.ui.version.info` | meta footer | low |
| `bridge.ui.permission.gate` | wrapper | n/a |
| `bridge.ui.confirmation.dialog` | overlay | inherits |
| `bridge.ui.action.result` | overlay | n/a |
| `bridge.ui.error.state` | overlay/inline | n/a |

---

## 15. Blocker

Unspezifiziertes Control-Pattern → **Blocker**.  
UI ohne Registry-Modul-Entsprechung → **Blocker** (oder Registry-Änderung zuerst).
