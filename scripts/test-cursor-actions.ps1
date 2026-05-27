# Bridge Cursor P0 — safe manual smoke tests
# Requires: Bridge API running (default http://127.0.0.1:3847)
# Optional: Extension loaded in Cursor for /ide/status via IPC
param(
  [string]$Base = "http://127.0.0.1:3847",
  [string]$Token = $env:BRIDGE_API_TOKEN,
  [switch]$IncludeOptionalGitStatus
)

$ErrorActionPreference = "Stop"

$headers = @{ "Content-Type" = "application/json" }
if ($Token) { $headers["Authorization"] = "Bearer $Token" }

function Invoke-Bridge {
  param(
    [string]$Label,
    [string]$Method,
    [string]$Path,
    [object]$Body,
    [int[]]$ExpectStatus = @(200)
  )
  Write-Host "`n== $Label ==" -ForegroundColor Cyan
  $uri = "$Base$Path"
  try {
    if ($Body) {
      $response = Invoke-WebRequest -Method $Method -Uri $uri -Headers $headers -Body ($Body | ConvertTo-Json) -UseBasicParsing
    } else {
      $response = Invoke-WebRequest -Method $Method -Uri $uri -Headers $headers -UseBasicParsing
    }
    if ($ExpectStatus -notcontains $response.StatusCode) {
      throw "Unexpected status $($response.StatusCode), expected $($ExpectStatus -join ',')"
    }
    $response.Content | Write-Host
    return ($response.Content | ConvertFrom-Json)
  } catch {
    if ($_.Exception.Response) {
      $code = [int]$_.Exception.Response.StatusCode
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $body = $reader.ReadToEnd()
      if ($ExpectStatus -contains $code) {
        Write-Host "Expected status $code" -ForegroundColor Yellow
        $body | Write-Host
        return ($body | ConvertFrom-Json)
      }
    }
    throw
  }
}

Write-Host "Bridge Cursor P0 smoke — $Base" -ForegroundColor Green

Invoke-Bridge -Label "GET registry" -Method GET -Path "/api/v1/cursor/registry"
Invoke-Bridge -Label "GET version" -Method GET -Path "/api/v1/cursor/version"
Invoke-Bridge -Label "GET ide/status" -Method GET -Path "/api/v1/cursor/ide/status"

Invoke-Bridge -Label "POST terminal/run blocked (npm install)" -Method POST -Path "/api/v1/cursor/ide/terminal/run" -Body @{
  command   = "npm install"
  confirmed = $true
} -ExpectStatus @(403)

if ($IncludeOptionalGitStatus) {
  Invoke-Bridge -Label "POST terminal/run allowed (git status)" -Method POST -Path "/api/v1/cursor/ide/terminal/run" -Body @{
    command      = "git status"
    confirmed    = $true
    terminalName = "bridge-smoke"
  }
}

Write-Host "`nSmoke tests completed." -ForegroundColor Green
Write-Host "Optional: load Extension in Cursor and re-run GET /ide/status to verify IPC path."
