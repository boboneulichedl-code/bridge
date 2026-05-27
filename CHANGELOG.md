# Changelog

## [2.2.0] — 2026-05-27

### Added
- **Versionierung**: `bridge.version.json`, semver-Vergleich, Version-Lock
- **Auto-Update**: `bridge update check|apply|sync`, Extension-Benachrichtigung, sessionStart-Hook
- **REST API** `/api/v1/*` + WebSocket `/api/v1/events`
- **Mobile Web App** — Bridge Control UI (Prompt, Investigate, Status, Settings)
- **CLI** `bridge serve` — startet API + Web UI

### Changed
- Monorepo um `api/` und `web/` erweitert
- Sauberer API-Contract in `@bridge/shared`

## [2.1.0]

- Max Access Modus (Auto-Submit, Force, Hooks)

## [2.0.0]

- MCP-Orchestrierung für GitHub, Notion, Sentry, etc.

## [1.0.0]

- Initial: Extension, CLI, MCP
