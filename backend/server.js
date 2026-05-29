require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { drawCards, getSpreadPositions } = require('./tarot-data');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== 中间件 =====
app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// ===== 获取真实 IP（兼容 Cloudflare）=====
// Cloudflare 会把真实访客 IP 放在 CF-Connecting-IP 请求头里
// 如果没有 CF 头（比如本地直接访问），则降级用 X-Forwarded-For 或 socket IP
function getRealIP(req) {
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

// ===== 24小时内限制 AI_DAILY_LIMIT 次的限流器 =====
// 使用内存 Map 存储，key=IP，value={ count, resetTime }
// 注意：容器重启后计数清零（如需持久化可换 Redis，见文末注释）
const aiCallStore = new Map();

// 每1小时自动清理过期记录，防止内存无限增长
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of aiCallStore.entries()) {
    if (now > record.resetTime) {
      aiCallStore.delete(ip);
    }
  }
}, 60 * 60 * 1000);

// 限流中间件：同一IP 24小时内最多调用 AI_DAILY_LIMIT 次（默认2次）
function aiDailyLimiter(req, res, next) {
  const ip = getRealIP(req);
  const now = Date.now();
  const limit = parseInt(process.env.AI_DAILY_LIMIT) || 2;
  const windowMs = 24 * 60 * 60 * 1000; // 24小时

  const record = aiCallStore.get(ip);

  // 没有记录，或者已过期 → 重置并放行
  if (!record || now > record.resetTime) {
    aiCallStore.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  // 未超限 → 计数+1 并放行
  if (record.count < limit) {
    record.count += 1;
    return next();
  }

  // 已超限 → 拒绝，告知剩余等待时间
  const remainMs = record.resetTime - now;
  const remainHours = Math.ceil(remainMs / 1000 / 60 / 60);

  return res.status(429).json({
    error: `你今日的占卜次数已用完（每24小时限${limit}次），请${remainHours}小时后再来 🌙`,
    resetIn: remainMs,
    resetTime: record.resetTime
  });
}

// ===== 基础限流（防恶意刷接口）=====
// 每分钟最多30次请求，防止暴力攻击
const baseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT) || 30,
  keyGenerator: (req) => getRealIP(req),
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', baseLimiter);

// ===== 统一 AI 配置工厂 =====
function getAIClientConfig() {
  const provider = process.env.AI_PROVIDER || 'openai';

  const configs = {
    openai: {
      type: 'openai_compat',
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
    deepseek: {
      type: 'openai_compat',
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },
    gemini: {
      type: 'openai_compat',
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    },
    claude: {
      type: 'claude',
      apiKey: process.env.CLAUDE_API_KEY,
      baseURL: process.env.CLAUDE_BASE_URL || 'https://api.anthropic.com',
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
    }
  };

  const config = configs[provider];
  if (!config) throw new Error(`不支持的 AI_PROVIDER: ${provider}`);
  if (!config.apiKey) throw new Error(`${provider} 的 API Key 未配置，请检查 .env 文件`);

  return config;
}

// ===== API 路由 =====

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: process.env.AI_PROVIDER || 'openai',
    timestamp: new Date().toISOString()
  });
});

// 查询当前 IP 今日剩余次数（前端可用来显示"今日剩余X次"）
app.get('/api/quota', (req, res) => {
  const ip = getRealIP(req);
  const now = Date.now();
  const limit = parseInt(process.env.AI_DAILY_LIMIT) || 2;
  const record = aiCallStore.get(ip);

  if (!record || now > record.resetTime) {
    return res.json({ used: 0, limit, remaining: limit, resetTime: null });
  }

  res.json({
    used: record.count,
    limit,
    remaining: Math.max(0, limit - record.count),
    resetTime: record.resetTime
  });
});

// 抽牌接口（不限次数，抽牌不消耗 AI 配额）
app.post('/api/draw', (req, res) => {
  const { spreadType = 'three' } = req.body;
  const validSpreads = ['single', 'three', 'celtic'];

  if (!validSpreads.includes(spreadType)) {
    return res.status(400).json({ error: '无效的牌阵类型，仅支持 single / three / celtic' });
  }

  const countMap = { single: 1, three: 3, celtic: 10 };
  const cards = drawCards(countMap[spreadType]);
  const positions = getSpreadPositions(spreadType);

  res.json({ cards, positions, spreadType });
});

// AI 解读接口（SSE 流式输出）
// aiDailyLimiter 只挂在这里：只有触发 AI 解读才消耗配额，抽牌不消耗
app.post('/api/interpret', aiDailyLimiter, async (req, res) => {
  const { cards, positions, question, spreadType } = req.body;

  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: '缺少牌面数据' });
  }

  const cardDescriptions = cards.map((card, i) => {
    const pos = positions[i] || `第${i + 1}张`;
    const orientation = card.isReversed ? '逆位' : '正位';
    const keywords = card.isReversed ? card.reversed : card.upright;
    return `【${pos}】${card.name}（${orientation}）- ${keywords}`;
  }).join('\n');

  const spreadLabel = {
    single: '单张',
    three: '三张时间轴',
    celtic: '凯尔特十字'
  }[spreadType] || '未知';

  const systemPrompt = `你是一位神秘而睿智的塔罗牌占卜师，拥有数十年的塔罗解读经验。
你的解读风格：温柔而深邃，充满东方哲学智慧，语言优美诗意。
请用中文进行占卜解读，每次解读都要：
1. 对每张牌进行深入解析（考虑正逆位含义）
2. 结合所有牌的整体能量与关联
3. 给出具体且有建设性的建议
4. 语言富有诗意，但不要过于玄幻
5. 字数控制在400-600字`;

  const userPrompt = `问卜者的问题：${question || '请为我进行综合占卜'}

抽到的牌面（${spreadLabel}牌阵）：
${cardDescriptions}

请对以上塔罗牌进行深入解读，给出完整的占卜结果和人生建议。`;

  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const aiConfig = getAIClientConfig();

    // ----------------------------------------
    // OpenAI 兼容模式（openai / deepseek / gemini）
    // ----------------------------------------
    if (aiConfig.type === 'openai_compat') {
      const OpenAI = require('openai');
      const client = new OpenAI({
        apiKey: aiConfig.apiKey,
        baseURL: aiConfig.baseURL,
      });

      const stream = await client.chat.completions.create({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1200,
        temperature: 0.85,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
      }

    // ----------------------------------------
    // Claude 原生 SDK（Anthropic）
    // ----------------------------------------
    } else if (aiConfig.type === 'claude') {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({
        apiKey: aiConfig.apiKey,
        baseURL: aiConfig.baseURL,
      });

      const stream = await client.messages.stream({
        model: aiConfig.model,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('AI调用错误:', error.message);
    res.write(`data: ${JSON.stringify({ error: `AI解读失败：${error.message}` })}\n\n`);
    res.end();
  }
});

// 静态文件（前端页面由 Express 托管）
app.use(express.static('public'));

// 启动服务
app.listen(PORT, () => {
  const provider = process.env.AI_PROVIDER || 'openai';
  const limit = parseInt(process.env.AI_DAILY_LIMIT) || 2;
  console.log(`🔮 AI塔罗服务运行于 http://localhost:${PORT}`);
  console.log(`📡 当前AI提供商: ${provider}`);
  console.log(`🛡️  每IP每24小时限制调用AI: ${limit}次`);
  console.log(`🌐 跨域允许来源: ${process.env.ALLOWED_ORIGIN || '*'}`);
});

// ============================================================
// 💡 进阶：如需容器重启后限流数据不丢失，可改用 Redis
// 安装：npm install ioredis
// 替换 aiCallStore 相关逻辑为 Redis 的 INCR + EXPIRE 命令
// ============================================================
