@echo off
title Install Aplikasi PDF

echo =====================================
echo      INSTALASI APLIKASI
echo =====================================
echo.

echo Masuk ke folder aplikasi...

cd /d "%~dp0.."

echo.
echo Menginstall komponen aplikasi...
echo Mohon tunggu beberapa saat.
echo.

npm install

echo.
echo Instalasi selesai.
echo Aplikasi siap digunakan.
echo.

pause