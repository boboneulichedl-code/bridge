# Bridge API v1

Stable HTTP interface for external clients (mobile web, scripts, other apps).

**Base URL:** `http://127.0.0.1:3847/api/v1`

**Auth (optional):** `Authorization: Bearer <BRIDGE_API_TOKEN>`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health + version |
| GET | `/version` | Version + update status |
| GET | `/integrations` | Plugin status |
| GET/POST | `/max-access` | Max Access toggle |
| POST | `/prompt` | `{ prompt, mode?, print? }` |
| POST | `/investigate` | `{ topic, categories? }` |
| POST | `/route` | `{ intent, query? }` |
| POST | `/update/check` | Check for updates |
| POST | `/update/apply` | Build + register version |
| GET | `/jobs/:id` | Job status |

## WebSocket

`ws://127.0.0.1:3847/api/v1/events?token=...`

Events: `connected`, `job.started`, `job.done`, `update.available`, `log`

## Mobile UI

`bridge serve` → http://127.0.0.1:3847/

On phone (same WiFi): use host IP, e.g. `http://192.168.1.x:3847/`
