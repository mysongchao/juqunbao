# WeChat Miniprogram Cloud Run 部署指南

## 概述

本项目已将微信小程序云函数转换为可在腾讯云 Cloud Run 上运行的容器化服务。

## 文件结构

```
├── Dockerfile              # Docker 容器配置
├── .dockerignore           # Docker 构建忽略文件
├── cloudfunctions/
│   ├── server.js           # Express 服务器入口
│   ├── package.json        # 依赖配置
│   ├── home/               # 首页相关云函数
│   ├── user/               # 用户相关云函数
│   ├── content/            # 内容相关云函数
│   ├── search/             # 搜索相关云函数
│   ├── upload/             # 上传相关云函数
│   ├── message/            # 消息相关云函数
│   ├── tags/               # 标签相关云函数
│   ├── contentActions/     # 内容操作相关云函数
│   └── getContentDetail/   # 内容详情相关云函数
└── CLOUD_RUN_README.md     # 本文档
```

## API 接口

### 基础信息
- **服务端口**: 3000
- **健康检查**: `GET /health` 或 `GET /_/health`
- **API 前缀**: `/api/{functionName}/{action}`

### 接口格式
```
POST /api/{functionName}/{action}
Content-Type: application/json

{
  // 请求参数
}
```

### 可用接口

#### 首页相关 (`/api/home/`)
- `getCards` - 获取内容卡片列表
- `getSwipers` - 获取首页轮播图
- `insertSwipers` - 插入默认轮播图数据

#### 用户相关 (`/api/user/`)
- 用户相关操作接口

#### 内容相关 (`/api/content/`)
- 内容管理相关接口

#### 搜索相关 (`/api/search/`)
- 搜索功能相关接口

#### 上传相关 (`/api/upload/`)
- 文件上传相关接口

#### 消息相关 (`/api/message/`)
- 消息处理相关接口

#### 标签相关 (`/api/tags/`)
- 标签管理相关接口

#### 内容操作 (`/api/contentActions/`)
- 内容操作相关接口

#### 内容详情 (`/api/getContentDetail/`)
- 获取内容详情接口

## 部署步骤

### 1. 本地构建测试

```bash
# 进入项目目录
cd cloudfunctions

# 安装依赖
npm install

# 本地启动服务
npm start
```

### 2. 腾讯云 Cloud Run 部署

1. 登录腾讯云控制台
2. 进入 Cloud Run 服务
3. 选择"创建服务"
4. 选择"代码仓库"方式
5. 连接你的 Git 仓库
6. 配置服务参数：
   - **服务名称**: miniprogram-api
   - **端口**: 3000
   - **CPU**: 0.25核
   - **内存**: 0.5GB
   - **最小实例数**: 0
   - **最大实例数**: 10

### 3. 环境变量配置

在 Cloud Run 服务配置中添加以下环境变量：

```
NODE_ENV=production
TENCENT_CLOUD_ENV_ID=cloud1-6gjcqmld5d653514
```

### 4. 域名配置

部署完成后，Cloud Run 会提供一个默认域名，格式如：
`https://miniprogram-api-xxxxx.ap-region.run.tcloudbase.com`

## 使用示例

### 获取首页内容卡片

```bash
curl -X POST https://your-service-url/api/home/getCards \
  -H "Content-Type: application/json" \
  -H "x-openid: user-openid" \
  -d '{
    "flowType": "recommend",
    "page": 1,
    "pageSize": 20
  }'
```

### 获取首页轮播图

```bash
curl -X POST https://your-service-url/api/home/getSwipers \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 注意事项

1. **云环境配置**: 确保在 `config.js` 中正确配置了云环境 ID
2. **数据库权限**: 确保云函数有访问云数据库的权限
3. **网络配置**: 如果需要访问外部服务，请配置相应的网络策略
4. **监控告警**: 建议配置服务监控和告警

## 故障排除

### 常见问题

1. **Dockerfile 找不到**: 确保项目根目录存在 Dockerfile
2. **构建超时**: 
   - 使用多阶段构建减少构建时间
   - 使用国内 npm 镜像加速依赖安装
   - 优化 .dockerignore 减少构建上下文
3. **依赖安装失败**: 检查 package.json 中的依赖版本
4. **端口冲突**: 确保服务配置的端口为 8080
5. **环境变量缺失**: 检查是否配置了必要的环境变量

### 构建优化

如果遇到构建超时问题，可以尝试以下优化：

1. **本地测试构建**:
   ```bash
   chmod +x build.sh
   ./build.sh
   ```

2. **检查构建上下文大小**:
   ```bash
   docker build --progress=plain -t test-image .
   ```

3. **使用构建缓存**:
   - 确保 .dockerignore 正确配置
   - 使用多阶段构建减少最终镜像大小

### 日志查看

在腾讯云控制台的 Cloud Run 服务详情页面可以查看服务日志，帮助排查问题。

### 构建超时解决方案

如果仍然遇到构建超时问题：

1. **减少依赖**: 只保留必要的依赖包
2. **使用预构建镜像**: 考虑使用腾讯云提供的预构建 Node.js 镜像
3. **分阶段部署**: 先部署基础版本，再逐步添加功能
4. **联系支持**: 如果问题持续，请联系腾讯云技术支持

## 更新部署

当代码更新后，重新推送到 Git 仓库，Cloud Run 会自动触发重新部署。

## 联系支持

如遇到部署问题，请联系技术支持或查看腾讯云 Cloud Run 官方文档。 