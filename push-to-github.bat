@echo off
echo ========================================================
echo   ChronosNet - Serenity System GitHub Deployment Helper
echo ========================================================
echo.

set /p REPO_URL="Enter your GitHub repository URL (e.g., https://github.com/USERNAME/chronosnet.git): "

if "%REPO_URL%"=="" (
    echo [ERROR] No repository URL provided. Aborting.
    pause
    exit /b 1
)

echo.
echo [1/3] Adding remote origin...
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

echo [2/3] Setting branch to main...
git branch -M main

echo [3/3] Pushing to GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push. Please check your credentials or repo permissions.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo   SUCCESS! Repository successfully pushed to GitHub.
echo.
echo   To enable GitHub Pages:
echo   1. Open your repo on GitHub
echo   2. Go to Settings -^> Pages
echo   3. Under 'Build and deployment', set Source to 'GitHub Actions'
echo   4. Your site will be live at https://^<username^>.github.io/chronosnet/
echo ========================================================
pause
