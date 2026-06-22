@echo off
chcp 65001 >nul 2>&1
title 创建桌面快捷方式

set SCRIPT_DIR=%~dp0
set BAT_PATH=%SCRIPT_DIR%启动 MindVault.bat"
set SHORTCUT_PATH=%USERPROFILE%\Desktop\MindVault.lnk"

echo 正在创建桌面快捷方式...

:: 使用 PowerShell 创建快捷方式
powershell -Command ^
  "$ws = New-Object -ComObject WScript.Shell; ^
   $shortcut = $ws.CreateShortcut('%USERPROFILE%\Desktop\MindVault.lnk'); ^
   $shortcut.TargetPath = '%SCRIPT_DIR%启动 MindVault.bat'; ^
   $shortcut.WorkingDirectory = '%SCRIPT_DIR%'; ^
   $shortcut.Description = 'MindVault - 本地知识库'; ^
   $shortcut.Save(); ^
   Write-Host '快捷方式已创建在桌面！'"

echo.
echo ========================================
echo   MindVault 桌面快捷方式已创建！
echo   你现在可以从桌面双击启动 MindVault
echo ========================================
echo.
pause
