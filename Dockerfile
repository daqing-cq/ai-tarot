FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装依赖
COPY backend/package*.json ./
RUN npm install --production

# 复制后端代码
COPY backend/ .

# 复制前端到 public 目录（由 Express 静态托管）
COPY frontend/ ./public/

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# 启动
CMD ["node", "server.js"]