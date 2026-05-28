# control.components.json — Schema and Validation

> **Status:** P2.0-pre documentation (manual review; no CI script in this phase)  
> **Linked files:** [control.components.json](control.components.json), [control.tokens.json](control.tokens.json), [p2-module-token-crosswalk.md](../p2-module-token-crosswalk.md)

---

## 1. Purpose

Defines the machine-readable component and pattern catalog for Global Control Design Rules. Used by:

- [p2-module-token-crosswalk.md](../p2-module-token-crosswalk.md) — module → component/token mapping
- Future P2.0 CI validation (D3) — fail on empty or invalid registry fields

---

## 2. Top-level schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `schemaVersion` | string | MUST | Currently `control-components-1.0.0` |
| `meta` | object | MUST | Catalog metadata |
| `validationRules` | object | MUST | Declarative rules for future automated checks |
| `components` | array | MUST | Component entries (`control.component.*`) |
| `patterns` | array | MUST | Pattern entries (`control.pattern.*`) |

### meta object

| Field | Description |
|-------|-------------|
| `tokenPrefix` | `control` |
| `componentIdPrefix` | `control.component` |
| `patternIdPrefix` | `control.pattern` |
| `sourceOfTruth` | Path to this file |
| `linkedTokenFile` | `control.tokens.json` |
| `phase` | Creation phase (e.g. `P2.0-pre`) |

---

## 3. Entry schema (components[] and patterns[])

Each entry MUST include all fields:

| Field | Type | Rules |
|-------|------|-------|
| `id` | string | Unique; MUST start with `control.component.` or `control.pattern.` |
| `displayName` | string | Non-empty |
| `category` | string | One of: foundation, input, feedback, layout, risk, cross-cutting, pattern |
| `description` | string | Non-empty |
| `linkedPreviewSection` | string or string[] | Each value MUST be S01–S17 |
| `requiredStates` | string[] | State IDs from global-state-display-rules; `[]` only when n/a |
| `requiredTokens` | string[] | Each MUST exist in control.tokens.json |
| `allowedRiskLevels` | string[] | Non-empty |
| `usageRules` | string[] | At least one MUST/SHOULD rule |
| `forbiddenUsage` | string[] | At least one MUST NOT rule |
| `sourceRuleFiles` | string[] | Each path MUST exist relative to repo root |

---

## 4. Token validation rules

A token ID is valid if it appears in either:

1. `control.tokens.json` → `tokens` object keys, OR
2. `control.tokens.json` → `colorPresets.neutral-blue-gray.colors` keys

Valid token prefixes:

- `control.color.*`
- `control.space.*`
- `control.radius.*`
- `control.touch.*`
- `control.type.*` (granular keys only, e.g. `control.type.body.size` — not semantic shorthand)
- `control.opacity.*`
- `control.layout.*`

Typography semantic roles in markdown rules (e.g. `control.type.title`) map to granular token pairs in crosswalk/catalog: `.size` + `.weight` (mono: `.family` + `.size`).

Effect profile keys (dialogInMs, etc.) are NOT referenced directly in component entries — motion is implied via preview S08.

---

## 5. Preview section validation

Valid `linkedPreviewSection` values: **S01** through **S17** as defined in [global-control-design-preview-spec.md](../preview/global-control-design-preview-spec.md).

| Section | Topic |
|---------|-------|
| S01 | Color / Token |
| S02 | Typography |
| S03 | Spacing |
| S04 | Radius / Surface |
| S05 | Button / Action States |
| S06 | Status States |
| S07 | Risk Actions |
| S08 | Confirmation Flows |
| S09 | Permission Gate |
| S10 | Audit History |
| S11 | Module Stack |
| S12 | Action Result / Restore |
| S13 | Terminal / Command |
| S14 | Agent Subsystem |
| S15 | Mobile Device Frame |
| S16 | Version / Meta Footer |
| S17 | Error / Blocked / Offline |

---

## 6. Crosswalk validation rules (manual, P2.0-pre)

For each module in [p2-module-token-crosswalk.md](../p2-module-token-crosswalk.md):

1. `moduleId` MUST exist in p1-ui-modules.proposal.json
2. `requiredComponents` MUST be non-empty
3. `requiredDesignTokens` MUST be non-empty
4. Every `requiredComponents` entry MUST exist in `components[]` or `patterns[]` of control.components.json
5. Every `requiredDesignTokens` entry MUST pass token validation (section 4)
6. Every `linkedPreviewSections` entry MUST be S01–S17
7. `blockingNotes` MUST document any remaining gap; use `—` when none

---

## 7. Catalog inventory (P2.0-pre)

| Type | Count |
|------|-------|
| Components | 29 |
| Patterns | 8 |
| **Total IDs** | **37** |

### Component IDs

`control.component.button.primary`, `control.component.button.secondary`, `control.component.button.danger`, `control.component.card.surface`, `control.component.card.status`, `control.component.moduleSection`, `control.component.moduleSection.header`, `control.component.form.textInput`, `control.component.form.textArea`, `control.component.form.pathInput`, `control.component.form.selectAllowlist`, `control.component.form.toggle`, `control.component.badge.risk`, `control.component.badge.subsystem`, `control.component.badge.count`, `control.component.riskBanner.externalCode`, `control.component.riskBanner.destructive`, `control.component.dialog.confirm`, `control.component.dialog.sheet`, `control.component.permissionGate.wrapper`, `control.component.errorInline`, `control.component.errorBlocked`, `control.component.actionResult.toast`, `control.component.actionResult.detail`, `control.component.skeleton.block`, `control.component.list.auditRow`, `control.component.list.empty`, `control.component.footer.meta`, `control.component.grid.shortcut`

### Pattern IDs

`control.pattern.confirm.destructive`, `control.pattern.confirm.externalCode`, `control.pattern.confirm.restore`, `control.pattern.confirm.normal`, `control.pattern.module.collapsed`, `control.pattern.module.expanded`, `control.pattern.loading.skeleton`, `control.pattern.loading.spinnerInline`

---

## 8. Risk model (P2.0a — four separate concepts)

Bridge uses **four distinct risk fields**. They MUST NOT be conflated in registry, catalog, or runtime code.

| Concept | Field | Where | Values |
|---------|-------|-------|--------|
| API / P0 / audit | `riskClass` | `poc-v1-actions.json` | `read`, `destructive`, `external-code` |
| UI module level | `uiRiskLevel` | `poc-v1-ui-modules.json` per module | See **uiRiskLevelEnum** below |
| Component catalog | `allowedRiskLevels` | `control.components.json` per entry | Subset of uiRiskLevelEnum (excluding `inherit`) |
| UI display | `riskVisibility` | `poc-v1-ui-modules.json` per module | `none`, `badge`, `banner`, `confirmation`, `blocked` |

### uiRiskLevelEnum (Option A — official)

```
n/a | read-only | low | normal | medium | medium-high | high | destructive | external-code | inherit
```

| Value | Meaning |
|-------|---------|
| `n/a` | Cross-cutting shell modules with no direct action risk (permission gate, version info) |
| `read-only` | Display-only modules; no mutating actions |
| `low` | Read-biased or low-impact focus/navigation |
| `normal` | Standard editable module |
| `medium` | Elevated caution; badge visibility typical |
| `medium-high` | Overwrite or elevated write risk; confirmation typical |
| `high` | High-impact command or agent prompt |
| `destructive` | Terminal destructive risk (maps from crosswalk `destructive / high`) |
| `external-code` | Extension install / external code (maps from crosswalk `high / external-code`) |
| `inherit` | Confirmation dialog inherits risk from triggering action |

### API → UI mapping (reference)

| `riskClass` (action) | Typical `uiRiskLevel` | Typical `riskVisibility` |
|----------------------|----------------------|--------------------------|
| `read` | `low` or `read-only` | `none` |
| `destructive` | `destructive` | `confirmation` or `banner` |
| `external-code` | `external-code` | `banner` |

Module `uiRiskLevel` is normalized from crosswalk `riskLevel` in `poc-v1-ui-modules.json`; it is not copied verbatim from proposal text fields.

### Component risk compatibility

When validating `poc-v1-ui-modules.json`, each module's `requiredComponents` entry MUST have `allowedRiskLevels` compatible with the module's `uiRiskLevel`. Validation skips `inherit` and `n/a` module levels. Components whose `allowedRiskLevels` includes `n/a` are risk-agnostic (loading, empty, inline error) and compatible with any module `uiRiskLevel`. Tier compatibility (e.g. `low` with `read-only`, `medium-high` with `medium`) is applied in `ui-modules-registry-validator.ts`.

---

## 9. UI modules registry validation (P2.0a)

**CLI:** [`scripts/validate-ui-modules-registry.js`](../../../scripts/validate-ui-modules-registry.js) — validates [`adapters/cursor/registry/poc-v1-ui-modules.json`](../../../adapters/cursor/registry/poc-v1-ui-modules.json) (requires `@bridge/cursor-adapter` build; run via `npm run validate:ui-modules`).

**Validator source:** [`adapters/cursor/src/validation/ui-modules-registry-validator.ts`](../../../adapters/cursor/src/validation/ui-modules-registry-validator.ts)

**Tests:** [`adapters/cursor/tests/ui-modules-registry.test.ts`](../../../adapters/cursor/tests/ui-modules-registry.test.ts) (Vitest)

Validation rules:

1. Parse `control.components.json` and `control.tokens.json`
2. Parse `poc-v1-ui-modules.json` and cross-check against `p1-ui-modules.proposal.json`
3. Fail if any module has empty `requiredComponents`, `requiredDesignTokens`, `requiredStates`, or `linkedPreviewSections`
4. Fail if any referenced component or token ID is missing
5. Fail if `uiRiskLevel` or `riskVisibility` is outside enum
6. Fail if `designrulesStatus !== consumer-ready`
7. Fail if `viewComposition` separates `moduleOrder` (15) from `crossCuttingModules` (3); total modules = 18
