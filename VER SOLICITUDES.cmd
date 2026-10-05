@echo off
cd /d "%~dp0"
set "SV_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "SV_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
"%SV_NODE%" scripts/export-requests.mjs
if errorlevel 1 (
  pause
  exit /b 1
)
start "" "%~dp0exports\solicitudes.html"
