FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 先复制依赖清单并安装，利用缓存层
COPY backend/package*.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# 复制后端代码
COPY backend/ .

# 复制前端到 public 目录（由 Express 静态托管）
COPY frontend/ ./public/

# 使用镜像自带的非特权 node 用户运行
RUN chown -R node:node /app
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# 启动
CMD ["node", "server.js"]
