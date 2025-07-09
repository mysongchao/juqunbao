# 简化版 Dockerfile - 用于解决构建问题
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 使用国内镜像源
RUN npm config set registry https://registry.npmmirror.com/

# 复制 package.json
COPY package.json ./

# 安装依赖
RUN npm install --production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["node", "server.js"] 