# P0 Manual Testing in Cursor

Automated P0 tests cover Security Gate, Router, Extension handlers, API handler, and Audit redaction **without** a live Cursor IDE. The items below require manual verification in Cursor after loading the Bridge extension.

## Prerequisites

1. Build: `npm run build` (or `scripts/test-p0.ps1` for build + automated tests)
2. Start API: `npm run serve` (default `http://127.0.0.1:3847`)
3. Load **Agent Bridge** extension in Cursor (Extension Development Host or installed VSIX)
4. Confirm IPC handshake file exists in user config (not in repo):
   - Windows: `%APPDATA%\Bridge\bridge-ide-control-handshake.json`
   - macOS/Linux: `~/.bridge/bridge-ide-control-handshake.json` or XDG config
5. IPC token only in user config `ipc-token` — **never** in project or `.cursor/`

## Safe smoke script

```powershell
# Read-only + one blocked terminal test
.\scripts\test-cursor-actions.ps1

# Optional: allowed git status (sends text to IDE terminal — non-destructive)
.\scripts\test-cursor-actions.ps1 -IncludeOptionalGitStatus
```

With API token:

```powershell
$env:BRIDGE_API_TOKEN = "your-token"
.\scripts\test-cursor-actions.ps1 -IncludeOptionalGitStatus
```

## Manual checklist

| # | Test | How | Expected |
|---|------|-----|----------|
| 1 | Extension IPC health | `GET http://127.0.0.1:3848/health` with `X-Bridge-Ipc-Token` from user config | `ok: true`, extension + cursor version |
| 2 | API status via extension | `GET /api/v1/cursor/ide/status` | `methodUsed: extension-api`, workspace/editor data |
| 3 | Extension offline fallback | Stop extension / close IDE host, `GET /api/v1/cursor/ide/status` | `methodUsed: cli`, `extensionUnreachable: true` |
| 4 | Terminal whitelist | `POST /api/v1/cursor/ide/terminal/run` with `npm install`, `confirmed: true` | 403 `ALLOWLIST_VIOLATION` |
| 5 | Allowed terminal | `git status` + `confirmed: true` (extension must be running) | 200, `sent: true` |
| 6 | Command allowlist | Unknown `commandId` | 403 blocked |
| 7 | Extension install | Without `confirmed: true` | 428 `CONFIRMATION_REQUIRED`, `riskClass: external-code` |
| 8 | Audit redaction | `GET /api/v1/cursor/audit?limit=10` after agent prompt | No plaintext prompt/content/command/path |
| 9 | Snapshot restore | `POST /api/v1/cursor/snapshots/{id}/restore` | 501 `ROLLBACK_NOT_AVAILABLE` |
| 10 | Legacy route | `POST /api/v1/prompt` | Still works; response includes `deprecated: true`, `migrateTo: /api/v1/cursor/agent/prompt` |

## Not in P0 manual scope

- Snapshot restore (P0.1)
- Modular UI Renderer / Phase 1
- Interface reader / GUI automation
- Extending terminal whitelist
- `bridge_archive` or `adapters/cursor/cursor/` legacy tree

## Known limitations

- **Agent prompt (action 10)** via API uses CLI (`agent` binary) as primary; Extension fallback is experimental and rejected in Extension IPC for P0.
- **Filesystem fallbacks** only apply when Extension IPC is unreachable and paths pass `BRIDGE_ALLOWED_PATHS`.
- **Circuit breaker** on Extension client opens after repeated IPC failures (~30s cooldown).
- **Live Cursor version** compatibility is checked when Extension health is available; offline CLI fallbacks may omit full IDE state.
- **Audit `debugPreview`** only appears when `BRIDGE_AUDIT_DEBUG=1` (never in production default).
