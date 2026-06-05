@echo off
cd /d "%~dp0"

echo ============================================
echo   AI Chat Studio
echo ============================================
echo.

:: =============================================
:: Check & install server dependencies
:: =============================================
if not exist "server\node_modules" (
    echo [1/2] Installing server dependencies...
    cd server
    call npm install
    cd ..
    echo.
) else (
    echo [1/2] Server dependencies: OK
)

:: =============================================
:: Check & install client dependencies
:: =============================================
if not exist "client\node_modules" (
    echo [2/2] Installing client dependencies...
    cd client
    call npm install
    cd ..
    echo.
) else (
    echo [2/2] Client dependencies: OK
)

echo.
echo Starting services (Ctrl+C to stop all)...
echo   Backend  : http://localhost:3000
echo   Frontend : http://localhost:5173
echo ============================================

:: Start both services in a single window
npx concurrently -n server,client -c blue,green "npm run dev --prefix server" "npm run dev --prefix client"

pause