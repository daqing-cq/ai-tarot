require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { drawCards, drawSeasonCards, getSpreadPositions } = require('./tarot-data');
const { getTodaySolarTerm, getNextSolarTerm } = require('./solar-terms');

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
// 注意：容器重启后计数清零（如需持久化可换 Redis）
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

// 限流中间件：同一IP在 windowMs 时间内最多调用 AI_DAILY_LIMIT 次（默认2次）
// 修改时间：只需改 windowMs 的数字，例如 24 * 60 * 60 * 1000 = 24小时
// 修改次数：在 .env 里改 AI_DAILY_LIMIT=5 即可，无需改代码
function aiDailyLimiter(req, res, next) {
  const ip = getRealIP(req);
  const now = Date.now();
  const limit = parseInt(process.env.AI_DAILY_LIMIT) || 2;

  // ⬇️ 修改占卜时间窗口：把 24 改成你需要的小时数
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

  // ⬇️ 修改提示文字：把"每24小时"改成对应的小时数
  return res.status(429).json({
    error: `你今日的占卜次数已用完（每24小时限${limit}次），请${remainHours}小时后再来 🌙`,
    resetIn: remainMs,
    resetTime: record.resetTime
  });
}

// ===== 基础限流（防恶意刷接口）=====
// 每分钟最多 RATE_LIMIT 次请求，防止暴力攻击
// 在 .env 里设置 RATE_LIMIT=30 即可修改
const baseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT) || 30,
  keyGenerator: (req) => getRealIP(req),
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', baseLimiter);

// ===== 统一 AI 配置工厂 =====
// 根据 .env 中的 AI_PROVIDER 自动选择对应客户端配置
// 支持: openai | deepseek | gemini | claude
// 切换方式：在 .env 里改 AI_PROVIDER=deepseek 即可，无需改代码
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

  // ⚠️ 安全处理：API Key 未配置时抛出通用错误，不暴露具体信息
  if (!config.apiKey) throw new Error('AI服务暂时不可用');

  return config;
}

// ===== API 路由 =====

// 健康检查（不暴露敏感配置信息）
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
    // ⚠️ 安全：不返回 provider、model 等信息，防止暴露技术栈
  });
});

// 查询当前 IP 今日剩余次数
// 前端可调用此接口显示"今日剩余X次"
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

// 查询四季牌阵今天是否开放（前端用来提前置灰按钮，避免用户选了才被拒）
app.get('/api/season-status', (req, res) => {
  const term = getTodaySolarTerm();
  const next = getNextSolarTerm();
  res.json({
    available: !!term || process.env.FORCE_SEASON_AVAILABLE === 'true',
    today: term,
    next
  });
});

// 抽牌接口（不限次数，抽牌不消耗 AI 配额）
app.post('/api/draw', (req, res) => {
  const { spreadType = 'three' } = req.body;
  const validSpreads = ['single', 'three', 'celtic', 'season'];

  if (!validSpreads.includes(spreadType)) {
    return res.status(400).json({ error: '无效的牌阵类型，仅支持 single / three / celtic / season' });
  }

  // 四季牌阵：仅限春分/夏至/秋分/冬至当天（北京时间）开放
  // FORCE_SEASON_AVAILABLE=true 可在 .env 里临时打开，方便开发时随时测试
  if (spreadType === 'season' && process.env.FORCE_SEASON_AVAILABLE !== 'true') {
    const term = getTodaySolarTerm();
    if (!term) {
      const next = getNextSolarTerm();
      return res.status(403).json({
        error: '四季牌阵只在春分、夏至、秋分、冬至这四天开放，今天还不是这四天之一 🌗',
        next
      });
    }
  }

  const countMap = { single: 1, three: 3, celtic: 10 };
  const cards = spreadType === 'season' ? drawSeasonCards() : drawCards(countMap[spreadType]);
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

  // 构建牌面描述文本
  const cardDescriptions = cards.map((card, i) => {
    const pos = positions[i] || `第${i + 1}张`;
    const orientation = card.isReversed ? '逆位' : '正位';
    const keywords = card.isReversed ? card.reversed : card.upright;
    return `【${pos}】${card.name}（${orientation}）- ${keywords}`;
  }).join('\n');

  const spreadLabel = {
    single: '单张',
    three: '三张时间轴',
    celtic: '凯尔特十字',
    season: '四季'
  }[spreadType] || '未知';

  // AI 系统提示词（占卜师人设）
  const systemPrompt = `你是一位神秘而睿智的塔罗牌占卜师，拥有数十年的塔罗解读经验。
你的解读风格：温柔而深邃，充满东方哲学智慧，语言优美诗意。
请用中文进行占卜解读，每次解读都要：
1. 对每张牌进行深入解析（考虑正逆位含义）
2. 结合所有牌的整体能量与关联
3. 给出具体且有建设性的建议
4. 语言富有诗意，但不要过于玄幻
5. 全文（包含所有小节标题）严格控制在800字以内，避免内容被截断`;

  // 四季牌阵有固定的花色→含义对应关系，需要单独告诉AI，否则它不知道这个牌阵的特殊规则
  const seasonContext = spreadType === 'season' ? `

【四季牌阵专属解读框架，请严格按此对应关系解读】
四季牌阵只在二分二至（春分、夏至、秋分、冬至）当天进行，这四天太阳能量转换，牌阵的能量格外强，
用来预测这一季度的运势走向与需要留意的地方。每个位置的花色含义固定，不要按普通牌阵的方式泛泛解读：
- 权杖牌（左）：代表行动、欲念与能量运用的信息
- 圣杯牌（下）：代表情感状态
- 宝剑牌（右）：代表思维状态、理性、人际关系
- 星币牌（上）：代表工作、物质、生活及健康
- 大阿卡纳牌（中）：是整个季度的关键点，代表能量与灵性成长，以及需要学习和关注的地方，并影响着整个牌阵
请先逐张按上述对应关系解读，再综合大阿卡纳牌点出的关键主题，给出本季度的整体建议。` : '';

  // 用户提示词（包含牌面信息）
  const userPrompt = `问卜者的问题：${question || '请为我进行综合占卜'}

抽到的牌面（${spreadLabel}牌阵）：
${cardDescriptions}
${seasonContext}

请对以上塔罗牌进行深入解读，给出完整的占卜结果和人生建议。`;

  // 设置 SSE 响应头（流式输出必须）
  // ⚠️ Nginx 反代需配置 proxy_buffering off 否则会变成一次性返回
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const aiConfig = getAIClientConfig();

    // ----------------------------------------
    // OpenAI 兼容模式（openai / deepseek / gemini）
    // DeepSeek 和 Gemini 均兼容 OpenAI 接口格式
    // 只需切换 baseURL 和 apiKey，无需安装额外 SDK
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
        max_tokens: 5000,
        temperature: 0.85,
        stream: true,
      });

      let finishReason = null;
      for await (const chunk of stream) {
        const choice = chunk.choices[0];
        const content = choice?.delta?.content || '';
        if (content) {
          res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
        }
        if (choice?.finish_reason) finishReason = choice.finish_reason;
      }

      // finish_reason === 'length' 说明是被 max_tokens 截断的，不是正常说完
      // 给个明确提示，别让用户以为是网站坏了
      if (finishReason === 'length') {
        res.write(`data: ${JSON.stringify({ text: '\n\n*（因长度限制，解读到此为止，可点击"再次占卜"获取更精炼的解读）*' })}\n\n`);
      }

    // ----------------------------------------
    // Claude 原生 SDK（Anthropic）
    // 需要单独安装：npm install @anthropic-ai/sdk
    // ----------------------------------------
    } else if (aiConfig.type === 'claude') {
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({
        apiKey: aiConfig.apiKey,
        baseURL: aiConfig.baseURL,
      });

      const stream = await client.messages.stream({
        model: aiConfig.model,
        max_tokens: 5000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      let stopReason = null;
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
        if (event.type === 'message_delta' && event.delta?.stop_reason) {
          stopReason = event.delta.stop_reason;
        }
      }

      if (stopReason === 'max_tokens') {
        res.write(`data: ${JSON.stringify({ text: '\n\n*（因长度限制，解读到此为止，可点击"再次占卜"获取更精炼的解读）*' })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    // ⚠️ 安全关键：只把错误记录到服务器日志，绝对不把原始错误发给前端
    // 原始错误可能包含 API Key 的前四位和后四位（如 sk-ab12****yz89）
    // 如果直接发给前端，用户可以在浏览器控制台或抓包工具中看到 Key 特征
    console.error('AI调用错误（仅服务端可见）:', error.message);

    // 前端只收到通用提示，不包含任何敏感信息
    res.write(`data: ${JSON.stringify({ error: 'AI解读服务暂时不可用，请稍后再试' })}\n\n`);
    res.end();
  }
});

// 静态文件（前端页面由 Express 托管）
app.use(express.static('public'));

// 启动服务
app.listen(PORT, () => {
  const limit = parseInt(process.env.AI_DAILY_LIMIT) || 2;
  console.log(`🔮 AI塔罗服务运行于 http://localhost:${PORT}`);
  // ⚠️ 安全：启动日志不输出 AI_PROVIDER 和 API Key，防止日志泄露
  console.log(`🛡️  每IP每24小时限制调用AI: ${limit}次`);
  console.log(`🌐 跨域允许来源: ${process.env.ALLOWED_ORIGIN || '*'}`);
});

// ============================================================
// 💡 常用修改说明：
//
// 改时间窗口：找到 windowMs 那行，把 24 改成需要的小时数
//             同时把下面 error 提示文字里的"每24小时"也改掉
//
// 改每IP次数：在 .env 里改 AI_DAILY_LIMIT=5，无需改代码
//
// 改AI提供商：在 .env 里改 AI_PROVIDER=deepseek，无需改代码
//
// 进阶持久化：如需容器重启后限流数据不丢失，可改用 Redis
//             安装：npm install ioredis
//             替换 aiCallStore 相关逻辑为 Redis INCR + EXPIRE
// ============================================================
