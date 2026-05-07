$ErrorActionPreference = "Stop"

$RootDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"
$LogsDir = Join-Path $RootDir "logs"

$BackendPython = Join-Path $BackendDir ".venv\Scripts\python.exe"
$FrontendUrl = "http://127.0.0.1:5173"
$BackendUrl = "http://127.0.0.1:8000"

New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null

$RunId = Get-Date -Format "yyyyMMdd-HHmmss"
$StartupLog = Join-Path $LogsDir "startup.log"
$BackendOutLog = Join-Path $LogsDir "backend-$RunId.out.log"
$BackendErrLog = Join-Path $LogsDir "backend-$RunId.err.log"
$FrontendOutLog = Join-Path $LogsDir "frontend-$RunId.out.log"
$FrontendErrLog = Join-Path $LogsDir "frontend-$RunId.err.log"

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public sealed class ProcessJob : IDisposable
{
    [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
    private static extern IntPtr CreateJobObject(IntPtr lpJobAttributes, string lpName);

    [DllImport("kernel32.dll")]
    private static extern bool SetInformationJobObject(IntPtr hJob, int jobObjectInfoClass, IntPtr lpJobObjectInfo, uint cbJobObjectInfoLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool AssignProcessToJobObject(IntPtr job, IntPtr process);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    [StructLayout(LayoutKind.Sequential)]
    private struct JOBOBJECT_BASIC_LIMIT_INFORMATION
    {
        public long PerProcessUserTimeLimit;
        public long PerJobUserTimeLimit;
        public uint LimitFlags;
        public UIntPtr MinimumWorkingSetSize;
        public UIntPtr MaximumWorkingSetSize;
        public uint ActiveProcessLimit;
        public long Affinity;
        public uint PriorityClass;
        public uint SchedulingClass;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct IO_COUNTERS
    {
        public ulong ReadOperationCount;
        public ulong WriteOperationCount;
        public ulong OtherOperationCount;
        public ulong ReadTransferCount;
        public ulong WriteTransferCount;
        public ulong OtherTransferCount;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
    {
        public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
        public IO_COUNTERS IoInfo;
        public UIntPtr ProcessMemoryLimit;
        public UIntPtr JobMemoryLimit;
        public UIntPtr PeakProcessMemoryUsed;
        public UIntPtr PeakJobMemoryUsed;
    }

    private const int JobObjectExtendedLimitInformation = 9;
    private const uint JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000;
    private IntPtr handle;

    public ProcessJob()
    {
        handle = CreateJobObject(IntPtr.Zero, null);
        var info = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION();
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

        int length = Marshal.SizeOf(typeof(JOBOBJECT_EXTENDED_LIMIT_INFORMATION));
        IntPtr infoPtr = Marshal.AllocHGlobal(length);
        try
        {
            Marshal.StructureToPtr(info, infoPtr, false);
            SetInformationJobObject(handle, JobObjectExtendedLimitInformation, infoPtr, (uint)length);
        }
        finally
        {
            Marshal.FreeHGlobal(infoPtr);
        }
    }

    public void AddProcess(System.Diagnostics.Process process)
    {
        if (!AssignProcessToJobObject(handle, process.Handle))
        {
            throw new System.ComponentModel.Win32Exception();
        }
    }

    public void Dispose()
    {
        if (handle != IntPtr.Zero)
        {
            CloseHandle(handle);
            handle = IntPtr.Zero;
        }
    }
}
"@

function Write-StartupLog($Message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $StartupLog -Value "[$timestamp] $Message"
}

function Stop-ServerProcess($Process, $Name) {
    if ($Process -and -not $Process.HasExited) {
        Write-Host "Stopping $Name..."
        Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
    }
}

$job = $null
$backendProcess = $null
$frontendProcess = $null

try {
    Write-Host "Starting KinDesk..." -ForegroundColor Green
    Write-Host "Project:  $RootDir"
    Write-Host "Backend:  $BackendUrl"
    Write-Host "Frontend: $FrontendUrl"
    Write-Host ""
    Write-Host "Keep this window open while using KinDesk."
    Write-Host "Close this window, or press Ctrl+C, to stop backend and frontend."
    Write-Host ""

    Write-StartupLog "Starting KinDesk from $RootDir"

    if (-not (Test-Path $BackendPython)) {
        throw "Backend Python was not found at $BackendPython. Run setup.bat first."
    }

    if (-not (Test-Path (Join-Path $FrontendDir "node_modules"))) {
        throw "Frontend dependencies were not found. Run setup.bat first."
    }

    $job = [ProcessJob]::new()

    $backendProcess = Start-Process `
        -FilePath $BackendPython `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000") `
        -WorkingDirectory $BackendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $BackendOutLog `
        -RedirectStandardError $BackendErrLog `
        -PassThru
    $job.AddProcess($backendProcess)
    Write-Host "Backend started. Log: $BackendErrLog"

    Start-Sleep -Seconds 2

    $frontendProcess = Start-Process `
        -FilePath "npm.cmd" `
        -ArgumentList @("run", "dev", "--", "--host", "127.0.0.1", "--port", "5173") `
        -WorkingDirectory $FrontendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $FrontendOutLog `
        -RedirectStandardError $FrontendErrLog `
        -PassThru
    $job.AddProcess($frontendProcess)
    Write-Host "Frontend started. Log: $FrontendErrLog"

    Start-Sleep -Seconds 4
    Start-Process $FrontendUrl

    Write-StartupLog "KinDesk started. Frontend: $FrontendUrl Backend: $BackendUrl"
    Write-Host ""
    Write-Host "KinDesk is running. Close this window to stop it." -ForegroundColor Green

    while ($true) {
        if ($backendProcess.HasExited) {
            throw "Backend stopped unexpectedly. Check $BackendErrLog"
        }
        if ($frontendProcess.HasExited) {
            throw "Frontend stopped unexpectedly. Check $FrontendErrLog"
        }
        Start-Sleep -Seconds 2
    }
} catch {
    Write-StartupLog "Startup/runtime stopped: $($_.Exception.Message)"
    Write-Host ""
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Logs are in: $LogsDir"
    Start-Sleep -Seconds 3
} finally {
    Stop-ServerProcess $frontendProcess "frontend"
    Stop-ServerProcess $backendProcess "backend"
    if ($job) {
        $job.Dispose()
    }
    Write-StartupLog "KinDesk stopped"
}
