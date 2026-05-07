# TrackSure Setup Guide

This guide explains how to install, configure, start, stop, and maintain TrackSure on a Windows workstation.

![Dashboard](assets/01-dashboard.png)

## 1. Prerequisites

Install these before running setup:

- Windows 10/11
- Python 3.11 or newer
- Node.js 20 or newer, including npm
- Microsoft Edge, Chrome, Firefox, or another modern browser
- Network access only for the first dependency installation

Recommended checks:

```powershell
python --version
node --version
npm --version
```

## 2. Project Folders

- `backend`: FastAPI server, APIs, validation, document generation, and Word templates
- `frontend`: React/Vite user interface
- `data`: local JSON data, Excel company master, and uploaded documents
- `data/kindesk_companies.xlsx`: source workbook for companies and RTAs
- `scripts`: setup and startup PowerShell scripts
- `docs`: setup/user documentation, screenshots, and exported PDFs

The application now reads companies and RTAs directly from `data/kindesk_companies.xlsx`:

- Sheet `companies_master`
- Sheet `rta_master`

The old `companies_master.json` and `rta_master.json` are no longer used by the backend.

## 3. First-Time Setup

From the project root:

```powershell
.\setup.bat
```

Or run PowerShell directly:

```powershell
.\scripts\setup.ps1
```

Setup performs these actions:

- Verifies Node.js, npm, and Python
- Creates `backend\.venv` if missing
- Installs backend dependencies from `backend\requirements.txt`
- Installs frontend dependencies from `frontend\package.json`
- Creates `data` and `data\uploads` folders if missing

## 4. Optional Cleanup

Generated caches are not deleted automatically. To review and confirm cleanup:

```powershell
.\scripts\setup.ps1 -Clean
```

The script lists generated/cache folders such as `__pycache__`, `.pyc`, `frontend\dist`, and Vite cache files, then asks before deletion.

## 5. Starting TrackSure

From the project root:

```powershell
.\start.bat
```

Or:

```powershell
.\scripts\start.ps1
```

Default URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`

The startup script checks whether the ports are free before launching the backend and frontend windows.

## 6. Custom Ports

Use custom ports when defaults are already occupied:

```powershell
.\scripts\start.ps1 -BackendPort 8010 -FrontendPort 5174
```

Skip automatic browser launch:

```powershell
.\scripts\start.ps1 -NoBrowser
```

## 7. Upload Configuration

Allowed upload file types:

- `.pdf`
- `.docx`
- `.xlsx`
- `.jpeg`
- `.jpg`
- `.png`
- `.txt`

The default upload size limit is 10 MB. Override it before starting the backend:

```powershell
$env:TRACKSURE_MAX_UPLOAD_MB = "5"
.\scripts\start.ps1
```

Duplicate filenames are blocked:

- Client files cannot repeat within the same client.
- Case stage, query, and miscellaneous files cannot repeat within the same case.
- Replacement uploads may keep the same filename as the document being replaced.

## 8. Stopping TrackSure

Close the backend and frontend server windows opened by the startup script.

If a hidden/manual server is running, stop the matching `python` or `node` process from Task Manager or your terminal.

## 9. Verification Commands

Backend import check:

```powershell
$env:PYTHONDONTWRITEBYTECODE = "1"
$env:PYTHONPATH = "backend"
python -c "import app.main; print('backend imports ok')"
```

Frontend checks:

```powershell
cd frontend
npm run lint
npm run build
```

## 10. Troubleshooting

Python not found:

- Install Python 3.11+.
- Enable "Add Python to PATH" during installation.

Node or npm not found:

- Install Node.js 20+ from the official installer.
- Reopen the terminal after installation.

Backend upload errors:

- Confirm `python-multipart` is installed via setup.
- Check file extension and file size.
- Rename files if the same filename already exists for that client/case.

Company list is empty:

- Confirm `data/kindesk_companies.xlsx` exists.
- Confirm sheets are named `companies_master` and `rta_master`.
- Confirm header names match `company_id`, `company_name`, `company_address`, `rta_id`, `rta_name`, and `rta_address`.

Frontend page does not load:

- Confirm backend is on `http://127.0.0.1:8000`.
- Confirm frontend is on `http://127.0.0.1:5173`.
- Run `npm run build` to catch frontend errors.
