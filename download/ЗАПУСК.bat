@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

rem Отложенное раскрытие выключено: восклицательный знак в пути к папке иначе съедается.

if exist "Малевич\Малевич.exe" goto run

set "ZIP=Malevich-windows.zip"

if not exist "%ZIP%" goto missing
if not exist "SHA256.txt" goto nohash
call :checkhash
if errorlevel 1 goto badhash

tar -xf "%ZIP%"
if errorlevel 1 goto badtar
if not exist "Малевич\Малевич.exe" goto noexe

:run
start "" "Малевич\Малевич.exe"
exit /b 0

:missing
echo Не найден Malevich-windows.zip. Положите его в одну папку с SHA256.txt и ЗАПУСК.bat.
pause
exit /b 1

:nohash
echo Не найден SHA256.txt или в нём нет строки ZIP с контрольной суммой архива.
pause
exit /b 1

:badhash
echo Контрольная сумма архива не совпала. Скачайте Malevich-windows.zip ещё раз: файл повреждён или скачан не полностью.
pause
exit /b 1

:badtar
echo Не удалось распаковать архив. Нужна Windows 10 или новее.
pause
exit /b 1

:noexe
echo После распаковки не найден файл Малевич\Малевич.exe.
pause
exit /b 1

:checkhash
set "EXPECT="
for /f "usebackq tokens=1,2" %%A in ("SHA256.txt") do (
  if /I "%%A"=="ZIP" set "EXPECT=%%B"
)
if not defined EXPECT exit /b 1
certutil -hashfile "%ZIP%" SHA256 > "%TEMP%\malevich-hash.txt"
if errorlevel 1 exit /b 1
findstr /i /c:"%EXPECT%" "%TEMP%\malevich-hash.txt" >nul
if not errorlevel 1 goto hashok
powershell -NoProfile -Command "$e='%EXPECT%'.ToLower(); $raw=Get-Content -LiteralPath ($env:TEMP + '\malevich-hash.txt') -Raw; $flat=($raw -replace '\s','').ToLower(); if ($flat.Contains($e)) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  del /q "%TEMP%\malevich-hash.txt" >nul 2>&1
  exit /b 1
)
:hashok
del /q "%TEMP%\malevich-hash.txt" >nul 2>&1
exit /b 0
