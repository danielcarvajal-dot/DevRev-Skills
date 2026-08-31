#Requires -Version 5.1
<#
.SYNOPSIS
  Shut down Firefox on a Windows VM.

.DESCRIPTION
  Stops firefox.exe and related Mozilla processes. Tries a graceful CloseMainWindow
  first, then optionally force-kills leftovers. Safe to re-run.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\shutdown-firefox.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\shutdown-firefox.ps1 -Force -Timeout 5
#>
[CmdletBinding()]
param(
    [int]$Timeout = 10,
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$names = @("firefox", "firefox-esr", "firefoxdeveloperedition")

function Get-FirefoxProcesses {
    Get-Process -ErrorAction SilentlyContinue |
        Where-Object {
            $names -contains $_.ProcessName.ToLowerInvariant() -or
            $_.Path -like "*\Mozilla Firefox\*" -or
            $_.Path -like "*\Firefox*\firefox.exe"
        }
}

$procs = @(Get-FirefoxProcesses)
if ($procs.Count -eq 0) {
    Write-Host "[OK] Firefox is not running"
    exit 0
}

foreach ($p in $procs) {
    Write-Host "[INFO] found Firefox pid $($p.Id) ($($p.ProcessName))"
    if ($DryRun) {
        Write-Host "[INFO] dry-run: would stop pid $($p.Id)"
        continue
    }
    try {
        $null = $p.CloseMainWindow()
    } catch {
        Write-Host "[WARN] CloseMainWindow failed for pid $($p.Id): $($_.Exception.Message)"
    }
}

if ($DryRun) {
    Write-Host "[INFO] dry-run complete; $($procs.Count) process(es) would be stopped"
    exit 0
}

$deadline = (Get-Date).AddSeconds($Timeout)
do {
    Start-Sleep -Milliseconds 200
    $alive = @(Get-FirefoxProcesses)
} while ($alive.Count -gt 0 -and (Get-Date) -lt $deadline)

if ($alive.Count -eq 0) {
    Write-Host "[OK] Firefox shut down"
    exit 0
}

if ($Force) {
    Write-Host "[WARN] Firefox still running after ${Timeout}s; force-stopping"
    $alive | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 300
    $still = @(Get-FirefoxProcesses)
    if ($still.Count -gt 0) {
        throw "Firefox did not exit after force-stop (pids: $($still.Id -join ', '))"
    }
    Write-Host "[OK] Firefox force-stopped"
    exit 0
}

throw "Firefox still running after ${Timeout}s (pids: $($alive.Id -join ', ')). Re-run with -Force."
