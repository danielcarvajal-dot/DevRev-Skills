#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Install printer drivers on a Windows VM.

.DESCRIPTION
  Enables Print to PDF, installs an INF driver if provided, and optionally
  adds a TCP/IP or IPP printer queue. Safe to re-run.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\install-printer-driver.ps1

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\install-printer-driver.ps1 `
    -PrinterName Office -PortHost 192.168.1.50

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\install-printer-driver.ps1 `
    -InfPath C:\drivers\oemsetup.inf -PrinterName LabPrinter -PortHost 10.0.0.20
#>
[CmdletBinding()]
param(
    [string]$PrinterName,
    [string]$PortHost,
    [int]$PortNumber = 9100,
    [string]$InfPath,
    [string]$DriverName = "Microsoft IPP Class Driver",
    [switch]$SkipPrintToPdf,
    [switch]$TestPage
)

$ErrorActionPreference = "Stop"
function Write-Log([string]$Level, [string]$Message) {
    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    Write-Host "[$Level] $Message"
    Add-Content -Path $env:TEMP\install-printer-driver.log -Value "$ts [$Level] $Message"
}

Write-Log INFO "Starting Windows printer driver install"

if (-not $SkipPrintToPdf) {
    try {
        $feature = Get-WindowsOptionalFeature -Online -FeatureName Printing-PrintToPDFServices-Features -ErrorAction SilentlyContinue
        if ($feature -and $feature.State -ne "Enabled") {
            Write-Log INFO "Enabling Microsoft Print to PDF"
            Enable-WindowsOptionalFeature -Online -FeatureName Printing-PrintToPDFServices-Features -NoRestart | Out-Null
        } else {
            Write-Log INFO "Microsoft Print to PDF already available (or feature query not supported)"
        }
    } catch {
        Write-Log WARN "Could not toggle Print to PDF feature: $($_.Exception.Message)"
    }
}

if ($InfPath) {
    if (-not (Test-Path -LiteralPath $InfPath)) {
        throw "INF file not found: $InfPath"
    }
    Write-Log INFO "Installing driver from $InfPath"
    & pnputil.exe /add-driver $InfPath /install
    if ($LASTEXITCODE -ne 0) {
        throw "pnputil failed with exit code $LASTEXITCODE"
    }
}

if ($PrinterName -and $PortHost) {
    $portName = "IP_$PortHost"
    $existingPort = Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue
    if (-not $existingPort) {
        Write-Log INFO "Creating printer port $portName"
        Add-PrinterPort -Name $portName -PrinterHostAddress $PortHost -PortNumber $PortNumber
    }

    $driverReady = Get-PrinterDriver -Name $DriverName -ErrorAction SilentlyContinue
    if (-not $driverReady) {
        Write-Log INFO "Registering printer driver '$DriverName'"
        try {
            Add-PrinterDriver -Name $DriverName
        } catch {
            Write-Log WARN "Add-PrinterDriver failed for '$DriverName': $($_.Exception.Message)"
            Write-Log WARN "Pass -DriverName with a driver listed by Get-PrinterDriver, or supply -InfPath"
        }
    }

    $existingPrinter = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
    if (-not $existingPrinter) {
        Write-Log INFO "Adding printer $PrinterName"
        Add-Printer -Name $PrinterName -DriverName $DriverName -PortName $portName
    } else {
        Write-Log INFO "Printer '$PrinterName' already exists"
    }

    if ($TestPage) {
        Write-Log INFO "Sending test page to $PrinterName"
        $null = Invoke-CimMethod -InputObject (Get-CimInstance Win32_Printer -Filter "Name='$PrinterName'") -MethodName PrintTestPage
    }
} elseif ($PrinterName -xor $PortHost) {
    throw "Specify both -PrinterName and -PortHost to add a network printer"
}

Write-Log INFO "Installed printer drivers:"
Get-PrinterDriver | Select-Object Name, Manufacturer, PrinterEnvironment | Format-Table -AutoSize | Out-String | Write-Host
Write-Log INFO "Printer queues:"
Get-Printer | Select-Object Name, DriverName, PortName, PrinterStatus | Format-Table -AutoSize | Out-String | Write-Host
Write-Log INFO "Done. Log: $env:TEMP\install-printer-driver.log"
