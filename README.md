# 🔮 AI 塔罗牌占卜网站

很简单的一个web页面，所有代码基本上都是固定的，只有.env需要添加AI模型的API以外，不需要任何技术层次操作，直接部署即可；

如果没有一点代码基础的，https://www.ta-ku.top/blog/ai-tarot-web 可以看一下，完整教程基本上写的很详细哈；

> 技术栈：Node.js + Express + OpenAI/Claude API + Docker + aaPanel + Nginx  
> 系统推荐：**Debian 12（天下第一！）**

---

## 📁 目录结构总览

```
ai-tarot/
├── backend/
│   ├── server.js          # Express 主服务
│   ├── tarot-data.js      # 78张塔罗牌数据
│   ├── package.json
│   └── .env               # 环境变量（API Key等）
├── frontend/
│   ├── index.html         # 主页面
│   ├── style.css          # 样式
│   └── app.js             # 前端逻辑
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```