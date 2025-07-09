# 腾讯云云托管部署指南

## 当前问题

腾讯云云托管系统覆盖了我们的自定义 Dockerfile，导致：
1. 应用无法正确启动
2. 依赖包未安装
3. 健康检查失败

## 解决方案

### 1. 项目结构调整 ✅ 已完成

- `package.json` 已移动到根目录
- `server.js` 已移动到根目录
- 添加了 `start.sh` 启动脚本
- 添加了 `cloudbase.json` 配置文件

### 2. 腾讯云控制台配置

#### 在云托管控制台中设置：

1. **服务配置**：
   - 服务名称：miniprogram-api
   - 端口：3000
   - 启动命令：`npm start`

2. **环境变量**：
   ```
   NODE_ENV=production
   PORT=3000
   TENCENT_CLOUD_ENV_ID=cloud1-6gjcqmld5d653514
   ```

3. **健康检查**：
   - 路径：`/health` 或 `/_/health`
   - 端口：3000
   - 超时时间：5秒

### 3. 部署步骤

#### 步骤 1：提交代码
```bash
git add .
git commit -m "添加云托管配置和启动脚本"
git push
```

#### 步骤 2：重新部署
1. 进入腾讯云云托管控制台
2. 选择你的服务
3. 点击"重新部署"
4. 等待构建完成

#### 步骤 3：检查部署状态
1. 查看构建日志
2. 检查服务状态
3. 查看服务日志

### 4. 故障排除

#### 如果仍然失败：

1. **检查服务日志**：
   - 在云托管控制台查看详细日志
   - 确认 `start.sh` 是否执行
   - 检查文件是否存在

2. **本地测试**：
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. **检查文件结构**：
   ```bash
   ls -la
   cat package.json
   cat start.sh
   ```

4. **手动构建测试**：
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

### 5. 备选方案

如果自动部署仍然失败，可以：

1. **使用简化版 Dockerfile**：
   ```bash
   mv Dockerfile Dockerfile.backup
   mv Dockerfile.simple Dockerfile
   ```

2. **联系技术支持**：
   - 提供完整的部署日志
   - 说明项目结构
   - 请求手动配置

### 6. 验证部署

部署成功后，测试以下端点：

1. **健康检查**：
   ```bash
   curl http://your-service-url/health
   ```

2. **根路径**：
   ```bash
   curl http://your-service-url/
   ```

3. **API 测试**：
   ```bash
   curl -X POST http://your-service-url/api/home/getCards \
     -H "Content-Type: application/json" \
     -d '{"flowType": "recommend", "page": 1, "pageSize": 20}'
   ```

## 预期结果

修复后，服务应该能够：
- ✅ 在端口 3000 上正常启动
- ✅ 通过健康检查
- ✅ 响应 API 请求
- ✅ 在云托管控制台显示为"运行中"状态 