@echo off
chcp 65001 >nul 2>&1
title MindVault - Local Knowledge Base

echo ========================================
echo   MindVault - Local Knowledge Base
echo   启动中，请稍候...
echo ========================================
echo.

:: 设置环境变量
set NODE_ENV=production
set HOSTNAME=localhost
set PORT=3000

:: 获取脚本所在目录
set SCRIPT_DIR=%~dp0
set STANDALONE_DIR=%SCRIPT_DIR%.next\standalone
set DATA_DIR=%SCRIPT_DIR%data

:: 创建数据目录
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

:: 设置数据库路径
set DATABASE_URL=file:%DATA_DIR%\dev.db

:: 检查 standalone 目录
if not exist "%STANDALONE_DIR%\server.js" (
    echo [错误] 未找到服务器文件。请确保已构建项目。
    pause
    exit /b 1
)

:: 启动服务器
echo [启动] MindVault 服务器正在启动...
echo [地址] http://localhost:3000
echo [提示] 服务器启动后将自动打开浏览器
echo [提示] 按 Ctrl+C 可停止服务器
echo.

:: 延迟 3 秒后打开浏览器
start /b cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

:: 运行 Node.js 服务器
node "%STANDALONE_DIR%\server.js"

:: 如果服务器停止
echo.
echo [停止] MindVault 服务器已停止
pause
