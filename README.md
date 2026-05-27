# Agent Bridge v2.2

Orchestrierungs-Hub mit **Versionierung**, **Auto-Update**, **REST/WebSocket API** und **Mobile Web UI**.

## Schnellstart

```powershell
cd c:\CoreAI\products\bridge
npm install
npm run build
cd cli && npm link

bridge update sync          # Version registrieren
bridge max-access on        # optional
bridge serve                # API + Mobile UI → http://127.0.0.1:3847
```

## Architektur

```
┌─────────────┐     REST/WS      ┌──────────────┐
│  Mobile Web │ ◄──────────────► │  bridge-api  │
│  (web/)     │                  │  :3847       │
└─────────────┘                  └──────┬───────┘
                                        │
┌─────────────┐                  ┌──────▼───────┐
│  Extension  │                  │  CLI / MCP   │
│  Auto-Update│                  │  agent       │
└─────────────┘                  └──────────────┘
```

## Versionierung & Auto-Update

| Befehl | Wirkung |
|--------|---------|
| `bridge update check` | Vergleicht `bridge.version.json` vs `.cursor/bridge-version.lock` |
| `bridge update apply` | `npm run build` + Lock schreiben |
| `bridge update sync` | Nur Lock aktualisieren |

**Cursor informiert automatisch:**
- Extension prüft beim Start + alle 30 Min
- Hook `sessionStart` meldet Updates
- API/WebSocket Event `update.available`

Setting: `bridge.autoUpdate` (default: `true`)

## API

Siehe [docs/API.md](docs/API.md)

```bash
curl http://127.0.0.1:3847/api/v1/health
curl -X POST http://127.0.0.1:3847/api/v1/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Fix tests","mode":"agent"}'
```

## Mobile Steuerung

1. `bridge serve` auf dem Dev-PC
2. Browser: `http://127.0.0.1:3847/` (oder LAN-IP vom Handy)
3. Tabs: **Prompt** · **Debug** · **Status** · **Setup**

Optional API-Token in Settings setzen (`BRIDGE_API_TOKEN`).

## Pakete

| Paket | Rolle |
|-------|-------|
| `shared/` | Version, Update, API-Contract, Integrations |
| `api/` | REST + WebSocket Server |
| `web/` | Mobile Web App |
| `cli/` | `bridge` Befehle |
| `extension/` | Cursor IDE Integration |
| `mcp-server/` | MCP Tools |

## Lizenz

MIT
