# TrackSure

TrackSure is a local web application for managing client cases, stage documents, and document generation for Duplicate, Transmission, and Joint processes.

## Quick Start on Windows

1. Install Python 3.11+.
2. Install Node.js 20+.
3. Double-click `kindesk-setup.bat`.
4. Double-click `kindesk.bat`.
5. Open `http://127.0.0.1:5173` if the browser does not open automatically.

Keep the two server windows open while using the application.

## Documentation

- Setup guide: [docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)
- User manual: [docs/USER_MANUAL.md](docs/USER_MANUAL.md)

## Developer Commands

Backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

Build frontend:

```powershell
cd frontend
npm run build
```
