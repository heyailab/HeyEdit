# HeyEdit - 一键编译打包
# Usage: .\build.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== HeyEdit Build ===" -ForegroundColor Cyan

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: pnpm not found. Install it first: npm install -g pnpm" -ForegroundColor Red
    exit 1
}

Write-Host "1/2 Building frontend..." -ForegroundColor Yellow
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "2/2 Building Tauri app..." -ForegroundColor Yellow
pnpm tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tauri build failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "=== Build complete ===" -ForegroundColor Green
Write-Host "Output: src-tauri\target\release\" -ForegroundColor Gray
