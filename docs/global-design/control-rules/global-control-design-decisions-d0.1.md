# Global Control Design Rules — D0.1 User Decisions

> Diese Regeln sind **global** und wiederverwendbar für Control-/Programmsteuerungs-UIs. **Bridge ist nur der erste Use Case.**

**Status:** D0.1 — Entscheidungen dokumentiert (normativ)  
**Version:** 0.1.0-d0.1  
**Datum:** 2026-05-27  
**Quelle:** User Multiple-Choice D0.1 (A1–D5)

Diese Datei ist die **einzige normative Quelle** für die D0.1-Entscheidungen. Open Questions verweisen hierher.

---

## Entscheidungsübersicht

| Frage | Wahl | IDs |
|-------|------|-----|
| A1 | A — Statisches HTML `preview/static/` | PQ-001, PQ-002 |
| A2 | A — Sticky Top-Banner | PQ-004 |
| B1 | A — Token-JSON vor D0c unter `tokens/` | TQ-001 |
| B2 | A — Präfix `control.*` final | TQ-003 |
| B3 | Custom — Color-Preset-Architektur | VQ-001 |
| B4 | A — Hex/RGB im Default-Preset | VQ-002 |
| B5 | Custom — Elevation-Profile-Architektur | VQ-004 |
| C1 | Custom — Device-Profile-Architektur | MQ-002 |
| C2 | A — AA global; AAA Risk-Primary | MQ-003 |
| C3 | Custom — Motion + Effect-Profile-Architektur | MO-001 |
| C4 | A — reduced-motion: alle Animationen aus | MO-002 |
| D1 | Custom — Global-first Consumer | LQ-004 |
| D2 | A — Dual-Format Markdown + JSON/YAML | TQ-002 |
| D3 | A — CI fail bei leeren Design-Feldern | TQ-004 |
| D4 | Custom — Agent Stop + cursorweite Rules | AQ-002 |
| D5 | A — Lint Token-Allowlist ab P2 | AQ-003 |

**PQ-002:** Vite/React Preview-Package — **nicht gewählt** (A1=A).

---

## Paket A — D0c Preview-Technik

### A1 — Statische Preview

| Feld | Wert |
|------|------|
| Technologie | Statisches HTML + CSS |
| Pfad | `docs/global-design/control-rules/preview/static/` |
| Build | Kein Vite/React in D0c v1 |
| `web/` Route | MUST NOT |

### A2 — Review-Banner

| Feld | Wert |
|------|------|
| Text | `NOT PRODUCT UI — Global Control Design Review Only` |
| Platzierung | Sticky Top-Banner, volle Breite |
| Styling | `control.color.warn` Hintergrund (aus Default-Preset) |

---

## Paket B — Visual Tokens

### B1 — Token-Datei (D0c-Execution, nicht D0.1)

| Feld | Wert |
|------|------|
| Timing | Vor D0c-Implementierung |
| Pfad | `docs/global-design/control-rules/tokens/control.tokens.json` (oder `.yaml`) |
| D0.1 | Nur Pfad und Schema in Markdown — **keine Datei in D0.1** |

### B2 — Token-Präfix

| Feld | Wert |
|------|------|
| Final | `control.*` |
| Alternative verworfen | `global.control.*`, produkt-spezifische Präfixe als Owner |

### B3 — Color Preset Architecture (Custom)

Presets sind **austauschbare, dokumentierte Farb-Sets**. Keine freien Hex in UI-Code.

| presetId | Rolle | Status |
|----------|-------|--------|
| `neutral-blue-gray` | **Default** — alle `control.color.*` Rollen | Aktiv für D0c; Werte in Token-Datei |
| `brand-*` | Brand-fähige Slots | Platzhalter; **keine erfundenen CoreAI-Brand-Farben** |

| Regel | Stufe |
|-------|-------|
| UI referenziert `colorPresetId` | MUST |
| Wechsel nur über dokumentierte Preset-IDs | MUST |
| Agenten erfinden keine Brand-Hex | MUST NOT |
| User liefert Brand-Preset-Werte explizit | MUST (wenn Brand aktiv) |

### B4 — Hex/RGB-Werte

| Regel | Stufe |
|-------|-------|
| Default-Preset `neutral-blue-gray` enthält konkrete Hex/RGB pro Rolle | MUST (in D0c Token-Datei) |
| Werte kalibriert für Darkmode-first; nicht 1:1 aus `web/` | MUST NOT legacy copy |

**Referenz-Rollen (Werte in Token-Datei bei D0c):** `control.color.bg`, `surface`, `surfaceElevated`, `text`, `textMuted`, `accent`, `accentMuted`, `ok`, `warn`, `danger`, `border`, `focus`.

### B5 — Elevation Profile Architecture (Custom)

| profileId | Stufen | Status |
|-----------|--------|--------|
| `elevation-profile-a` | `none`, `raised`, `overlay`, `modal` | **Default** |
| `elevation-profile-b` | 0–5 (feiner) | Geplant; Migration ohne Semantik-Bruch |

Mapping:

| Stufe | Token |
|-------|-------|
| none | `control.shadow.none` |
| raised | `control.shadow.raised` |
| overlay | `control.shadow.overlay` |
| modal | `control.shadow.overlay` + `control.radius.xl` |

---

## Paket C — Mobile / Accessibility / Motion

### C1 — Device Profile Architecture (Custom)

| profileId | Attribute | Wert | Bearbeitung |
|-----------|-----------|------|-------------|
| `device-profile-default-a` | logical width | 412px | **locked** — nicht löschbar, nicht bearbeitbar |
| | logical height | 915px | locked |
| | safe top | 24px | locked |
| | safe bottom | 34px | locked |
| | label | Galaxy S25 Ultra (Review Reference) | locked |

| Regel | Stufe |
|-------|-------|
| User-Profile: beliebig anlegen, bearbeiten, löschen | MUST (Preview-UI langfristig) |
| Default-Profil immer vorhanden | MUST |
| Preview S15 referenziert `deviceProfileId` | MUST |

### C2 — WCAG

| Bereich | Level |
|---------|-------|
| Gesamte UI | WCAG 2.1 **AA** minimum |
| destructive / external-code Primary Buttons | **AAA** wo technisch möglich |

### C3 — Motion / Effect Profile Architecture (Custom)

**Default Motion (Dialog/Sheet):**

| Transition | Dauer | Easing |
|------------|-------|--------|
| Einblendung | 200ms | ease-out |
| Ausblendung | 150ms | ease-in |
| Bounce | MUST NOT |

**Effect-Profile-Architektur (Roadmap):**

| Feld | Beschreibung |
|------|--------------|
| `effectProfileId` | Referenzierbarer Satz für Motion + optional visuelle Effekte |
| Ziel | Design-Preview wird langfristig **benutzbare Review-UI** — Farben, Abstände, Effekte ändern/prüfen |
| D0c v1 | Statisches HTML zeigt nur Default; Architektur in Markdown |

### C4 — prefers-reduced-motion

| Regel | Stufe |
|-------|-------|
| Bei `prefers-reduced-motion: reduce` alle Animationen 0ms | MUST |
| Spinner statisch | MUST |

---

## Paket D — P2 / Global Architecture

### D1 — Global-first Consumer Model (Custom)

| Regel | Stufe |
|-------|-------|
| Normative Regeln, Presets, Profile: **global**, produktneutral | MUST |
| 1:1 wiederverwendbar in anderen Projekten | MUST |
| Bridge/P2 ist **Consumer**, nicht Owner des Global-Design-Standards | MUST |
| Kein produkt-spezifisches Design-Package als **Endarchitektur** | MUST NOT |
| Ablage Regeln | `docs/global-design/control-rules/` (Bridge-Repo als erste Ablage, extrahierbar) |
| Runtime-Package-Name | **Offen** — Entscheidung in P2-Plan (z. B. später `packages/global-control-design`) |

### D2 — Dual-Format

| Format | Rolle |
|--------|-------|
| Markdown | Semantik, Regeln, Architektur |
| JSON/YAML | Werte, Preset-IDs, Profile-IDs |

Keine doppelte Wahrheit: Hex nur in Token-Datei, nicht frei in Regel-Prosa.

### D3 — CI Enforcement

| Regel | Stufe |
|-------|-------|
| Promotion `poc-v1-ui-modules.json`: fail wenn `requiredDesignTokens` oder `requiredComponents` leer | MUST (ab P2) |
| Ausnahme nur mit dokumentiertem `exemptionReason` | MAY |

### D4 — Agent Enforcement (Custom)

| Ort | Pflicht |
|-----|---------|
| **Cursor User Rules (cursorweit)** | MUST |
| Projekt-AGENTS.md / `.cursor/rules` | SHOULD ergänzend |
| Bridge-Repo allein | MUST NOT als einzige Quelle |

**D0.1 schreibt nicht in `~/.cursor`** — User kopiert Text unten manuell.

### D5 — Lint

| Regel | Stufe |
|-------|-------|
| UI-Code: nur `control.*` Tokens oder Imports aus globalem Design-Artefakt | MUST (ab P2) |
| Freie Hex / Legacy `--bg` in Produkt-UI | MUST NOT |

---

## D4 — Copy-paste: Cursor User Rule (cursorweit)

```
Global Control Design Rules (mandatory for any Control UI work):

- Source of truth: docs/global-design/control-rules/ (Global Control Design Rules).
- Bridge is only the first use case; rules are global and product-neutral.
- Missing design rule, token ID, preview section, or state spec = STOP. Do not improvise colors, spacing, layout, or motion.
- Propose a rule change and wait for user approval before implementing UI.
- Do not use web/ or overlay/ styles as normative sources.
- D0c preview and P2 UI require explicit user approval after D0.1 decisions are documented.
```

---

## Deferred (bewusst nicht in D0.1)

| Thema | Phase |
|-------|-------|
| `control.tokens.json` anlegen | D0c-Execution |
| `preview/static/` HTML/CSS | D0c-Execution |
| Interaktive Preview-Editor-UI | post-D0c Roadmap |
| `elevation-profile-b` (0–5) | später |
| CoreAI Brand-Preset Hex-Werte | User liefert |
| Globales npm-Package | P2+ |
| CI/Lint-Skripte im Repo | P2-Execution |
| Registry `designrulesStatus` Update | post-D0c |

---

## Gates (nach D0.1)

| Freigabe | Automatisch nach D0.1? |
|----------|-------------------------|
| D0.1 Markdown complete | Ja (nach Execution) |
| D0c starten | **Nein** — explizite User-Freigabe + D0c-Plan |
| P2 starten | **Nein** — explizite User-Freigabe + P2-Plan |
