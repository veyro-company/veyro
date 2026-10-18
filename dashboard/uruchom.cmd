@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if not errorlevel 1 (
  start "" "http://127.0.0.1:4173"
  node server.cjs
  goto :end
)
if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  start "" "http://127.0.0.1:4173"
  "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" server.cjs
  goto :end
)
echo Zainstaluj Node.js LTS, a nastepnie uruchom ten plik ponownie.
echo Alternatywnie uruchom: python -m http.server 4173 --bind 127.0.0.1
pause
:end
endlocal
