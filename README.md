# 🔮 AI 塔罗牌占卜网站

很简单的一个web页面，所有代码都是固定的，什么都不需要改；不需要任何技术层次操作，直接Docker部署即可；  
如果没有任何代码基础的，可以看一下(https://www.ta-ku.top/blog/ai-tarot-web) ，这里有完整代码以及教程，基本上写的很详细哈；

**只有.env需要更改**
  1.AI模型的调用：  
    `.env`里写了几个常用接口，用哪个填写哪个AI模型的`base_url`、`api_key`、`model*`；  
    不添加AI模型也可以用，只是没有AI解析而已;  
  2.每个IP每24小时最多调用AI解读次数  
    代码内写的默认每24小时限制占卜（调用API）5次，需要更改的话  
    ```Bash
    # 每个IP每24小时最多调用AI解读次数
    AI_DAILY_LIMIT=5
    #5改成需要的数字
    ```
**server.js的更改**  
  1.每个IP每24小时最多调用AI解读次数  
    ```Bash
    # 原代码
    const windowMs = 24 * 60 * 60 * 1000; // 24小时
    ```
    自行修改需要配置的时间；  
  2.修改时间以后，同时需要修改超过限制后的文档  
    ```bash
    error: `你今日的占卜次数已用完（每24小时限${limit}次），请${remainHours}小时后再来 🌙`,
    ```
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
