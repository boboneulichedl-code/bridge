# @bridge/ui Preview Gallery

**NOT PRODUCT UI** — Global Control Design Review Only.

This Vite host is a design-rule review artifact. It is not the Bridge Mobile App and is not linked from `web/`.

## Run

From repo root:

```bash
npm run preview:dev -w @bridge/ui
```

Build static preview:

```bash
npm run preview:build -w @bridge/ui
```

## Sections

- S01–S05: full foundation coverage
- S06, S11, S15: basics (full spec gaps documented for P2.1a)

## Rules

- All styling via `control.*` tokens / CSS variables
- No imports from `web/`, `preview/static/`, or Cursor adapters
