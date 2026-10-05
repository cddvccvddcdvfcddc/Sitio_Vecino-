@echo off
cd /d "%~dp0"
set "SV_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "SV_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not "%SV_NODE%"=="node" if not exist "%SV_NODE%" (
  echo Necesitas Node.js 22 o posterior para abrir el sitio con su formulario.
  echo Consulta LEEME.md.
  pause
  exit /b 1
)
echo Abre http://127.0.0.1:4173 en tu navegador.
echo Mantén esta ventana abierta mientras usas el sitio.
"%SV_NODE%" server.mjs
pause
