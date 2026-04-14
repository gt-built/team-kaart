@echo off
echo Starting Team Kaart...

:: Backend starten in nieuw venster
start "Team Kaart Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: Kleine pauze zodat backend kan opstarten
timeout /t 2 /nobreak >nul

:: Frontend starten in nieuw venster
start "Team Kaart Frontend" cmd /k "cd /d %~dp0 && npm run dev"

:: Wachten tot frontend klaar is met opstarten
timeout /t 4 /nobreak >nul

:: Browser openen
start "" "http://localhost:5273"

echo.
echo Backend draait op http://localhost:8000
echo Frontend draait op http://localhost:5273
echo.
