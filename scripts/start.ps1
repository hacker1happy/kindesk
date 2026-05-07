$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$LogsDir = Join-Path $RootDir "logs"

$BackendPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$FrontendUrl = "http://127.0.0.1:5173"

New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null

$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$StartupLog = Join-Path $LogsDir "startup.log"
$BackendOutLog = Join-Path $LogsDir "backend-$RunId.out.log"
$BackendErrLog = Join-Path $LogsDir "backend-$RunId.err.log"
$FrontendOutLog = Join-Path $LogsDir "frontend-$RunId.out.log"
$FrontendErrLog = Join-Path $LogsDir "frontend-$RunId.err.log"

function Write-StartupLog($Message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $StartupLog -Value "[$timestamp] $Message"
}

try {
    Write-StartupLog "Starting KinDesk from $RootDir"

    if (-not (Test-Path $BackendPython)) {
        throw "Backend Python was not found at $BackendPython. Run setup.bat first."
    }

    if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
        throw "Frontend dependencies were not found. Run setup.bat first."
    }

    Start-Process `
        -FilePath $BackendPython `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
        -WorkingDirectory $BackendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $BackendOutLog `
        -RedirectStandardError $BackendErrLog

    Start-Sleep -Seconds 2

    Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "5173") `
        -WorkingDirectory $FrontendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $FrontendOutLog `
        -RedirectStandardError $FrontendErrLog

    Start-Sleep -Seconds 4
    Start-Process $FrontendUrl

    Write-StartupLog "KinDesk started. Frontend: $FrontendUrl Backend: http://127.0.0.1:8000"
} catch {
    Write-StartupLog "Startup failed: $($_.Exception.Message)"
    throw
}
