# Run all P0 unit/integration tests (no live Cursor required)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "=== P0 Build ===" -ForegroundColor Cyan
npm run build -w @bridge/shared -w @bridge/cursor-adapter -w bridge-api -w cursor-agent-bridge
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== P0 Tests ===" -ForegroundColor Cyan
npm test -w @bridge/shared
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test -w @bridge/cursor-adapter
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test -w bridge-api
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm test -w cursor-agent-bridge
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n=== P0 tests passed ===" -ForegroundColor Green
