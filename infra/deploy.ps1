# Bridge production deploy (PowerShell)
param(
  [string]$SshKey = "C:\CoreAI\secure\ssh\chatpilot-link\chatpilot-link-admin-key-01.pem",
  [string]$DeployHost = "ubuntu@179.237.68.196",
  [string]$RemoteDir = "/opt/bridge",
  [string]$Gateway = "chatpilot-link-gateway"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path $SshKey)) {
  throw "SSH key not found: $SshKey"
}

function Invoke-Ssh([string]$Command) {
  & ssh -i $SshKey -o StrictHostKeyChecking=no $DeployHost $Command
  if ($LASTEXITCODE -ne 0) { throw "SSH failed: $Command" }
}

function Invoke-Scp([string]$Local, [string]$Remote) {
  & scp -i $SshKey -o StrictHostKeyChecking=no $Local "${DeployHost}:$Remote"
  if ($LASTEXITCODE -ne 0) { throw "SCP failed: $Local -> $Remote" }
}

Write-Host "==> Preparing remote directory"
Invoke-Ssh "sudo mkdir -p $RemoteDir && sudo chown ubuntu:ubuntu $RemoteDir"

Write-Host "==> Creating deployment archive"
$Archive = Join-Path $env:TEMP "bridge-deploy.tar"
if (Test-Path $Archive) { Remove-Item $Archive -Force }

Push-Location $Root
try {
  & tar -cf $Archive `
    --exclude=node_modules `
    --exclude=.git `
    --exclude=extension/dist `
    --exclude=.cursor `
    .
} finally {
  Pop-Location
}

Write-Host "==> Uploading archive"
Invoke-Scp $Archive "/tmp/bridge-deploy.tar"
Invoke-Ssh "tar -xf /tmp/bridge-deploy.tar -C $RemoteDir && rm -f /tmp/bridge-deploy.tar"

Write-Host "==> Configuring environment"
$TokenLine = Invoke-Ssh "test -f $RemoteDir/infra/.env && grep ^BRIDGE_API_TOKEN= $RemoteDir/infra/.env || true"
$Token = if ($TokenLine -match 'BRIDGE_API_TOKEN=(.+)') { $Matches[1].Trim() } else { $null }
if (-not $Token) {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  $Token = [BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

$EnvContent = @"
NODE_ENV=production
BRIDGE_API_HOST=0.0.0.0
BRIDGE_API_PORT=3847
BRIDGE_API_TOKEN=$Token
BRIDGE_MAX_ACCESS=1
BRIDGE_PUBLIC_URL=https://bridge.chatpilot.link
"@

$EnvFile = Join-Path $env:TEMP "bridge.env"
Set-Content -Path $EnvFile -Value $EnvContent -NoNewline
Invoke-Scp $EnvFile "$RemoteDir/infra/.env"

Write-Host "==> Building and starting Docker container"
Invoke-Ssh "cd $RemoteDir/infra && docker compose -f docker-compose.prod.yml up -d --build"

Write-Host "==> Installing nginx vhost"
Invoke-Scp (Join-Path $Root "infra\nginx\bridge.chatpilot.link.conf") "/tmp/bridge.chatpilot.link.conf"
Invoke-Ssh "sudo cp /tmp/bridge.chatpilot.link.conf /opt/chatpilot-link-sync/nginx/conf.d/bridge.chatpilot.link.conf"

Write-Host "==> Expanding TLS certificate"
Invoke-Ssh "sudo certbot certonly --webroot -w /var/www/certbot --non-interactive --agree-tos --expand -d chatpilot.link -d www.chatpilot.link -d design.chatpilot.link -d bridge.chatpilot.link --cert-name chatpilot.link 2>&1 || true"

Write-Host "==> Connecting gateway to bridge network"
Invoke-Ssh "docker network connect chatpilot-link-sync_chatpilot-net $Gateway 2>/dev/null || true"

Write-Host "==> Reloading nginx"
Invoke-Ssh "docker exec $Gateway nginx -t && docker exec $Gateway nginx -s reload"

Write-Host "==> Waiting for health check"
Start-Sleep -Seconds 5
try {
  Invoke-Ssh "docker exec $Gateway wget -qO- http://bridge-api:3847/api/v1/health"
} catch {
  Write-Host "Internal health check pending; verify HTTPS endpoint manually."
}

Write-Host ""
Write-Host "Deploy complete."
Write-Host "  URL:   https://bridge.chatpilot.link/"
Write-Host "  API:   https://bridge.chatpilot.link/api/v1/health"
Write-Host "  Token: $Token"
Write-Host "  Save token in mobile app Settings -> API Token"
