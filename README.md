# 🔮 AI 塔罗牌占卜网站

很简单的一个web页面，所有代码都是固定的，什么都不需要改；不需要任何技术层次操作，直接Docker部署即可；  
只有`.env`需要添加AI模型的API，不添加API也可以用，只是没有AI解析而已;

如果没有一点代码基础的，[点击这里](https://www.ta-ku.top/blog/ai-tarot-web) 有完整代码以及每一步教程基本上写的很详细哈；

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

> 技术栈：Node.js + Express + OpenAI/Claude API + Docker + aaPanel + Nginx  
> 系统推荐：**Debian（天下第一！）**
