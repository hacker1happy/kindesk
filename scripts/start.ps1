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

$backendCommand = "Set-Location '$BackendDir'; '$VenvPython' -m uvicorn app.main:app --host 127.0.0.1 --port 8000"
$frontendCommand = "Set-Location '$FrontendDir'; npm run dev -- --host 127.0.0.1 --port 5173"

Write-Host "Starting TrackSure..." -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://127.0.0.1:5173"
Write-Host ""
Write-Host "Two server windows will open. Keep them open while using the application."

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $backendCommand
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $frontendCommand
Start-Sleep -Seconds 4

Start-Process "http://127.0.0.1:5173"

Write-Host ""
Write-Host "TrackSure is starting. If the browser opens before the page is ready, refresh after a few seconds."
