$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$VenvDir = Join-Path $BackendDir ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"

function Write-Step($Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Python($Arguments) {
    $pyLauncher = Get-Command py -ErrorAction SilentlyContinue
    if ($pyLauncher) {
        & py -3 @Arguments
        return
    }

    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        & python @Arguments
        return
    }

    throw "Python 3 was not found. Install Python 3.11+ and run this setup again."
}

Write-Host "TrackSure setup" -ForegroundColor Green
Write-Host "Project: $RootDir"

Write-Step "Checking Node.js"
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    throw "Node.js was not found. Install Node.js 20+ and run this setup again."
}
node --version

Write-Step "Checking npm"
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    throw "npm was not found. Install Node.js with npm and run this setup again."
}
npm --version

Write-Step "Creating backend virtual environment"
if (-not (Test-Path $VenvPython)) {
    Invoke-Python @("-m", "venv", $VenvDir)
}

Write-Step "Installing backend dependencies"
& $VenvPython -m pip install --upgrade pip
& $VenvPython -m pip install -r (Join-Path $BackendDir "requirements.txt")

Write-Step "Installing frontend dependencies"
Push-Location $FrontendDir
npm install
Pop-Location

Write-Step "Preparing data folders"
New-Item -ItemType Directory -Force -Path (Join-Path $RootDir "data") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $RootDir "data\uploads") | Out-Null

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Run start.bat or scripts\start.ps1 to start TrackSure."
