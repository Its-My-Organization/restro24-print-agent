@echo off
REM Script to extract SSL certificate from server for Android installation
REM Usage: extract-certificate.bat <host> <port>
REM Example: extract-certificate.bat 164.68.118.52 8006

set HOST=%1
if "%HOST%"=="" set HOST=164.68.118.52

set PORT=%2
if "%PORT%"=="" set PORT=8006

set OUTPUT_FILE=server-%HOST%-%PORT%.crt

echo Extracting SSL certificate from %HOST%:%PORT%...
echo Output file: %OUTPUT_FILE%
echo.

REM Extract certificate using openssl
echo | openssl s_client -showcerts -connect %HOST%:%PORT% 2>nul | openssl x509 -outform PEM > %OUTPUT_FILE%

if %ERRORLEVEL% EQU 0 (
    echo ✅ Certificate extracted successfully!
    echo.
    echo Next steps:
    echo 1. Transfer %OUTPUT_FILE% to your Android device
    echo 2. On Android: Settings → Security → Install from storage
    echo 3. Select %OUTPUT_FILE%
    echo 4. Install as USER certificate (not just view)
    echo 5. Restart the app
    echo.
    echo For Android Emulator:
    echo   adb push %OUTPUT_FILE% /sdcard/Download/
    echo   Then install from Settings → Security → Install from storage
) else (
    echo ❌ Failed to extract certificate
    echo Make sure:
    echo 1. The server is running and accessible
    echo 2. You have openssl installed (download from https://slproweb.com/products/Win32OpenSSL.html)
    exit /b 1
)

