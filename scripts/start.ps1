param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$VenvPython = Join-Path $BackendDir ".venv\Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    throw "Backend environment was not found. Run setup.bat or scripts\setup.ps1 first."
}

if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
    throw "Frontend dependencies were not found. Run setup.bat or scripts\setup.ps1 first."
}

function Test-PortAvailable($Port) {
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return -not $connection
}

if (-not (Test-PortAvailable $BackendPort)) {
    throw "Port $BackendPort is already in use. Stop the existing backend or pass -BackendPort <port>."
}

if (-not (Test-PortAvailable $FrontendPort)) {
    throw "Port $FrontendPort is already in use. Stop the existing frontend or pass -FrontendPort <port>."
}

$backendCommand = "Set-Location '$BackendDir'; '$VenvPython' -m uvicorn app.main:app --host 127.0.0.1 --port $BackendPort"
$frontendCommand = "Set-Location '$FrontendDir'; npm run dev -- --host 127.0.0.1 --port $FrontendPort"
$frontendUrl = "http://127.0.0.1:$FrontendPort"

Write-Host "Starting TrackSure..." -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:$BackendPort"
Write-Host "Frontend: $frontendUrl"
Write-Host ""
Write-Host "Two server windows will open. Keep them open while using the application."

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand
Start-Sleep -Seconds 4

if (-not $NoBrowser) {
    Start-Process $frontendUrl
}

Write-Host ""
Write-Host "TrackSure is starting. If the browser opens before the page is ready, refresh after a few seconds."
