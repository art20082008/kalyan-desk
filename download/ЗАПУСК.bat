@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

rem Отложенное раскрытие выключено: восклицательный знак в пути к папке иначе съедается.

if exist "Малевич\Малевич.exe" goto run

set "PARTS=17"
set "ZIP=Malevich-windows.zip"
set "MADEZIP=0"

if exist "%ZIP%" goto havezip

if not exist "SHA256.txt" goto nohash
for /L %%I in (1,1,%PARTS%) do (
  if not exist "part-%%I.bin" goto missing
)
call :joinparts
if errorlevel 1 goto badcopy
set "MADEZIP=1"

:havezip
if not exist "SHA256.txt" goto nohash
call :checkhash
if errorlevel 1 goto badhash

tar -xf "%ZIP%"
if errorlevel 1 goto badtar
if "%MADEZIP%"=="1" del /q "%ZIP%" >nul 2>&1
if not exist "Малевич\Малевич.exe" goto noexe

:run
start "" "Малевич\Малевич.exe"
exit /b 0

:missing
echo Не хватает части архива. Положите Malevich-windows.zip или part-1.bin ... part-%PARTS%.bin, а также SHA256.txt и ЗАПУСК.bat.
pause
exit /b 1

:nohash
echo Не найден SHA256.txt или в нём нет строки ZIP с контрольной суммой архива.
pause
exit /b 1

:badcopy
echo Не удалось склеить части в архив.
pause
exit /b 1

:badhash
echo Контрольная сумма архива не совпала. Скачайте Malevich-windows.zip ещё раз: файл повреждён или скачан не полностью.
if "%MADEZIP%"=="1" del /q "%ZIP%" >nul 2>&1
pause
exit /b 1

:badtar
echo Не удалось распаковать архив. Нужна Windows 10 или новее.
if "%MADEZIP%"=="1" del /q "%ZIP%" >nul 2>&1
pause
exit /b 1

:noexe
echo После распаковки не найден файл Малевич\Малевич.exe.
pause
exit /b 1

:joinparts
set "CHAIN=part-1.bin"
for /L %%I in (2,1,17) do call :addpart %%I
copy /b /y %CHAIN% "%ZIP%" >nul
exit /b %errorlevel%

:addpart
set "CHAIN=%CHAIN%+part-%~1.bin"
exit /b 0

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
