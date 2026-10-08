@echo off
cd /d "%~dp0"
set "SV_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "SV_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not "%SV_NODE%"=="node" if not exist "%SV_NODE%" (
  echo Necesitas Node.js 22 o posterior para enviar el correo de prueba.
  echo Consulta LEEME.md.
  pause
  exit /b 1
)
"%SV_NODE%" mailer.mjs
pause
