#!/bin/bash

# 启动脚本
echo "Starting Miniprogram Cloud API Server..."

# 检查 Node.js 版本
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# 检查工作目录
echo "Working directory: $(pwd)"
echo "Files in current directory:"
ls -la

# 检查 package.json
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    echo "Package.json content:"
    cat package.json
else
    echo "❌ package.json not found"
    exit 1
fi

# 检查 server.js
if [ -f "server.js" ]; then
    echo "✅ server.js found"
else
    echo "❌ server.js not found"
    exit 1
fi

# 检查 node_modules
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# 设置环境变量
export NODE_ENV=production
export PORT=3000

echo "Starting server on port $PORT..."
echo "Environment: $NODE_ENV"

# 启动应用
exec node server.js 