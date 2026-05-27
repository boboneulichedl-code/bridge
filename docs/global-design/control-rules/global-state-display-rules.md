# Global State Display Rules

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Regelgruppe:** 6 — Global State Display Rules  
**Version:** 0.1.0-draft  
**Preview-Sektionen:** S05, S06, S12, S17

---

## 1. Scope

Einheitliche Darstellung aller UI-Zustände in Modulen, Dialogen und Cross-Cutting-Komponenten.

Globale Spec ist Pflicht; Modul-Overrides erlaubt, müssen auf globalen State-ID referenzieren.

---

## 2. State-ID-Register

| stateId | Kurzlabel | Visuell (Pflicht) | Copy-Pattern |
|---------|-----------|------------------|--------------|
| `loading` | Laden | Skeleton oder Spinner `control.color.textMuted` | „Loading…“ / kontextspezifisch |
| `empty` | Leer | Illustration optional, muted text | „No data yet“ + hint |
| `success` | Erfolg | `control.color.ok`, check icon | Kurz, auto-dismiss für toasts |
| `warning` | Warnung | `control.color.warn` | Erklärung + optional action |
| `error` | Fehler | `control.color.danger` | Titel + code + retry wenn sinnvoll |
| `blocked` | Blockiert | danger/muted, lock icon | Grund + wer behebt |
| `disabled` | Deaktiviert | reduced opacity 0.5 | Warum disabled |
| `offline` | Offline | muted, cloud-off | Netzwerk/Host unreachable |
| `unreachable` | Host unreachable | wie offline + adapter name | Extension/API down |
| `running` | Läuft | accent pulse/spinner | In-progress, cancel wenn supported |
| `failed` | Fehlgeschlagen | danger | Fehlercode + retry |
| `partial success` | Teilweise | warn + ok mix | Was ging, was nicht |
| `confirmation required` | Bestätigung nötig | warn inline | Block bis confirmed |
| `permission denied` | Keine Berechtigung | blocked | Permission name |
| `external-code warning` | Externer Code | warn banner persistent | Install risks |
| `restore available` | Restore möglich | caution CTA | snapshotId sichtbar |
| `restore unavailable` | Restore nicht möglich | muted, no CTA | Warum nicht |

**Fehlender State für Modul-Kontext → Blocker.**

---

## 3. Globale Darstellungsregeln

| Regel | Stufe |
|-------|-------|
| Jeder State nutzt mindestens: Icon + Text + semantische Farbe | MUST |
| State-Wechsel: kein Layout-Springen > 8px ohne Skeleton | SHOULD |
| `loading` in Modulen: Skeleton bevorzugt für Cards | SHOULD |
| `error` zeigt `errorCode` wenn von API (z. B. CONFIRMATION_REQUIRED) | MUST |
| `success` Toast/Result: max 5s auto-dismiss, dismiss manual | SHOULD |
| `disabled` nicht nur grau — Tooltip/Hint warum | SHOULD |

---

## 4. State → Token

| stateId | Primär-Token |
|---------|--------------|
| loading | `control.color.textMuted` |
| empty | `control.color.textMuted` |
| success | `control.color.ok` |
| warning | `control.color.warn` |
| error | `control.color.danger` |
| blocked | `control.color.danger` + `control.color.surface` |
| disabled | opacity + `control.color.textMuted` |
| offline / unreachable | `control.color.textMuted` |
| running | `control.color.accent` |
| confirmation required | `control.color.warn` |
| permission denied | `control.color.danger` |
| external-code warning | `control.color.warn` |
| restore available | `control.color.warn` |
| restore unavailable | `control.color.textMuted` |

---

## 5. API / Gate Code Mapping (Bridge first use case)

| errorCode / condition | stateId |
|-----------------------|---------|
| `CONFIRMATION_REQUIRED` | confirmation required |
| `PERMISSION_DENIED` | permission denied |
| `ALLOWLIST_VIOLATION` | error (+ allowlist hint) |
| `ROLLBACK_NOT_AVAILABLE` | restore unavailable |
| `EXTENSION_UNREACHABLE` | unreachable |
| Network failure | offline |
| Action in flight | running |
| Action ok | success |
| Action fail | failed |

**Modul:** `bridge.ui.error.state` mappt zentral.

---

## 6. Modul-Overrides

| Regel | Stufe |
|-------|-------|
| Override referenziert `stateId` aus diesem Register | MUST |
| Override darf Copy anpassen, nicht visuelle Kategorie wechseln | MUST |
| Neuer Modul-State ohne globale ID | MUST NOT — zuerst Register erweitern |

---

## 7. Kombinationen

| Situation | Anzeige |
|-----------|---------|
| loading + running | running hat Vorrang für laufende Action |
| error nach success | success ersetzen durch error |
| confirmation required + disabled | disabled wenn Gate, sonst confirmation |
| external-code warning + confirmation required | Banner + Dialog |

---

## 8. Bridge as first use case — Modul States

| Modul | Pflicht-States |
|-------|----------------|
| `bridge.ui.cursor.status` | loading, empty, error, disabled, unreachable |
| `bridge.ui.workspace` | loading, confirmation required, success, error |
| `bridge.ui.file.create` | loading, confirmation required (overwrite), success, error |
| `bridge.ui.extension.install` | external-code warning, confirmation required, running, success, error |
| `bridge.ui.terminal.command` | loading, confirmation required, running, failed |
| `bridge.ui.agent.prompt` | confirmation required, running, success, failed |
| `bridge.ui.action.result` | success, warning, partial success, restore available/unavailable |
| `bridge.ui.audit.history` | loading, empty |
| `bridge.ui.permission.gate` | permission denied, disabled |

---

## 9. Blocker

Fehlender State in Rules oder Preview `requiredStates` → **Blocker**.  
Komponente ohne definierte States → **Blocker** für P2.

**Preview:** S06 (alle States), S05 (Action/Button states), S17 (error/blocked/offline).
