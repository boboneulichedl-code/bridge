# Global Module Composition Rules

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Regelgruppe:** 5 — Global Module Composition Rules  
**Version:** 0.1.0-draft  
**Preview-Sektionen:** S11, S14

---

## 1. Scope

Aufbau modularer Control-Views: Stacking, Hierarchie, Collapse, Priorität, Cross-Cutting-Module, Agent als Subsystem, Audit/History-Platzierung, Status oben, Risk-Actions getrennt, Progressive Disclosure.

---

## 2. Nicht-Ziele

- Keine monolithische „Program Control Page“
- Keine Tab-Navigation als Default für PoC-Modul-Stack (Tabs MAY später, nicht Default)
- Keine Vermischung Cross-Cutting-Module in Stack-Reihenfolge

---

## 3. View-Layout-Prinzipien

| Regel | Stufe |
|-------|-------|
| View = `vertical-stack` aus registrierten Modulen | MUST |
| `viewId` Pattern: `{Product}MobileView.{adapterId}` | SHOULD |
| Monolithische Single-Page mit allen Actions | MUST NOT |
| Module versioniert und einzeln deaktivierbar (`enabled: false`) | SHOULD (P2 registry) |

---

## 4. Modul-Stacking

```
[ Permission Gate wrapper — optional outer ]
  [ Sticky: Status Module ]
  [ Scroll stack:
      Workspace
      Editor (collapsed default)
      File
      Settings
      Extension (risk group)
      Terminal (risk group)
      IDE Command (risk group)
      Panels (collapsed)
      Git (collapsed)
      Problems (collapsed)
      Agent Subsystem Section
      Audit History
      Version Info footer
  ]
[ Cross-cutting overlays — not in stack index:
    Confirmation Dialog
    Action Result toast/sheet
    Error State inline/overlay
]
```

| Regel | Stufe |
|-------|-------|
| Cross-cutting Module nicht als normale Stack-Items | MUST |
| Risk-heavy Module nicht in einer gemeinsamen „Actions“-Card verstecken | MUST |
| Maximal ein sticky Modul (Status) | MUST |

---

## 5. Bridge as first use case — moduleOrder

Verbindliche Reihenfolge für `BridgeMobileView.cursor` (aus Proposal, P2):

| # | moduleId | Notiz |
|---|----------|-------|
| 1 | `bridge.ui.permission.gate` | Wrapper |
| 2 | `bridge.ui.cursor.status` | Sticky-Kandidat |
| 3 | `bridge.ui.workspace` | |
| 4 | `bridge.ui.editor` | collapsed default |
| 5 | `bridge.ui.file.create` | |
| 6 | `bridge.ui.settings` | |
| 7 | `bridge.ui.extension.install` | risk group |
| 8 | `bridge.ui.terminal.command` | risk group |
| 9 | `bridge.ui.ide.command` | risk group |
| 10 | `bridge.ui.panels` | collapsed default |
| 11 | `bridge.ui.git.status` | collapsed default |
| 12 | `bridge.ui.problems` | collapsed default |
| 13 | `bridge.ui.agent.prompt` | subsystem section |
| 14 | `bridge.ui.audit.history` | vor footer |
| 15 | `bridge.ui.version.info` | footer |

**crossCuttingModules:** `bridge.ui.confirmation.dialog`, `bridge.ui.action.result`, `bridge.ui.error.state`

**forbidden:** `monolithic-cursor-control-page`

---

## 6. Modul-Hierarchie & Priorität

| Regel | Stufe |
|-------|-------|
| Status und Gate vor mutierenden Modulen | MUST |
| Audit vor Version-Footer | MUST |
| Agent nach IDE-Modulen, vor Audit | MUST |
| Risk-Module visuell als Gruppe (Abstand/Trennlinie), nicht einzeln verstreut | SHOULD |
| Lesemodule (editor, git, problems) niedrigere Priorität — collapsed | SHOULD |

---

## 7. Collapse & Progressive Disclosure

| Regel | Stufe |
|-------|-------|
| Read-only Sekundärmodule default collapsed | SHOULD |
| Expand zeigt volle Details, nicht neue Route | MUST |
| Advanced Options hinter „Advanced“ innerhalb Modul | SHOULD |
| Collapse-State pro Modul session-persistent | MAY |

| Pattern-ID | Verwendung |
|------------|------------|
| `control.pattern.module.collapsed` | Header + chevron |
| `control.pattern.module.expanded` | Full body |

---

## 8. Agent als Subsystem

| Regel | Stufe |
|-------|-------|
| Agent-Modul in eigener Section mit Subsystem-Badge | MUST |
| Agent nicht in Haupt-CTA-Reihe mit IDE-Actions | MUST NOT |
| Badge-Text: „Subsystem“ oder adapter-spezifisch | MUST |
| `primaryPurpose: false` im Modell → UI darf nicht Hero-Feature wirken | MUST |
| Accordion um Agent-Section erlaubt | SHOULD |

**Preview:** S14

---

## 9. Audit / History Platzierung

| Regel | Stufe |
|-------|-------|
| Audit-Modul unter operativen Modulen, über Version | MUST |
| Chronologisch neueste zuerst | SHOULD |
| riskClass-Spalte oder Badge pro Eintrag | MUST |
| Tap auf Eintrag: Detail ohne sensitive Klartexte | MUST |

**Preview:** S10, S11

---

## 10. Cross-Cutting-Module

| Modul | Rolle | Platzierung |
|-------|-------|-------------|
| `bridge.ui.confirmation.dialog` | Modal/Sheet | Overlay |
| `bridge.ui.action.result` | Toast/Banner | Overlay, non-blocking |
| `bridge.ui.error.state` | Inline in Modul oder global banner | Overlay/inline |
| `bridge.ui.permission.gate` | Wrapper | Umschließt Stack |

| Regel | Stufe |
|-------|-------|
| Nur ein Confirmation-Dialog gleichzeitig | MUST |
| Action Result überdeckt nicht Confirmation | MUST |

---

## 11. Risk Actions getrennt

| Regel | Stufe |
|-------|-------|
| extension, terminal, command nicht in einer kombinierten Karte | MUST |
| Jedes Risk-Modul eigener Header mit risk indicator | SHOULD |
| Agent separat von terminal/command | MUST |

---

## 12. Blocker

- Abweichung von `vertical-stack` ohne User-Freigabe → **Blocker**
- Fehlende Preview S11 → **Blocker**
- Cross-cutting Modul im `moduleOrder` Stack → **Blocker**
