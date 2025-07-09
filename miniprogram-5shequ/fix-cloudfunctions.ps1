# 批量修复云函数依赖脚本
# 使用方法：在项目根目录下运行 .\fix-cloudfunctions.ps1

Write-Host "开始批量修复云函数依赖..." -ForegroundColor Green

# 获取所有 cloudfunctions 下的一级目录
$cloudFunctions = Get-ChildItem -Path ./cloudfunctions -Directory

foreach ($func in $cloudFunctions) {
    $funcPath = $func.FullName
    Write-Host "正在处理: $($func.Name)" -ForegroundColor Yellow

    Push-Location $funcPath

    # 初始化 package.json（如果不存在）
    if (-not (Test-Path "package.json")) {
        Write-Host "  - 初始化 package.json" -ForegroundColor Cyan
        npm init -y
    }

    # 安装/升级 wx-server-sdk
    Write-Host "  - 安装/升级 wx-server-sdk" -ForegroundColor Cyan
    npm install wx-server-sdk@latest --save

    Pop-Location

    Write-Host "  ✓ 完成 $($func.Name)" -ForegroundColor Green
}

Write-Host "`n所有云函数依赖修复完成！" -ForegroundColor Green
Write-Host "请重新上传所有云函数到云端。" -ForegroundColor Yellow 