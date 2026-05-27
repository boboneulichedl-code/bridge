# Bridge Overlay — Installation nach %LOCALAPPDATA%\Programs\CoreAI\BridgeOverlay
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Source = Join-Path $Root "release\win-unpacked"
$Target = Join-Path $env:LOCALAPPDATA "Programs\CoreAI\BridgeOverlay"
$Data = Join-Path $env:LOCALAPPDATA "CoreAI\BridgeOverlay"

if (-not (Test-Path (Join-Path $Source "Bridge Overlay.exe"))) {
  Write-Host "Bitte zuerst bauen: npm run pack" -ForegroundColor Yellow
  exit 1
}

Write-Host "Installiere Bridge Overlay nach $Target"
New-Item -ItemType Directory -Force -Path $Target | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Data "cache") | Out-Null

Copy-Item -Path "$Source\*" -Destination $Target -Recurse -Force

$config = Join-Path $Data "config.json"
if (-not (Test-Path $config)) {
  @{
    bridgeUrl = "https://bridge.chatpilot.link"
    apiToken = ""
    pollMs = 2000
    interactive = $true
  } | ConvertTo-Json | Set-Content $config -Encoding UTF8
}

$shortcutDir = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\CoreAI"
New-Item -ItemType Directory -Force -Path $shortcutDir | Out-Null
$Wsh = New-Object -ComObject WScript.Shell
$lnk = $Wsh.CreateShortcut((Join-Path $shortcutDir "Bridge Overlay.lnk"))
$lnk.TargetPath = Join-Path $Target "Bridge Overlay.exe"
$lnk.WorkingDirectory = $Target
$lnk.Save()

Write-Host "Fertig. Start: $Target\Bridge Overlay.exe" -ForegroundColor Green
Write-Host "Config: $config"
