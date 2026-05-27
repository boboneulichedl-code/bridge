# Global Control Design — Static Preview (D0c)

> **NOT PRODUCT UI** — review gallery only. Bridge is the first use case.

## Open the preview

### Primary — double-click

Open `index.html` in your browser (file://). CSS loads via relative paths `tokens.css` and `preview.css`.

### Alternative — local HTTP server

```bash
cd docs/global-design/control-rules/preview/static
python -m http.server 8765
```

Then open `http://localhost:8765/`

No npm, Vite, or Bridge `web/` dev server required.

## Files

| File | Role |
|------|------|
| `index.html` | Single page — sections S01–S17 |
| `tokens.css` | Manual 1:1 mirror of `../../tokens/control.tokens.json` |
| `preview.css` | Layout and components — only `var(--control-*)` |

## Rules

- Source of truth: `../../tokens/control.tokens.json`
- Hex values are **review defaults** — not CoreAI brand
- Do not deploy or link from `web/` as product UI
- P2 UI implementation is a separate phase

Normative spec: [../global-control-design-preview-spec.md](../global-control-design-preview-spec.md)
