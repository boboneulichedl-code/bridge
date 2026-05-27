---
name: agent-bridge
description: Steuere den Cursor-Agent und orchestriere MCP-Plugins (GitHub, Notion, Linear, Sentry, Datadog, Vercel, Browse, Android). Nutze bei Agent-Steuerung, Shortcuts, CLI, Multi-Source Debugging, Errors, Logs, Git, Tabellen, Logcat.
---

# Agent Bridge v2 — Orchestration Hub

Bridge verbindet Agent-Steuerung mit allen MCP-Plugins.

## MCP-Tools (agent-bridge)

| Tool | Zweck |
|------|-------|
| `bridge_list_integrations` | Alle Plugins + Konfig-Status |
| `bridge_route` | Intent → MCP-Tools + lokale Schritte |
| `bridge_investigate` | Multi-Source Debugging-Plan |
| `bridge_integration_guide` | Setup + Tools pro Plugin |
| `bridge_mcp_manifest` | Empfohlene mcp.json-Einträge |
| `bridge_send_prompt` | Prompt an Agent (CLI) |

## Unterstützte Integrationen

| ID | Plugin | Für |
|----|--------|-----|
| `git-local` | builtin | git status/diff/log |
| `ide-lints` | builtin | ReadLints |
| `github` | GitHub MCP | PRs, CI, Issues |
| `notion` | Notion | Tabellen, DBs |
| `linear` | Linear | Issues, Tasks |
| `sentry` | Sentry MCP | Prod-Errors, Stack traces |
| `datadog` | Datadog | Logs, Metriken, Traces |
| `vercel` | Vercel | Build/Runtime Logs |
| `browse` | Browse | Web, Netzwerk |
| `android` | android-pilot | Logcat, Lint, ADB |
| `launchdarkly` | LaunchDarkly | Feature Flags |
| `figma` | Figma | Design-Kontext |

## Workflow: Multi-Source Debugging

```
1. bridge_list_integrations
2. bridge_investigate topic="…"
3. Parallel MCP-Tools aus Plan aufrufen
4. Lokal: ReadLints + git
5. Ergebnisse zusammenführen
```

## CLI

```bash
bridge plugins list
bridge plugins guide sentry
bridge route errors "login bug"
bridge investigate "CI failing on main"
bridge plugins install-mcp    # agent-bridge in ~/.cursor/mcp.json
bridge manifest               # empfohlene MCP-Einträge
```

## Extension

- `Ctrl+Alt+Shift+I` — Multi-Source Untersuchung
- **Bridge: Integrationen anzeigen**
- Registriert `agent-bridge` MCP via `vscode.cursor.mcp`

## Marketplace-Plugins installieren

Cursor Settings → Plugins → installieren + OAuth:

Notion, Linear, Vercel, Datadog, Browse, Figma, LaunchDarkly, GitHub, Sentry

Optional in mcp.json: `android-pilot` (npx android-pilot-mcp)

## Orchestration Rule

`.cursor/rules/bridge-orchestration.mdc` — aktiviert bei Error/Log/Git-Untersuchungen.
