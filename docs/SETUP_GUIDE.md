# TrackSure Setup Guide

This guide is for installing and running TrackSure on a Windows computer.

## What TrackSure Needs

Before setup, install:

- Python 3.11 or newer
- Node.js 20 or newer
- A modern browser such as Chrome, Edge, or Firefox

## First-Time Setup

1. Copy the full `tracksure` folder to the computer.
2. Open the `tracksure` folder.
3. Double-click `setup.bat`.
4. Wait until the window says `Setup complete`.

The setup script installs backend dependencies, frontend dependencies, and prepares the local data folders.

## Starting the Application

1. Open the `tracksure` folder.
2. Double-click `start.bat`.
3. Two server windows will open.
4. Keep both server windows open while using TrackSure.
5. The browser should open automatically at:

```text
http://127.0.0.1:5173
```

If the browser opens before the app is ready, wait a few seconds and refresh the page.

## Stopping the Application

Close the two server windows that opened when `start.bat` was run.

## Default Local URLs

- Application: `http://127.0.0.1:5173`
- Backend API: `http://127.0.0.1:8000`

## Folder Overview

- `backend`: application server and document generation logic
- `frontend`: user interface
- `data`: client, case, company, and uploaded document data
- `backend/app/templates/word-template`: Word document templates
- `scripts`: setup and startup automation
- `docs`: user and setup documentation

## Moving to Another System

1. Copy the entire `tracksure` folder.
2. Make sure Python and Node.js are installed on the new computer.
3. Run `setup.bat`.
4. Run `start.bat`.

If existing client/case data must be moved, copy the `data` folder as part of the transfer.

## Common Setup Issues

### Python Not Found

Install Python 3.11 or newer and select the option to add Python to PATH during installation.

### Node or npm Not Found

Install Node.js 20 or newer from the official Node.js installer. npm is included with Node.js.

### Page Does Not Open

Run `start.bat` again and keep both server windows open. Then open:

```text
http://127.0.0.1:5173
```

### Backend Error While Generating Documents

Confirm that the Word templates exist under:

```text
backend/app/templates/word-template
```

Also confirm that the required case stages are completed before generating documents.
