@echo off
set "orbitApp=%LOCALAPPDATA%\Orbiter\orbit-companion.exe"
if exist "%orbitApp%" (
  start "" "%orbitApp%"
  exit /b
)
if exist "%~dp0build\release\Orbiter Setup.exe" (
  start "" "%~dp0build\release\Orbiter Setup.exe"
  exit /b
)
echo Orbiter is not installed yet. See desktop\README.md for the installer location.
pause
