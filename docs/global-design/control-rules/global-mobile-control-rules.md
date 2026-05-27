# Global Mobile Control Rules

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Regelgruppe:** 3 — Global Mobile Control Rules  
**Version:** 0.1.0-d0.1  
**Preview-Sektionen:** S15, S16 (mit Base)

---

## 1. Scope

Touch, Erreichbarkeit, Scroll, Bottom Actions, Sticky Status, Safe Areas, Galaxy S25 Ultra als Referenz, kleine Displays, einhandbedienbare Controls.

---

## 2. Nicht-Ziele

- Keine Desktop-IDE-Layouts
- Keine 1:1-Übernahme von `web/` Tab-Navigation als normatives Muster
- Keine tablet-first Breakpoints vor Mobile-Referenz

---

## 3. Viewport-Priorität

| Priorität | Zielgerät |
|-----------|-----------|
| 1 | Samsung Galaxy S25 Ultra (Referenz-Frame) |
| 2 | Android allgemein |
| 3 | iPhone |
| 4 | Tablet |
| 5 | Desktop-Browser (schmale Column) |

| Regel | Stufe |
|-------|-------|
| Layout und Touch für Priorität 1 zuerst prüfen | MUST |
| Preview-Frame S15 beschreibt Referenz (siehe Preview-Spec) | MUST |

### Device Profile Architecture (D0.1)

Siehe [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md#c1--device-profile-architecture-custom).

| profileId | logical W×H | safe top | safe bottom | Bearbeitung |
|-----------|-------------|----------|-------------|-------------|
| `device-profile-default-a` | 412×915 px | 24px | 34px | **locked** — nicht löschbar, nicht bearbeitbar |

| Regel | Stufe |
|-------|-------|
| User-Profile: anlegen, bearbeiten, löschen | MUST (Preview-UI langfristig) |
| Default-Profil immer aktiv fallback | MUST |
| Preview S15 nutzt `deviceProfileId` | MUST |

### Referenz-Frame (Default-Profil A)

```
+----------------------------------+
|  status bar / safe top (24px)    |
|  +----------------------------+  |
|  |  scroll: module stack      |  |
|  |                            |  |
|  +----------------------------+  |
|  [ optional bottom actions ]   |
|  safe bottom (34px)            |
+----------------------------------+
  logical: 412 x 915 px
```

---

## 4. Touch-Ziele

**D0-Default (verbindlich):** Mindest-Touch-Ziel **48×48 dp**. Wenn der User später 44 dp oder 56 dp festlegt, wird diese Regel per Änderung angepasst — bis dahin gilt 48 dp als MUST.

| Regel | Stufe |
|-------|-------|
| Interaktive Controls mindestens 48×48 dp Äquivalent | MUST |
| Abstand zwischen touch targets mindestens 8px | MUST |
| Destructive Primary Button: volle Breite oder min. 48dp Höhe | MUST |
| Checkbox/Radio hit area mindestens 48×48 | MUST |

| Token | Verwendung |
|-------|------------|
| `control.touch.min` | 48px minimum dimension (D0-Default) |
| `control.touch.gap` | 8px between targets |

**Blocker:** Touch-Regel umgangen oder Ziel kleiner als 48×48 dp ohne User-Freigabe → nicht smartphone-first.

---

## 5. Daumen-Erreichbarkeit

| Regel | Stufe |
|-------|-------|
| Primäre CTAs im unteren Drittel oder Bottom Action Zone | SHOULD |
| Destructive Confirm: nicht allein oben rechts als kleines Icon | MUST NOT |
| Sekundäre/destructive Aktionen mit Abstand zu primären CTAs | MUST |
| Einhand: wichtigste Aktionen ohne Reach-to-top | SHOULD |

---

## 6. Scroll-Verhalten

| Regel | Stufe |
|-------|-------|
| Module-Stack vertikal scrollbar | MUST |
| Sticky Header max. ein Modul (Status) | MUST (siehe Composition) |
| Confirmation Dialog: body scroll intern, Hintergrund fixed | SHOULD |
| Pull-to-refresh nur wenn explizit spezifiziert | MAY |
| Horizontales Scroll in Listen vermeiden | SHOULD |

---

## 7. Bottom Actions

| Regel | Stufe |
|-------|-------|
| Feste Zone über `safe-area-inset-bottom` für primäre View-Actions | MAY pro View |
| Höhe Bottom Zone inkl. safe area dokumentiert | SHOULD |
| Bottom Zone überdeckt keinen Pflicht-Content ohne Scroll-Padding | MUST |
| `padding-bottom` auf Scroll-Container: bottom zone + safe area | MUST wenn Bottom Zone |

| Token | Verwendung |
|-------|------------|
| `control.layout.bottomActionHeight` | z. B. 72px + safe |

---

## 8. Sticky Status

| Regel | Stufe |
|-------|-------|
| Maximal ein sticky Modul-Header (typisch Status) | MUST |
| Sticky Hintergrund undeklariert transparent über Content | MUST NOT |
| Sticky Höhe kompakt (nicht > 25% viewport) | SHOULD |

**Bridge:** `bridge.ui.cursor.status` nach Permission Gate.

---

## 9. Safe Areas

| Regel | Stufe |
|-------|-------|
| `env(safe-area-inset-top/bottom/left/right)` berücksichtigen | MUST |
| Fallback 0px wenn nicht unterstützt | MUST |
| Vollbild-Dialoge: safe areas in Dialog-Padding | MUST |
| Notch: kein CTA unter Status-Overlap | MUST |

| Token | Verwendung |
|-------|------------|
| `control.layout.safeBottom` | env(safe-area-inset-bottom, 0px) |
| `control.layout.safeTop` | env(safe-area-inset-top, 0px) |

---

## 10. Galaxy S25 Ultra Optimierung

| Regel | Stufe |
|-------|-------|
| Große Displays: Content max-width begrenzen (nicht full-bleed Textzeilen) | SHOULD |
| `max-width` Mobile column ca. 480px centered | SHOULD |
| Hohe DPI: keine sub-1px Borders ohne Kontrastprüfung | SHOULD |
| Edge-Gesten: keine kritischen CTAs am äußersten Rand (2–4px inset) | SHOULD |

---

## 11. Kleine Displays & Einhand

| Regel | Stufe |
|-------|-------|
| Sekundäre Module default collapsed (siehe Composition) | SHOULD |
| Formulare: ein Feld pro Zeile auf schmalen Viewports | SHOULD |
| Lange Pfade: truncate + expand, nicht horizontal scroll | MUST |
| Zwei-Spalten-Layouts auf Mobile | MUST NOT |

---

## 12. Motion (D0.1)

Siehe [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md#c3--motion--effect-profile-architecture-custom).

| Regel | Stufe |
|-------|-------|
| Dialog/Sheet Ein: 200ms ease-out | MUST |
| Dialog/Sheet Aus: 150ms ease-in | MUST |
| Bounce-Easing | MUST NOT |
| `prefers-reduced-motion: reduce` → 0ms, statischer Spinner | MUST |
| `effectProfileId` für spätere Preview-Editor-UI vorbereitet | SHOULD (Roadmap) |

---

## 13. Darkmode-first (Mobile)

| Regel | Stufe |
|-------|-------|
| Mobile Default dark (siehe Base Rules) | MUST |
| OLED-friendly: echtes Schwarz vermeiden für große Flächen | SHOULD |
| Outdoor-Lesbarkeit: textMuted nicht zu schwach | SHOULD |

**Preview:** S16

---

## 14. Bridge as first use case — Mapping

| Modul | Mobile-Regel |
|-------|--------------|
| `bridge.ui.cursor.status` | sticky top, kompakt |
| `bridge.ui.workspace` | path truncate, confirm bottom sheet |
| `bridge.ui.terminal.command` | whitelist picker, large touch rows |
| `bridge.ui.agent.prompt` | subsystem section, nicht bottom-primary |
| `bridge.ui.confirmation.dialog` | fullscreen sheet on narrow viewport |
| `BridgeMobileView.cursor` | vertical stack, safe bottom padding |

---

## 15. Blocker

Fehlende Mobile-Regel für ein geplantes Control → **Blocker**.  
Fehlende Preview-Sektion S15 → **Blocker** für Mobile-Freigabe.
