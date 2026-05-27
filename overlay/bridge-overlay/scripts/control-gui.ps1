param(
  [Parameter(Mandatory=$true)][int]$ProcessId,
  [Parameter(Mandatory=$true)][ValidateSet("click","type","focus")][string]$Action,
  [string]$AutomationId = "",
  [string]$Name = "",
  [string]$Text = ""
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$root = [System.Windows.Automation.AutomationElement]::RootElement
$cond = New-Object System.Windows.Automation.PropertyCondition(
  [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $ProcessId)
$win = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
if (-not $win) { Write-Output '{"ok":false,"error":"window not found"}'; exit 1 }

function Find-Target($el) {
  if ($AutomationId) {
    $c = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::AutomationIdProperty, $AutomationId)
    $hit = $el.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $c)
    if ($hit) { return $hit }
  }
  if ($Name) {
    $c = New-Object System.Windows.Automation.PropertyCondition(
      [System.Windows.Automation.AutomationElement]::NameProperty, $Name)
    $hit = $el.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $c)
    if ($hit) { return $hit }
  }
  return $null
}

$target = Find-Target $win
if (-not $target) { Write-Output '{"ok":false,"error":"element not found"}'; exit 1 }

switch ($Action) {
  "focus" {
    $target.SetFocus() | Out-Null
  }
  "click" {
    $invoke = $target.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
    if ($invoke) { $invoke.Invoke() }
    else {
      $target.SetFocus() | Out-Null
      Add-Type @"
        using System.Runtime.InteropServices;
        public class Mouse {
          [DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e);
        }
"@
      [Mouse]::mouse_event(0x02,0,0,0,0); [Mouse]::mouse_event(0x04,0,0,0,0)
    }
  }
  "type" {
    Add-Type -AssemblyName System.Windows.Forms
    $target.SetFocus() | Out-Null
    Start-Sleep -Milliseconds 50
    [System.Windows.Forms.SendKeys]::SendWait($Text)
  }
}

Write-Output '{"ok":true}'
