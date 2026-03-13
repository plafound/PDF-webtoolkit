@echo off
title Setup Node.js Environment

echo =====================================
echo     SETUP KONFIGURASI NODE.JS
echo =====================================
echo.

echo Menambahkan Node.js ke PATH Windows...

set NODEPATH=C:\Program Files\nodejs

echo %PATH% | find /i "%NODEPATH%" >nul
if %errorlevel%==0 (
    echo Node.js sudah ada di PATH.
) else (
    setx PATH "%PATH%;%NODEPATH%"
    echo Node.js berhasil ditambahkan ke PATH.
)

echo.
echo Silakan tutup dan buka kembali CMD jika diperlukan.
echo.

pause