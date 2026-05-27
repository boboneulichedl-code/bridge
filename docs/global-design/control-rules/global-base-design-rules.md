# Global Base Design Rules

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Regelgruppe:** 1 — Global Base Design Rules  
**Version:** 0.1.0-d0.1  
**Preview-Sektionen:** S01, S02, S03, S04, S16

---

## 1. Scope

Grundlagen für alle Control-UIs: Farben, Typografie, Spacing, Radius, Borders, Shadows, Darkmode, Kontrast, Icons, Layout, Token-Naming.

Gilt für modulare Action-Views, Dialoge, Statusbereiche und Preview (D0b/D0c).

---

## 2. Nicht-Ziele

- Keine freien Hex-Werte außerhalb dokumentierter Presets (Werte in `tokens/control.tokens.json` — **D0c-Execution**)
- Keine Übernahme von `web/src/styles.css` oder `overlay/` als Quelle
- Keine produkt-/adapter-spezifischen Tokens als globaler Standard

---

## 3. Token-Naming

| Regel | Stufe |
|-------|-------|
| Alle globalen Tokens nutzen Präfix `control.` | MUST |
| Semantische Namen, keine Implementierungsdetails (`control.color.danger`, nicht `control.red500`) | MUST |
| Adapter-spezifische Erweiterungen: separates Präfix nur nach User-Freigabe (z. B. `bridge.` Erweiterung) | SHOULD NOT in D0 |
| Jede UI-Implementierung referenziert nur dokumentierte Token-IDs | MUST |
| Fehlende Token-ID | **Blocker** — nicht improvisieren |

### Kategorien

| Kategorie | Muster | Beispiel |
|-----------|--------|----------|
| Farbe | `control.color.{role}` | `control.color.bg` |
| Typo | `control.type.{role}` | `control.type.title` |
| Spacing | `control.space.{size}` | `control.space.md` |
| Radius | `control.radius.{size}` | `control.radius.lg` |
| Border | `control.border.{variant}` | `control.border.subtle` |
| Shadow | `control.shadow.{level}` | `control.shadow.raised` |
| Icon | `control.icon.{size}` | `control.icon.md` |

---

## 4. Color Preset Architecture (D0.1)

Siehe [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md#b3--color-preset-architecture-custom).

| Regel | Stufe |
|-------|-------|
| Farben kommen aus dokumentiertem `colorPresetId` | MUST |
| Default-Preset: `neutral-blue-gray` | MUST |
| Brand-Presets: nur mit User-gelieferten Werten; keine erfundenen Brand-Hex | MUST NOT |
| Preset-Wechsel nur über dokumentierte IDs | MUST |

---

## 5. Farben (semantische Rollen)

Werte pro Rolle liegen im aktiven Color-Preset (Token-Datei). Rollen:

| Token-ID | Rolle | Verwendung |
|----------|-------|------------|
| `control.color.bg` | App-Hintergrund | Root, scroll area |
| `control.color.surface` | Karten, Module | Module body |
| `control.color.surfaceElevated` | Dialog, Sheet | Confirmation, overlays |
| `control.color.text` | Primärtext | Labels, titles |
| `control.color.textMuted` | Sekundärtext | Meta, hints |
| `control.color.accent` | Primäre Aktion | Standard CTAs |
| `control.color.accentMuted` | Gedämpfte Aktion | Secondary buttons |
| `control.color.ok` | Erfolg | success state |
| `control.color.warn` | Warnung | warning, external-code hint |
| `control.color.danger` | Gefahr | destructive, errors |
| `control.color.border` | Trennlinien | Cards, inputs |
| `control.color.focus` | Fokus-Ring | a11y focus |

| Regel | Stufe |
|-------|-------|
| Farben nur über semantische Token-IDs | MUST |
| `danger` und `warn` visuell unterscheidbar | MUST |
| Akzentfarbe nicht für destructive Actions verwenden | MUST NOT |

**Preview:** S01

---

## 6. Typografie

| Token-ID | Rolle | SHOULD Größe (relativ) |
|----------|-------|-------------------------|
| `control.type.caption` | Kleinsttext | 0.75rem |
| `control.type.body` | Fließtext | 0.875–1rem |
| `control.type.label` | Form labels | 0.875rem |
| `control.type.title` | Modul-Titel | 1.125–1.25rem |
| `control.type.headline` | View-Titel | 1.25rem+ |
| `control.type.mono` | IDs, codes | monospace |

| Regel | Stufe |
|-------|-------|
| System-UI-Stack oder ein festgelegtes Font (nach VQ-003) | SHOULD |
| Monospace nur für Codes, actionIds, hashes | MUST |
| Maximal 3 Gewichte pro View (regular, medium, bold) | SHOULD |
| Zeilenhöhe body mindestens 1.4 | SHOULD |

**Preview:** S02

---

## 7. Spacing

8px-Basis-Grid (4px für feine Anpassungen erlaubt).

| Token-ID | Wert | Verwendung |
|----------|------|------------|
| `control.space.xs` | 4px | Icon gaps |
| `control.space.sm` | 8px | Inner padding tight |
| `control.space.md` | 16px | Standard module padding |
| `control.space.lg` | 24px | Section gap |
| `control.space.xl` | 32px | Major separation |

| Regel | Stufe |
|-------|-------|
| Modul-Innenabstand mindestens `control.space.md` horizontal | MUST |
| Abstand zwischen gestapelten Modulen mindestens `control.space.lg` | MUST |
| Touch-Ziele dürfen Spacing nicht unter Minimum drücken | MUST |

**Preview:** S03

---

## 8. Radius, Borders, Shadows

| Token-ID | Rolle |
|----------|-------|
| `control.radius.sm` | Chips, badges |
| `control.radius.md` | Buttons, inputs |
| `control.radius.lg` | Cards, modules |
| `control.radius.xl` | Dialogs, sheets |
| `control.border.subtle` | 1px low-contrast |
| `control.border.strong` | Emphasis, danger |
| `control.shadow.none` | Flat |
| `control.shadow.raised` | Cards |
| `control.shadow.overlay` | Dialogs |

### Elevation Profile Architecture (D0.1)

Siehe [global-control-design-decisions-d0.1.md](global-control-design-decisions-d0.1.md#b5--elevation-profile-architecture-custom).

| profileId | Stufen | Status |
|-----------|--------|--------|
| `elevation-profile-a` | none, raised, overlay, modal | **Default** |
| `elevation-profile-b` | 0–5 (feiner) | Geplant — Migration ohne Semantik-Bruch |

| Regel | Stufe |
|-------|-------|
| UI referenziert `elevationProfileId` | MUST |
| Default: `elevation-profile-a` | MUST |

| Regel | Stufe |
|-------|-------|
| Destructive Dialoge: `control.radius.xl` + `control.shadow.overlay` | SHOULD |
| Keine harte 0px-Radius-Ästhetik für interaktive Controls | SHOULD NOT |

**Preview:** S04

---

## 9. Darkmode

| Regel | Stufe |
|-------|-------|
| Default-Theme ist dark (`control.theme.mode = dark`) | MUST |
| Light-Theme optional, nicht in v1 Pflicht | MAY (deferred MQ-004) |
| Hintergrund nicht reines #000 — leichte Surface-Tiefe | SHOULD |
| Text auf Surface: Kontrast mindestens WCAG AA (4.5:1 normal text) | MUST |

**Preview:** S16

---

## 10. Kontrast & Accessibility

| Regel | Stufe |
|-------|-------|
| Text/Control-Kontrast WCAG 2.1 AA minimum | MUST |
| destructive / external-code Primary Buttons: AAA wo möglich (D0.1 C2) | MUST |
| Fokus-Indikator sichtbar (`control.color.focus`) | MUST |
| Farbe nie alleiniger Träger von Bedeutung (Icon/Text zusätzlich) | MUST |

---

## 11. Icon-Stil

| Regel | Stufe |
|-------|-------|
| Einheitlicher Stil pro View (outline ODER filled) | MUST |
| Größen: `control.icon.sm` (16), `control.icon.md` (20), `control.icon.lg` (24) | SHOULD |
| Emoji nicht als System-Icons | MUST NOT |
| Risk-Icons: danger/warn/lock konsistent | MUST |

---

## 12. Grundlayout

| Regel | Stufe |
|-------|-------|
| Smartphone-first; max content width für Mobile (siehe Mobile Rules) | MUST |
| Desktop-Browser: zentrierter schmaler Column, nicht IDE-Layout kopieren | MUST |
| Keine feste Sidebar wie Desktop-IDE | MUST NOT |
| Scroll: vertikal primär; horizontales Scroll in Modulen vermeiden | SHOULD |

---

## 13. Bridge as first use case — Mapping

| Modul | Relevante Base Tokens |
|-------|----------------------|
| `bridge.ui.cursor.status` | surface, text, type.title |
| `bridge.ui.confirmation.dialog` | surfaceElevated, radius.xl, shadow.overlay, danger |
| `bridge.ui.version.info` | type.caption, textMuted |
| Alle Module | bg, surface, space.md, radius.lg |

---

## 14. Blocker

Fehlende Base-Regel oder Token-ID für ein UI-Element → **Blocker**. Keine Werte aus Legacy-CSS übernehmen.

Siehe [global-control-design-index.md](global-control-design-index.md).
