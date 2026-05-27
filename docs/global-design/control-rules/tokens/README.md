# Global Control Design — Tokens

> **Global** control UI tokens. Bridge is only the first use case.

## Files

| File | Role |
|------|------|
| `control.tokens.json` | **Source of truth** for preset/profile architecture and token values |
| `../preview/static/tokens.css` | Manual 1:1 mirror for static preview (no generator in D0c) |

## Sync rule

1. Values in `control.tokens.json` win on any mismatch.
2. `tokens.css` MUST mirror `colorPresets.neutral-blue-gray.colors` and `tokens.*` exactly.
3. Do not add free colors/spacing/radii in `tokens.css` beyond mirrored variables.

## Review defaults

Hex values in `neutral-blue-gray` are **D0c review defaults only** — not CoreAI brand, not final brand. If D0c review rejects contrast or aesthetics, change values in a dedicated correction pass (JSON + `tokens.css` only).

## Presets and profiles

| ID | Purpose |
|----|---------|
| `neutral-blue-gray` | Default color preset (locked for D0c) |
| `brand-placeholder` | Empty — user supplies brand hex when needed |
| `elevation-profile-a` | none / raised / overlay / modal |
| `device-profile-default-a` | 412×915 review frame (locked) |
| `effect-profile-default-a` | Dialog motion 200ms in / 150ms out |

Normative decisions: [../global-control-design-decisions-d0.1.md](../global-control-design-decisions-d0.1.md)
