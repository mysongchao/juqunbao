#!/bin/bash

# 构建脚本 - 用于本地测试 Docker 构建

echo "开始构建 Docker 镜像..."

# 设置镜像名称
IMAGE_NAME="miniprogram-api"
TAG="latest"

# 清理旧的构建缓存
echo "清理构建缓存..."
docker builder prune -f

# 构建镜像
echo "构建镜像: ${IMAGE_NAME}:${TAG}"
docker build -t ${IMAGE_NAME}:${TAG} .

# 检查构建结果
if [ $? -eq 0 ]; then
    echo "✅ 构建成功!"
    echo "镜像信息:"
    docker images ${IMAGE_NAME}:${TAG}
    
    echo ""
    echo "运行测试容器..."
    docker run -d --name test-container -p 8080:8080 ${IMAGE_NAME}:${TAG}
    
    # 等待服务启动
    echo "等待服务启动..."
    sleep 5
    
    # 测试健康检查
    echo "测试健康检查..."
    curl -f http://localhost:8080/health
    
    if [ $? -eq 0 ]; then
        echo "✅ 服务启动成功!"
        echo "API 地址: http://localhost:8080"
        echo "健康检查: http://localhost:8080/health"
    else
        echo "❌ 服务启动失败"
    fi
    
    # 停止测试容器
    echo "停止测试容器..."
    docker stop test-container
    docker rm test-container
    
else
    echo "❌ 构建失败!"
    exit 1
fi 