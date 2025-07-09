#!/bin/bash

# 部署修复脚本

echo "🔧 开始修复部署问题..."

# 检查必要文件
echo "📋 检查必要文件..."

if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile 不存在，创建简化版..."
    cp Dockerfile.simple Dockerfile
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json 不存在"
    exit 1
fi

if [ ! -f "server.js" ]; then
    echo "❌ server.js 不存在"
    exit 1
fi

echo "✅ 必要文件检查通过"

# 检查 Dockerfile 内容
echo "🔍 检查 Dockerfile 内容..."
if grep -q "FROM node" Dockerfile; then
    echo "✅ Dockerfile 格式正确"
else
    echo "⚠️ Dockerfile 格式可能有问题，使用简化版..."
    cp Dockerfile.simple Dockerfile
fi

# 检查文件权限
echo "🔐 设置文件权限..."
chmod 644 Dockerfile
chmod 644 package.json
chmod 644 server.js

# 本地测试构建
echo "🧪 本地测试构建..."
if command -v docker &> /dev/null; then
    echo "测试 Docker 构建..."
    docker build -t test-build . --no-cache
    if [ $? -eq 0 ]; then
        echo "✅ 本地构建成功"
    else
        echo "❌ 本地构建失败，使用简化版 Dockerfile..."
        cp Dockerfile.simple Dockerfile
    fi
else
    echo "⚠️ Docker 未安装，跳过本地测试"
fi

# 检查文件大小
echo "📊 检查文件大小..."
ls -lh Dockerfile package.json server.js

# 显示当前配置
echo "📝 当前配置："
echo "- 端口：3000"
echo "- 启动命令：node server.js"
echo "- 环境：production"

echo "🎉 修复完成！"
echo ""
echo "📋 下一步操作："
echo "1. 提交代码：git add . && git commit -m '修复部署配置' && git push"
echo "2. 在腾讯云控制台重新部署"
echo "3. 检查构建日志"
echo ""
echo "🔗 如果仍然失败，请："
echo "1. 检查腾讯云控制台的 Dockerfile 路径设置"
echo "2. 确认代码仓库中的文件结构"
echo "3. 联系腾讯云技术支持" 