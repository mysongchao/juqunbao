# 部署状态检查指南

## 当前问题分析

### 构建阶段 ✅ 成功
- 代码拉取成功
- Docker 镜像构建成功
- 镜像推送成功

### 部署阶段 ❌ 失败
- Liveness probe failed: dial tcp 10.27.20.66:3000: connect: connection refused
- Readiness probe failed: dial tcp 10.27.20.66:3000: connect: connection refused

## 解决方案

### 1. 项目结构调整 ✅ 已完成
- 将 `package.json` 移动到根目录
- 将 `server.js` 移动到根目录
- 更新了所有路径引用

### 2. 腾讯云配置检查

#### 在腾讯云云托管控制台中确认：
1. **端口配置**: 3000
2. **启动命令**: `npm start` 或 `node server.js`
3. **健康检查路径**: `/health` 或 `/_/health`

#### 环境变量配置：
```
NODE_ENV=production
PORT=3000
TENCENT_CLOUD_ENV_ID=cloud1-6gjcqmld5d653514
```

### 3. 重新部署步骤

1. **提交代码**:
   ```bash
   git add .
   git commit -m "调整项目结构，修复部署问题"
   git push
   ```

2. **在腾讯云控制台**:
   - 进入云托管服务
   - 选择"重新部署"
   - 等待构建完成

3. **检查部署状态**:
   - 查看构建日志
   - 检查服务状态
   - 查看服务日志

### 4. 故障排除

#### 如果仍然失败：

1. **检查服务日志**:
   - 在云托管控制台查看详细日志
   - 确认服务是否正常启动

2. **本地测试**:
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

3. **检查网络配置**:
   - 确认端口 3000 没有被占用
   - 检查防火墙设置

4. **联系技术支持**:
   - 如果问题持续，联系腾讯云技术支持
   - 提供完整的部署日志

## 预期结果

修复后，服务应该能够：
- 在端口 3000 上正常启动
- 通过健康检查
- 响应 API 请求
- 在云托管控制台显示为"运行中"状态

## 验证方法

1. **健康检查**: `GET /health`
2. **根路径**: `GET /`
3. **API 测试**: `POST /api/home/getCards` 