@echo off
chcp 65001 >nul
cd /d "%~dp0"
dir /b *.exe >nul 2>&1
if not errorlevel 1 goto run
echo Собираю программу «Малевич». Это займёт около минуты.
if not exist part-1.bin goto missing
if not exist part-2.bin goto missing
if not exist part-3.bin goto missing
if not exist part-4.bin goto missing
if not exist part-5.bin goto missing
if not exist part-6.bin goto missing
if not exist part-7.bin goto missing
copy /b /y part-1.bin+part-2.bin+part-3.bin+part-4.bin+part-5.bin+part-6.bin+part-7.bin Malevich-windows.zip >nul
if errorlevel 1 goto badcopy
tar -xf Malevich-windows.zip
if errorlevel 1 goto badtar
del /q Malevich-windows.zip >nul 2>&1
:run
for %%F in (*.exe) do (
  start "" "%%~fF"
  exit /b 0
)
echo Файл Малевич.exe не найден в этой папке.
pause
exit /b 1
:missing
echo Не хватает частей архива. В этой папке должны лежать part-1.bin ... part-7.bin и этот файл.
pause
exit /b 1
:badcopy
echo Не удалось собрать архив из частей.
pause
exit /b 1
:badtar
echo Не удалось распаковать архив. Нужна Windows 10 или новее.
pause
exit /b 1
