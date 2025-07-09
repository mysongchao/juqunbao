# 腾讯云云托管部署最终解决方案

## 🔍 问题根本原因

腾讯云云托管系统**完全覆盖了我们的自定义 Dockerfile**，使用系统自动生成的配置，导致：
1. 应用文件未被正确复制到容器
2. 依赖包未安装
3. 应用无法启动

## 🛠️ 最终解决方案

### 1. 项目结构调整 ✅ 已完成

#### 核心文件位置
- ✅ `package.json` 在根目录
- ✅ `server.js` 在根目录
- ✅ 所有云函数在 `cloudfunctions/` 目录

#### 关键配置
- ✅ 使用标准的 `npm start` 命令
- ✅ 端口设置为 3000
- ✅ 添加了健康检查端点 `/health`

### 2. 腾讯云控制台配置

#### 服务配置
1. **服务名称**：miniprogram-api
2. **端口**：3000
3. **启动命令**：`npm start`
4. **环境变量**：
   ```
   NODE_ENV=production
   PORT=3000
   ```

#### 健康检查配置
- **路径**：`/health`
- **端口**：3000
- **超时时间**：5秒
- **检查间隔**：10秒

### 3. 部署步骤

#### 步骤 1：提交代码
```bash
git add .
git commit -m "修复云托管部署配置"
git push
```

#### 步骤 2：腾讯云控制台配置
1. 进入腾讯云云托管控制台
2. 选择你的服务
3. 点击"服务配置"
4. 设置以下参数：
   - **端口**：3000
   - **启动命令**：npm start
   - **环境变量**：NODE_ENV=production, PORT=3000
   - **健康检查路径**：/health

#### 步骤 3：重新部署
1. 点击"重新部署"
2. 等待构建完成
3. 检查服务状态

### 4. 验证部署

#### 健康检查
```bash
curl http://your-service-url/health
```
预期响应：
```json
{
  "status": "OK",
  "timestamp": "2025-07-09T05:36:00.000Z"
}
```

#### 根路径测试
```bash
curl http://your-service-url/
```
预期响应：
```json
{
  "status": "OK",
  "message": "WeChat Miniprogram Cloud Functions API",
  "timestamp": "2025-07-09T05:36:00.000Z"
}
```

#### API 测试
```bash
curl -X POST http://your-service-url/api/home/getCards \
  -H "Content-Type: application/json" \
  -d '{"flowType": "recommend", "page": 1, "pageSize": 20}'
```

### 5. 故障排除

#### 如果仍然失败：

1. **检查服务日志**：
   - 在云托管控制台查看详细日志
   - 确认应用是否正常启动
   - 检查端口是否正确监听

2. **本地测试**：
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **手动构建测试**：
   ```bash
   # 使用简化版 Dockerfile
   docker build -f Dockerfile.simple -t miniprogram-api .
   docker run -p 3000:3000 miniprogram-api
   ```

4. **检查文件结构**：
   ```bash
   ls -la
   cat package.json
   node server.js
   ```

### 6. 备选方案

#### 方案 A：使用简化版 Dockerfile
如果自动部署仍然失败，可以：
```bash
mv Dockerfile Dockerfile.backup
mv Dockerfile.simple Dockerfile
```

#### 方案 B：联系技术支持
如果问题持续存在：
1. 提供完整的部署日志
2. 说明项目结构
3. 请求手动配置

### 7. 监控和维护

#### 服务监控
- 定期检查服务状态
- 监控健康检查结果
- 查看应用日志

#### 性能优化
- 根据实际负载调整资源配置
- 监控内存和CPU使用情况
- 优化数据库查询

## 🎯 预期结果

修复后，服务应该能够：
- ✅ 在端口 3000 上正常启动
- ✅ 通过健康检查
- ✅ 响应 API 请求
- ✅ 在云托管控制台显示为"运行中"状态
- ✅ 支持所有云函数调用

## 📞 技术支持

如果问题仍然存在，请：
1. 查看控制台日志
2. 运行本地测试脚本
3. 检查腾讯云云托管配置
4. 联系开发团队或腾讯云技术支持

## 🔗 相关文档

- [腾讯云云托管官方文档](https://cloud.tencent.com/document/product/1243)
- [Node.js 部署最佳实践](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Express.js 生产环境部署](https://expressjs.com/en/advanced/best-practices-production.html) 