@echo off
title Push Saathi MSK Monorepo to GitHub
cd /d "%~dp0"

echo ================================================================
echo   Pushing Saathi MSK Triage Monorepo to GitHub
echo   Target: https://github.com/nandhish3004/saathi-msk-triage
echo ================================================================
echo.

echo 1. Initializing Git repository...
git init

echo 2. Staging all files across Firmware, ML, Mobile App, and Web Portal...
git add .

echo 3. Creating initial commit...
git commit -m "feat: complete end-to-end Saathi MSK Triage monorepo (SIH 26004)"

echo 4. Setting default branch to main...
git branch -M main

echo 5. Setting remote origin to nandhish3004 repository...
git remote remove origin 2>nul
git remote add origin https://github.com/nandhish3004/saathi-msk-triage.git

echo 6. Pushing to GitHub (main branch)...
git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] All files have been pushed to GitHub successfully!
    echo Visit: https://github.com/nandhish3004/saathi-msk-triage
) else (
    echo [NOTE] If this is a new repository, make sure you created
    echo 'saathi-msk-triage' at https://github.com/new first!
)

echo.
pause
