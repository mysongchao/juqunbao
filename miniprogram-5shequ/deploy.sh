#!/bin/bash

# 腾讯云云托管部署脚本

echo "🚀 开始部署微信小程序云函数API服务..."

# 检查必要文件
echo "📋 检查必要文件..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json 不存在"
    exit 1
fi

if [ ! -f "server.js" ]; then
    echo "❌ server.js 不存在"
    exit 1
fi

echo "✅ 必要文件检查通过"

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 检查依赖安装
if [ ! -d "node_modules" ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 测试启动
echo "🧪 测试应用启动..."
timeout 10s node server.js &
PID=$!

sleep 5

# 检查进程是否运行
if ps -p $PID > /dev/null; then
    echo "✅ 应用启动测试成功"
    kill $PID
else
    echo "❌ 应用启动测试失败"
    exit 1
fi

# 检查端口监听
echo "🔍 检查端口监听..."
if netstat -tuln | grep ":3000" > /dev/null; then
    echo "✅ 端口3000监听正常"
else
    echo "❌ 端口3000监听失败"
    exit 1
fi

echo "🎉 部署前检查完成！"
echo ""
echo "📝 部署说明："
echo "1. 确保腾讯云云托管服务配置正确"
echo "2. 端口设置为：3000"
echo "3. 启动命令设置为：npm start"
echo "4. 健康检查路径：/health"
echo "5. 环境变量：NODE_ENV=production, PORT=3000"
echo ""
echo "🔗 测试链接："
echo "- 健康检查：http://your-service-url/health"
echo "- 根路径：http://your-service-url/"
echo "- API测试：POST http://your-service-url/api/home/getCards" 