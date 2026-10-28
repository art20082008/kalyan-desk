@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

if exist "Малевич\Малевич.exe" goto run

set "PARTS=17"
set "ZIP=Malevich-windows.zip"

if not exist "SHA256.txt" goto nohash

for /L %%I in (1,1,%PARTS%) do (
  if not exist "part-%%I.bin" goto missing
)

set "CHAIN="
for /L %%I in (1,1,%PARTS%) do (
  if defined CHAIN (
    set "CHAIN=!CHAIN!+part-%%I.bin"
  ) else (
    set "CHAIN=part-%%I.bin"
  )
)

copy /b /y !CHAIN! "%ZIP%" >nul
if errorlevel 1 goto badcopy

set "EXPECT="
for /f "usebackq tokens=1,2" %%A in ("SHA256.txt") do (
  if /I "%%A"=="ZIP" set "EXPECT=%%B"
)
if not defined EXPECT goto nohash

set "GOT="
certutil -hashfile "%ZIP%" SHA256 > "%TEMP%\malevich-hash.txt"
if errorlevel 1 goto badhash
for /f "usebackq delims=" %%L in ("%TEMP%\malevich-hash.txt") do (
  set "LINE=%%L"
  set "LINE=!LINE: =!"
  echo !LINE!| findstr /r "^[0-9A-Fa-f][0-9A-Fa-f]*$" >nul
  if not errorlevel 1 (
    if "!LINE:~64,1!"=="" if not "!LINE:~63,1!"=="" set "GOT=!LINE!"
  )
)
del /q "%TEMP%\malevich-hash.txt" >nul 2>&1
if /I not "!GOT!"=="!EXPECT!" goto badhash

tar -xf "%ZIP%"
if errorlevel 1 goto badtar
del /q "%ZIP%" >nul 2>&1

if not exist "Малевич\Малевич.exe" goto noexe

:run
start "" "Малевич\Малевич.exe"
exit /b 0

:missing
echo Не хватает части архива. В этой папке должны лежать part-1.bin ... part-%PARTS%.bin, SHA256.txt и ЗАПУСК.bat.
pause
exit /b 1

:nohash
echo Не найден SHA256.txt или в нём нет строки ZIP с контрольной суммой архива.
if exist "%ZIP%" del /q "%ZIP%" >nul 2>&1
pause
exit /b 1

:badcopy
echo Не удалось склеить части в архив.
pause
exit /b 1

:badhash
echo Контрольная сумма архива не совпала. Скачайте части ещё раз: один из файлов повреждён или скачан не полностью.
if exist "%ZIP%" del /q "%ZIP%" >nul 2>&1
pause
exit /b 1

:badtar
echo Не удалось распаковать архив. Нужна Windows 10 или новее.
if exist "%ZIP%" del /q "%ZIP%" >nul 2>&1
pause
exit /b 1

:noexe
echo После распаковки не найден файл Малевич\Малевич.exe.
pause
exit /b 1
