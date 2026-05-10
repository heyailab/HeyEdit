# HeyEdit - 一键发布脚本
# Usage:
#   .\release.ps1 -Version "0.1.5" -Notes "- 新增功能A\n- 修复问题B"
#   .\release.ps1 -Version "0.1.5"          # 自动从 git log 生成 notes

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [Parameter(Mandatory=$false)]
    [string]$Notes
)

$ErrorActionPreference = "Stop"

# ── 配置 ──
$PROJECT_ROOT = $PSScriptRoot
$KEY_FILE     = "$PROJECT_ROOT\keys\heyedit.key"
$API_FILE     = "$PROJECT_ROOT\update-api\updates\index.php"
$BUNDLE_DIR   = "$PROJECT_ROOT\src-tauri\target\release\bundle\nsis"
$SERVER_URL   = "https://heyedit.heyailab.com"

# ── 前置检查 ──
function Check-Tool {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Host "Error: '$Name' not found." -ForegroundColor Red
        exit 1
    }
}

Check-Tool "pnpm"
Check-Tool "rsign"
Check-Tool "git"

if (-not (Test-Path $KEY_FILE)) {
    Write-Host "Error: Signing key not found at $KEY_FILE" -ForegroundColor Red
    Write-Host "Run: rsign generate -p keys/heyedit.pub -s keys/heyedit.key --unencrypted" -ForegroundColor Yellow
    exit 1
}

# ── 辅助：从 git log 生成 release notes ──
function Get-AutoNotes {
    # 找到上一次 release 的 commit hash
    $lastRelease = git log --grep="release: HeyEdit v" --grep="版本" --format="%H" -1 2>$null
    $range = if ($lastRelease) { "$lastRelease..HEAD" } else { "-10" }

    # 获取 commits（排除 release/chore/ci/docs 等非功能性提交）
    $commits = git log $range --format="%s" --reverse 2>$null | ForEach-Object {
        # 跳过 release 和纯维护提交
        if ($_ -match "^release:" -or $_ -match "^chore:\s*(add release|version bump|bump)" -or $_ -match "^ci:" -or $_ -match "^docs:.*README") {
            return $null
        }

        # 提取类型和消息
        if ($_ -match "^(feat|fix|perf|refactor)(\(.*\))?:\s*(.+)") {
            $type = $matches[1]
            $msg  = $matches[3]
            # 转换类型为中文标签
            $label = switch ($type) {
                "feat"     { "新增" }
                "fix"      { "修复" }
                "perf"     { "优化" }
                "refactor" { "重构" }
                default    { $type }
            }
            return "- [$label] $msg"
        }
        elseif ($_ -match "^(.+):") {
            # 其他类型，去掉类型前缀直接显示
            $msg = $_ -replace "^[^:]+:\s*", ""
            return "- $msg"
        }
        else {
            return "- $_"
        }
    } | Where-Object { $_ -ne $null }

    # 去重
    $unique = $commits | Select-Object -Unique
    if ($unique.Count -eq 0) {
        return "- 版本更新至 v$Version"
    }
    return $unique -join "`n"
}

# ── 1. 更新版本号 ──
Write-Host "=== Step 1: Bump version to $Version ===" -ForegroundColor Cyan

# package.json
$packageJson = Get-Content "$PROJECT_ROOT\package.json" -Raw | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "$PROJECT_ROOT\package.json" -Encoding UTF8
Write-Host "  package.json  -> $Version" -ForegroundColor Green

# Cargo.toml
$cargoContent = Get-Content "$PROJECT_ROOT\src-tauri\Cargo.toml" -Raw
$cargoContent = $cargoContent -replace '(?m)^version = "[\d\.]+"', "version = `"$Version`""
Set-Content "$PROJECT_ROOT\src-tauri\Cargo.toml" $cargoContent -Encoding UTF8
Write-Host "  Cargo.toml    -> $Version" -ForegroundColor Green

# tauri.conf.json
$tauriJson = Get-Content "$PROJECT_ROOT\src-tauri\tauri.conf.json" -Raw | ConvertFrom-Json
$tauriJson.version = $Version
$tauriJson | ConvertTo-Json -Depth 10 | Set-Content "$PROJECT_ROOT\src-tauri\tauri.conf.json" -Encoding UTF8
Write-Host "  tauri.conf.json -> $Version" -ForegroundColor Green

# ── 2. 编译 ──
Write-Host ""
Write-Host "=== Step 2: Building release... ===" -ForegroundColor Cyan
pnpm tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed." -ForegroundColor Red
    exit $LASTEXITCODE
}

# ── 3. 签名 ──
Write-Host ""
Write-Host "=== Step 3: Signing installer ===" -ForegroundColor Cyan
$INSTALLER = "$BUNDLE_DIR\HeyEdit_${Version}_x64-setup.exe"
$SIGNATURE = "$INSTALLER.sig"

if (-not (Test-Path $INSTALLER)) {
    Write-Host "Error: Installer not found: $INSTALLER" -ForegroundColor Red
    exit 1
}

rsign sign "$INSTALLER" -s "$KEY_FILE" -W -x "$SIGNATURE" 2>$null
Write-Host "  Signed: $SIGNATURE" -ForegroundColor Green

# ── 4. 更新 PHP API ──
Write-Host ""
Write-Host "=== Step 4: Updating update API ===" -ForegroundColor Cyan

$sigContent = Get-Content "$SIGNATURE" -Raw
# 转义双引号用于 PHP 字符串
$sigEscaped = $sigContent -replace '"', '\"'

# 如果没有提供 Notes，自动从 git log 生成
if (-not $Notes) {
    Write-Host "  Generating notes from git log..." -ForegroundColor Gray
    $autoNotes = Get-AutoNotes
    $defaultNotes = "## HeyEdit v$Version`n`n$autoNotes"
    Write-Host "  Generated notes:" -ForegroundColor Gray
    $autoNotes -split "`n" | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    $defaultNotes = "## HeyEdit v$Version`n`n$Notes"
}

$now = Get-Date -Format "yyyy-MM-ddTHH:mm:ssK"

$phpContent = @"
<?php
/**
 * HeyEdit 更新 API
 * 部署到 $SERVER_URL/updates/
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// ── 每次发版时只需改这里 ──
`$config = [
    'version'  => '$Version',
    'notes'    => "$defaultNotes",
    'pub_date' => '$now',
    'url'      => '$SERVER_URL/HeyEdit_${Version}_x64-setup.exe',
    'signature' => "$sigEscaped",
];

// 可选：从 URL 参数获取目标平台信息
`$target = `$_GET['target'] ?? null;
`$arch   = `$_GET['arch']   ?? null;
`$current = `$_GET['current_version'] ?? null;

// 如果客户端已经是最新版，返回 204 No Content
if (`$current && version_compare(`$current, `$config['version'], '>=')) {
    http_response_code(204);
    exit;
}

// 根据 target 分发不同安装包
if (`$target === 'windows' && `$arch === 'x86_64') {
    `$config['url'] = '$SERVER_URL/HeyEdit_' . `$config['version'] . '_x64-setup.exe';
}

echo json_encode(`$config, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
"@

Set-Content $API_FILE $phpContent -Encoding UTF8 -NoNewline
Write-Host "  Updated: $API_FILE" -ForegroundColor Green

# ── 5. Git 提交 ──
Write-Host ""
Write-Host "=== Step 5: Git commit ===" -ForegroundColor Cyan

git add "$PROJECT_ROOT/package.json"
git add "$PROJECT_ROOT/src-tauri/Cargo.toml"
git add "$PROJECT_ROOT/src-tauri/tauri.conf.json"
git add "$API_FILE"

$commitMsg = "release: HeyEdit v$Version`n`n- Bump version to $Version`n- Update updater API with new signature`n`nCo-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
git commit -m "$commitMsg" --quiet
Write-Host "  Committed: v$Version" -ForegroundColor Green

git push --quiet
Write-Host "  Pushed to origin" -ForegroundColor Green

# ── 6. 输出待上传文件 ──
Write-Host ""
Write-Host "=== Step 6: Upload checklist ===" -ForegroundColor Cyan
Write-Host "  [ ] $INSTALLER" -ForegroundColor Yellow
Write-Host "      -> Upload to: $SERVER_URL/HeyEdit_${Version}_x64-setup.exe" -ForegroundColor Gray
Write-Host "  [ ] $API_FILE" -ForegroundColor Yellow
Write-Host "      -> Upload to: $SERVER_URL/updates/index.php" -ForegroundColor Gray

Write-Host ""
Write-Host "=== Release v$Version complete! ===" -ForegroundColor Green
