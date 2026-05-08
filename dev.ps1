# HeyEdit - 一键启动开发环境
# Usage: .\dev.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== HeyEdit Dev Mode ===" -ForegroundColor Cyan

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: pnpm not found. Install it first: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

pnpm tauri dev
