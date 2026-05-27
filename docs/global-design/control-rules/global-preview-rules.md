# Global Preview Rules

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Regelgruppe:** 7 — Global Preview Rules  
**Version:** 0.1.0-d0c  
**Preview-Spec:** [preview/global-control-design-preview-spec.md](preview/global-control-design-preview-spec.md)

---

## 1. Scope

Meta-Regeln für Review-fähige Visualisierung aller Global Control Design Rules — ohne Produkt-UI zu sein.

---

## 2. Grundsätze

| Regel | Stufe |
|-------|-------|
| Jede verbindliche Regel hat mindestens eine Preview-Sektion (S01–S17) | MUST |
| Jede Komponente/ jedes Pattern hat alle relevanten States dokumentiert | MUST |
| Jede Risk-Stufe hat mindestens ein Beispiel-Szenario in Preview-Spec | MUST |
| Mobile Preview beschreibt Galaxy S25 Ultra Frame (S15) | MUST |
| Preview ist **nicht** Produkt-UI | MUST |
| Banner/Kopf „Not Product UI — Design Review Only“ in D0c | MUST (D0c) |
| Kein UI-Sprint ohne abgehakte [Review-Checklist](global-control-design-review-checklist.md) | MUST |

---

## 3. D0 / D0.1 / D0c

| Phase | Inhalt | Status |
|-------|--------|--------|
| **D0b** | Markdown-Spec S01–S17 | Abgeschlossen |
| **D0.1** | User-Entscheidungen dokumentiert | Abgeschlossen |
| **D0c** | Statisches HTML + CSS unter `preview/static/` | Implementiert — siehe [preview/static/index.html](preview/static/index.html) |
| **D0c Roadmap** | Interaktive Preview-UI (Presets, Device-Profile, Effects live) | post-D0c — C3 |

| Regel | Stufe |
|-------|-------|
| D0c Technologie: statisches HTML (A1) — kein Vite/React | MUST |
| D0c Banner: sticky top (A2) | MUST |
| D0c nutzt `tokens/control.tokens.json` (B1) | MUST |
| D0b/D0.1 enthalten keine HTML/CSS/React | MUST |
| D0c darf `web/` Produkt-PWA nicht verändern | MUST |
| D0c Route in `web/` | MUST NOT |
| D0.1 allein startet D0c nicht | MUST |

---

## 4. Preview-Sektions-Schema

Jede Sektion in der Preview-Spec **muss** enthalten:

| Feld | Pflicht |
|------|---------|
| `previewSectionId` | ja |
| `linkedRuleFiles` | ja |
| `purpose` | ja |
| `mustShow` | ja |
| `requiredStates` | ja |
| `requiredRiskExamples` | ja oder `n/a` begründet |
| `mobileRequirement` | ja |
| `reviewChecklistItems` | ja |
| `blockedIfMissing` | `yes` |

**Fehlende Sektion → Blocker** für UI-Freigabe.

---

## 5. Review-Fähigkeit

| Regel | Stufe |
|-------|-------|
| User kann jede Sektion ohne Code gegen Regeldatei prüfen | MUST (D0b) |
| `reviewChecklistItems` pro Sektion abhakbar | MUST |
| Abweichung Regel ↔ Preview → Regel oder Preview zuerst korrigieren | MUST |
| Screenshots in D0b optional (nicht Pflicht) | MAY |

---

## 6. States in Preview

Alle `stateId` aus [global-state-display-rules.md](global-state-display-rules.md) müssen in mindestens einer Sektion als `requiredStates` vorkommen.

S06 trägt die vollständige State-Galerie.

---

## 7. Risk in Preview

S07: riskClass-Beispiele  
S08: Confirmation-Flows  
S09: Permission / Allowlist  
S17: Error / Blocked / Offline

Kein Risk-Beispiel für produktive destructive Action → **Blocker**.

---

## 8. Mobile in Preview

S15: Device Frame Spec  
S16: Darkmode-first

`mobileRequirement: yes` wo Touch/Layout relevant.

---

## 9. Agenten / Cursor

| Regel | Stufe |
|-------|-------|
| Agenten implementieren Preview nicht als `web/` Feature | MUST |
| Agenten nutzen Preview-Spec nur als Review-Checkliste | MUST |
| Fehlende Preview = Blocker, nicht „einfach bauen“ | MUST |
| Agenten erfinden keine Farben/Spacing außerhalb Token-IDs | MUST |

---

## 10. Freigabe-Gate

### REVIEW_DONE (nur D0 — Dokumentation)

```
REVIEW_DONE (D0) erfordert:
  [ ] Alle S01–S17 vorhanden mit Pflichtfeldern
  [ ] Review-Checklist global + pro Gruppe
  [ ] Keine verbotenen Terminologie-Begriffe in D0-Dateien
  [ ] Alle Open Questions haben blocksD0cOrP2
  [ ] User sign-off für D0-Dokumentation
```

`REVIEW_DONE` (D0) bedeutet **nicht** automatisch Freigabe für D0c oder P2.

### Vor D0c oder P2 zusätzlich

```
  [ ] Keine Open Question mit blocksD0cOrP2=yes und Status open
      (ohne explizite User-deferred-Begründung)
  [ ] Explizite User-Freigabe für D0c bzw. P2
```

Danach: D0c oder P2-UI nur mit expliziter Anweisung.

---

## 11. Blocker

| Bedingung | Ergebnis |
|-----------|----------|
| Regel ohne Preview-Sektion | Blocker |
| Preview-Sektion ohne linkedRuleFiles | Blocker |
| Preview als Produkt-UI ausgeliefert | Verboten |
| UI-Sprint ohne Review | Blocker |
