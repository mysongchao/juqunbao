# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache python3 make g++

# 设置 npm 配置，使用国内镜像提高速度
RUN npm config set registry https://registry.npmmirror.com/
RUN npm config set cache /tmp/npm-cache

# 复制 package.json 和 package-lock.json
COPY cloudfunctions/package*.json ./

# 安装依赖
RUN npm install --production --no-optional --prefer-offline

# 生产阶段
FROM node:18-alpine AS production

# 设置工作目录
WORKDIR /app

# 从构建阶段复制 node_modules
COPY --from=builder /app/node_modules ./node_modules

# 复制云函数代码
COPY cloudfunctions/ ./

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动命令
CMD ["node", "server.js"] 