param(
    [switch]$Clean
)

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

function Confirm-Action($Message) {
    $answer = Read-Host "$Message [y/N]"
    return $answer -match '^(y|yes)$'
}

function Remove-ConfirmedPath($Path) {
    $resolvedRoot = (Resolve-Path $RootDir).Path
    $resolvedPath = (Resolve-Path $Path).Path

    if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove a path outside the project: $resolvedPath"
    }

    Remove-Item -LiteralPath $resolvedPath -Recurse -Force
}

function Invoke-ProjectCleanup {
    Write-Step "Checking generated caches that can be cleaned"

    $candidates = @()
    $candidates += Get-ChildItem -Path $RootDir -Directory -Recurse -Force -Filter "__pycache__" -ErrorAction SilentlyContinue
    $candidates += Get-ChildItem -Path $BackendDir -File -Recurse -Force -Include "*.pyc" -ErrorAction SilentlyContinue
    $candidates += Get-ChildItem -Path (Join-Path $FrontendDir "dist") -Force -ErrorAction SilentlyContinue
    $candidates += Get-ChildItem -Path (Join-Path $FrontendDir "node_modules\.vite") -Force -ErrorAction SilentlyContinue

    $existing = $candidates | Where-Object { $_ -and (Test-Path $_.FullName) } | Sort-Object FullName -Unique
    if (-not $existing -or $existing.Count -eq 0) {
        Write-Host "No generated caches found."
        return
    }

    Write-Host "The following generated/cache paths are safe to recreate:"
    $existing | ForEach-Object { Write-Host " - $($_.FullName)" }

    if (Confirm-Action "Delete these generated/cache paths now?") {
        $existing | ForEach-Object { Remove-ConfirmedPath $_.FullName }
        Write-Host "Cleanup complete." -ForegroundColor Green
    } else {
        Write-Host "Cleanup skipped."
    }
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

Write-Step "Checking Python"
Invoke-Python @("--version")

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

if ($Clean) {
    Invoke-ProjectCleanup
} else {
    Write-Host ""
    Write-Host "Optional cleanup: run scripts\setup.ps1 -Clean to review generated/cache files before deleting them."
}

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Run start.bat or scripts\start.ps1 to start TrackSure."
