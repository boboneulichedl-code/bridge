param(
  [ValidateSet("foreground", "pid")]
  [string]$Mode = "foreground",
  [int]$ProcessId = 0,
  [switch]$FingerprintOnly
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

function Get-WindowElement {
  param([int]$Pid)
  $root = [System.Windows.Automation.AutomationElement]::RootElement
  $cond = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ProcessIdProperty, $Pid)
  return $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $cond)
}

function Get-Rect($rect) {
  if ($null -eq $rect -or $rect.Width -le 0) { return @{ x=0; y=0; width=0; height=0 } }
  @{ x=[int]$rect.X; y=[int]$rect.Y; width=[int]$rect.Width; height=[int]$rect.Height }
}

function Walk-Node($el, $depth) {
  if ($depth -gt 8) { return $null }
  $rect = $el.Current.BoundingRectangle
  if ($rect.Width -lt 2 -or $rect.Height -lt 2) { return $null }
  $node = [ordered]@{
    id = $el.Current.NativeWindowHandle.ToString() + ":" + $el.Current.AutomationId + ":" + $depth
    name = $el.Current.Name
    controlType = $el.Current.ControlType.ProgrammaticName -replace "ControlType\.",""
    automationId = $el.Current.AutomationId
    className = $el.Current.ClassName
    bounds = Get-Rect $rect
    enabled = $el.Current.IsEnabled
    visible = -not $el.Current.IsOffscreen
    children = @()
  }
  if (-not $FingerprintOnly) {
    $children = @()
    foreach ($child in $el.FindAll([System.Windows.Automation.TreeScope]::Children,
      [System.Windows.Automation.Condition]::TrueCondition)) {
      $c = Walk-Node $child ($depth + 1)
      if ($null -ne $c) { $children += $c }
    }
    $node.children = $children
  }
  return $node
}

function Fingerprint($nodes) {
  $parts = @()
  function Walk($n) {
    $parts += "$($n.automationId)|$($n.controlType)|$($n.name)|$($n.bounds.x),$($n.bounds.y),$($n.bounds.width),$($n.bounds.height)|$($n.children.Count)"
    foreach ($c in $n.children) { Walk $c }
  }
  foreach ($n in $nodes) { Walk $n }
  $bytes = [System.Text.Encoding]::UTF8.GetBytes(($parts -join "`n"))
  $sha = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
  -join ($sha[0..7] | ForEach-Object { $_.ToString("x2") })
}

Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class Win32Win {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll", SetLastError=true, CharSet=CharSet.Auto)] public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

$fg = [Win32Win]::GetForegroundWindow()
[uint32]$pid = 0
[void][Win32Win]::GetWindowThreadProcessId($fg, [ref]$pid)
$proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
$sbTitle = New-Object System.Text.StringBuilder 512
$sbClass = New-Object System.Text.StringBuilder 256
[void][Win32Win]::GetWindowText($fg, $sbTitle, 512)
[void][Win32Win]::GetClassName($fg, $sbClass, 256)
$wr = New-Object Win32Win+RECT
[void][Win32Win]::GetWindowRect($fg, [ref]$wr)

$win = [ordered]@{
  processId = [int]$pid
  processName = if ($proc) { $proc.ProcessName } else { "unknown" }
  title = $sbTitle.ToString()
  className = $sbClass.ToString()
  bounds = @{ x=$wr.Left; y=$wr.Top; width=$wr.Right-$wr.Left; height=$wr.Bottom-$wr.Top }
}

$el = Get-WindowElement -Pid $pid
$nodes = @()
if ($el) {
  foreach ($child in $el.FindAll([System.Windows.Automation.TreeScope]::Children,
    [System.Windows.Automation.Condition]::TrueCondition)) {
    $n = Walk-Node $child 0
    if ($null -ne $n) { $nodes += $n }
  }
}

$fp = Fingerprint $nodes
$result = [ordered]@{
  window = $win
  fingerprint = $fp
  nodes = if ($FingerprintOnly) { @() } else { $nodes }
}

$result | ConvertTo-Json -Depth 20 -Compress
