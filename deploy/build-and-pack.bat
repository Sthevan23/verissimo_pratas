@echo off
cd /d "%~dp0.."
call npm run build
if errorlevel 1 exit /b 1
if exist deploy\public_html rmdir /s /q deploy\public_html
mkdir deploy\public_html
xcopy /E /I /Y dist\* deploy\public_html\
xcopy /E /I /Y api deploy\public_html\api\
echo.
echo Pacote pronto em deploy\public_html
echo Envie essa pasta para public_html na Hostinger
echo.
echo Login admin: https://sthevandev.com.br/admin/login
pause
