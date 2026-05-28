来源：https://www.ta-ku.top/blog/ai-tarot-web
# 🔮 AI 塔罗牌占卜网站 — 完整部署教程

> 技术栈：Node.js + Express + OpenAI/Claude API + Docker + aaPanel (宝塔面板) + Nginx  
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

---

## 一、后端源码

### 1.1 `backend/package.json`

```json
{
  "name": "ai-tarot-backend",
  "version": "1.0.0",
  "description": "AI Tarot Divination Backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "openai": "^4.20.1",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

### 1.2 `backend/.env`

```yaml
# =============================================
# AI 提供商选择: openai | deepseek | gemini | claude
# =============================================
AI_PROVIDER=deepseek

# =============================================
# 除去你选择的AI模型配置以外，其他模型全部注释掉
# =============================================

# =============================================
# OpenAI 配置
# =============================================
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# =============================================
# DeepSeek 配置（接口兼容 OpenAI 格式）
# =============================================
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
# 也可以用推理模型：deepseek-reasoner

# =============================================
# Gemini 配置（Google AI，兼容 OpenAI 格式）
# =============================================
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
GEMINI_MODEL=gemini-2.0-flash

# =============================================
# Claude (Anthropic) 配置
# =============================================
CLAUDE_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLAUDE_BASE_URL=https://api.anthropic.com
CLAUDE_MODEL=claude-sonnet-4-20250514

# =============================================
# 服务配置
# =============================================
PORT=3000

# 每分钟最大请求次数（防滥用）
RATE_LIMIT=20

# 跨域允许来源（生产环境改为你的域名或者*）
ALLOWED_ORIGIN=https://你的域名.com

NODE_ENV=production

# =============================================
# 填写完该配置的信息后，复制.env文件到“ai-tarot”主目录内
# =============================================
```

---

### 1.3 `backend/tarot-data.js`（78张完整塔罗牌数据）

```javascript
// 78张塔罗牌完整数据
const tarotCards = [
  // === 大阿卡纳 (0-21) ===
  {
    id: 0, name: "愚者", nameEn: "The Fool", suit: "major",
    upright: "新开始、冒险、自由、纯真、自发性",
    reversed: "鲁莽、冒险、冒失、不负责任",
    image: "🃏",
    description: "愚者代表着纯粹的潜能与无限可能，站在悬崖边上却毫无恐惧。"
  },
  {
    id: 1, name: "魔术师", nameEn: "The Magician", suit: "major",
    upright: "意志力、技巧、能力、创造力、资源",
    reversed: "技能滥用、欺骗、资源浪费",
    image: "🎩",
    description: "魔术师象征着将潜能转化为现实的力量，掌握四元素之力。"
  },
  {
    id: 2, name: "女祭司", nameEn: "The High Priestess", suit: "major",
    upright: "直觉、神秘、内在知识、潜意识",
    reversed: "压抑直觉、隐藏议程、信息封锁",
    image: "🌙",
    description: "女祭司守护着神秘与直觉的门户，连接意识与潜意识。"
  },
  {
    id: 3, name: "女皇", nameEn: "The Empress", suit: "major",
    upright: "丰盛、母性、自然、美丽、创造力",
    reversed: "依赖、窒息、创造力阻滞",
    image: "👑",
    description: "女皇象征着大自然的丰饶与孕育万物的母性力量。"
  },
  {
    id: 4, name: "皇帝", nameEn: "The Emperor", suit: "major",
    upright: "权威、结构、稳定、父性、领导",
    reversed: "专制、死板、控制欲、缺乏灵活",
    image: "⚔️",
    description: "皇帝代表着秩序、权威与建立稳固基础的力量。"
  },
  {
    id: 5, name: "教皇", nameEn: "The Hierophant", suit: "major",
    upright: "传统、信仰、教育、导师、习俗",
    reversed: "教条、反传统、挑战体制",
    image: "⛪",
    description: "教皇是精神导师，连接神圣智慧与世俗信仰的桥梁。"
  },
  {
    id: 6, name: "恋人", nameEn: "The Lovers", suit: "major",
    upright: "爱情、和谐、关系、价值观、选择",
    reversed: "失衡、不和谐、错误选择",
    image: "❤️",
    description: "恋人牌代表重要的选择，往往关乎心灵与价值观的结合。"
  },
  {
    id: 7, name: "战车", nameEn: "The Chariot", suit: "major",
    upright: "控制、意志力、胜利、断言、决心",
    reversed: "缺乏控制、攻击性、方向缺失",
    image: "🏆",
    description: "战车象征着通过意志力与自律克服障碍走向胜利。"
  },
  {
    id: 8, name: "力量", nameEn: "Strength", suit: "major",
    upright: "内在力量、勇气、耐心、温和、自信",
    reversed: "不安全感、软弱、缺乏自律",
    image: "🦁",
    description: "力量牌展示用温柔与慈悲驯服内在野性的高超智慧。"
  },
  {
    id: 9, name: "隐者", nameEn: "The Hermit", suit: "major",
    upright: "内省、独处、智慧、内心引导、反思",
    reversed: "孤立、逃避、过度内省",
    image: "🔦",
    description: "隐者独自行走，以内在之光照亮黑暗，寻求内心真相。"
  },
  {
    id: 10, name: "命运之轮", nameEn: "Wheel of Fortune", suit: "major",
    upright: "好运、命运、转折点、循环、机遇",
    reversed: "坏运气、缺乏控制、命运多舛",
    image: "☸️",
    description: "命运之轮永恒转动，提醒我们一切皆在变化之中。"
  },
  {
    id: 11, name: "正义", nameEn: "Justice", suit: "major",
    upright: "公平、真相、因果、法律、诚实",
    reversed: "不公平、不诚实、逃避责任",
    image: "⚖️",
    description: "正义牌代表宇宙法则中的平衡与因果报应。"
  },
  {
    id: 12, name: "倒吊人", nameEn: "The Hanged Man", suit: "major",
    upright: "暂停、放弃、新视角、启示、等待",
    reversed: "拖延、抵制、无谓牺牲",
    image: "🙃",
    description: "倒吊人选择自愿暂停，从不同角度获得新的启示与觉知。"
  },
  {
    id: 13, name: "死神", nameEn: "Death", suit: "major",
    upright: "结束、转变、过渡、放下、变革",
    reversed: "抗拒变化、停滞不前、无法放手",
    image: "💀",
    description: "死神并非字面意义，而是代表旧事物的终结与新生的开始。"
  },
  {
    id: 14, name: "节制", nameEn: "Temperance", suit: "major",
    upright: "平衡、节制、耐心、调和、目标",
    reversed: "失衡、过度、自我治愈",
    image: "🌊",
    description: "节制天使将水在两个杯子间流动，象征完美的平衡与和谐。"
  },
  {
    id: 15, name: "恶魔", nameEn: "The Devil", suit: "major",
    upright: "束缚、执念、成瘾、物质主义、阴影",
    reversed: "解放、摆脱束缚、恢复力量",
    image: "😈",
    description: "恶魔揭示我们如何被自己的执念与恐惧所囚禁。"
  },
  {
    id: 16, name: "塔", nameEn: "The Tower", suit: "major",
    upright: "突然变化、混乱、启示、觉醒、崩塌",
    reversed: "避免灾难、延迟崩塌、恐惧改变",
    image: "🗼",
    description: "高塔在闪电中崩塌，代表虚假基础的毁灭与真相的显现。"
  },
  {
    id: 17, name: "星星", nameEn: "The Star", suit: "major",
    upright: "希望、信念、目标、灵感、宁静",
    reversed: "绝望、失去信念、悲观",
    image: "⭐",
    description: "星星在夜空中闪耀，为经历黑暗的旅者带来希望与疗愈。"
  },
  {
    id: 18, name: "月亮", nameEn: "The Moon", suit: "major",
    upright: "幻觉、恐惧、潜意识、直觉、混乱",
    reversed: "克服恐惧、压制直觉、真相揭露",
    image: "🌕",
    description: "月亮笼罩着神秘的阴影，提醒我们面对内心的恐惧与幻觉。"
  },
  {
    id: 19, name: "太阳", nameEn: "The Sun", suit: "major",
    upright: "正能量、欢乐、成功、活力、乐观",
    reversed: "悲观、缺乏热情、暂时的阻碍",
    image: "☀️",
    description: "太阳普照大地，带来无尽的能量、欢乐与真实的自我展现。"
  },
  {
    id: 20, name: "审判", nameEn: "Judgement", suit: "major",
    upright: "反思、清算、觉醒、赦免、内在呼唤",
    reversed: "自我怀疑、内在批判、忽视召唤",
    image: "📯",
    description: "审判天使吹响号角，召唤我们聆听更高层次的内在呼唤。"
  },
  {
    id: 21, name: "世界", nameEn: "The World", suit: "major",
    upright: "完成、整合、成就、旅程终点、圆满",
    reversed: "未完成、不圆满、延迟",
    image: "🌍",
    description: "世界牌代表一段旅程的圆满完成与下一段旅程的开启。"
  },

  // === 小阿卡纳 — 权杖 (Wands) ===
  { id: 22, name: "权杖一", nameEn: "Ace of Wands", suit: "wands", upright: "灵感、力量、创造力、新冒险", reversed: "缺乏动力、创意受阻、延迟", image: "🪄", description: "权杖一象征着原始的热情与创造力的火花" },
  { id: 23, name: "权杖二", nameEn: "Two of Wands", suit: "wands", upright: "未来计划、进步、探索、决策", reversed: "恐惧未知、拖延计划", image: "🗺️", description: "站在高处展望未来，权杖二代表规划与抱负" },
  { id: 24, name: "权杖三", nameEn: "Three of Wands", suit: "wands", upright: "扩张、领先、贸易、远见", reversed: "挫折、障碍、延迟", image: "⛵", description: "权杖三看着船只驶向远方，代表扩张与前景" },
  { id: 25, name: "权杖四", nameEn: "Four of Wands", suit: "wands", upright: "庆祝、和谐、家庭、社区、团聚", reversed: "家庭不和、缺乏支持", image: "🎊", description: "权杖四是庆典与和谐家庭生活的象征" },
  { id: 26, name: "权杖五", nameEn: "Five of Wands", suit: "wands", upright: "冲突、分歧、竞争、压力", reversed: "内部冲突、避免竞争", image: "⚡", description: "权杖五展示激烈的竞争与混乱的冲突" },
  { id: 27, name: "权杖六", nameEn: "Six of Wands", suit: "wands", upright: "公众认可、胜利、进步、自信", reversed: "私下成功、傲慢、跌落", image: "🏇", description: "权杖六代表在众人面前取得胜利与认可" },
  { id: 28, name: "权杖七", nameEn: "Seven of Wands", suit: "wands", upright: "挑战、坚持、防御、保护立场", reversed: "退缩、无法坚持", image: "🛡️", description: "权杖七是在挑战中坚守自己立场的勇气" },
  { id: 29, name: "权杖八", nameEn: "Eight of Wands", suit: "wands", upright: "速度、行动、空中旅行、快速变化", reversed: "拖延、无方向", image: "🚀", description: "权杖八代表快速的行动与事情的快速推进" },
  { id: 30, name: "权杖九", nameEn: "Nine of Wands", suit: "wands", upright: "韧性、耐力、坚持、边界", reversed: "疲惫、放弃、偏执", image: "🔋", description: "权杖九虽已疲惫但仍坚守阵地" },
  { id: 31, name: "权杖十", nameEn: "Ten of Wands", suit: "wands", upright: "负担、责任、压力、承担过多", reversed: "放下负担、委派任务", image: "😰", description: "权杖十代表沉重的负担与过多的责任" },
  { id: 32, name: "权杖侍从", nameEn: "Page of Wands", suit: "wands", upright: "探索、兴奋、新想法、创造力", reversed: "有始无终、思维混乱", image: "🌱", description: "权杖侍从充满热情地探索新鲜事物" },
  { id: 33, name: "权杖骑士", nameEn: "Knight of Wands", suit: "wands", upright: "行动、冒险、冲动、自信", reversed: "冒失、鲁莽、争强好胜", image: "🐎", description: "权杖骑士以风驰电掣的速度冲向冒险" },
  { id: 34, name: "权杖皇后", nameEn: "Queen of Wands", suit: "wands", upright: "自信、独立、社交、热情", reversed: "嫉妒、自私、不安全感", image: "🌻", description: "权杖皇后充满魅力与自信，散发光芒" },
  { id: 35, name: "权杖国王", nameEn: "King of Wands", suit: "wands", upright: "领导力、远见、企业家精神", reversed: "专横、傲慢、独断", image: "🔥", description: "权杖国王是充满远见的领袖与创业者" },

  // === 小阿卡纳 — 圣杯 (Cups) ===
  { id: 36, name: "圣杯一", nameEn: "Ace of Cups", suit: "cups", upright: "新的爱、直觉、创造力、灵性", reversed: "压抑情感、内心空虚", image: "💧", description: "圣杯一是爱与情感的纯粹源泉" },
  { id: 37, name: "圣杯二", nameEn: "Two of Cups", suit: "cups", upright: "统一、伙伴关系、相互吸引、爱", reversed: "失衡关系、误解、分离", image: "💑", description: "圣杯二代表两颗心灵的深度连接与相互吸引" },
  { id: 38, name: "圣杯三", nameEn: "Three of Cups", suit: "cups", upright: "庆祝、友谊、创造力、社群", reversed: "过度放纵、流言蜚语", image: "🥂", description: "圣杯三是朋友相聚庆祝的快乐时光" },
  { id: 39, name: "圣杯四", nameEn: "Four of Cups", suit: "cups", upright: "沉思、冥想、不满、漠然", reversed: "重新审视、抓住机会", image: "😶", description: "圣杯四是对眼前事物感到厌倦的沉思状态" },
  { id: 40, name: "圣杯五", nameEn: "Five of Cups", suit: "cups", upright: "悔恨、失落、失望、悲伤", reversed: "走出悲伤、接受损失", image: "😢", description: "圣杯五只见倒下的杯子，忽略了仍立着的" },
  { id: 41, name: "圣杯六", nameEn: "Six of Cups", suit: "cups", upright: "回忆、童年、纯真、怀旧", reversed: "停留过去、天真", image: "🌸", description: "圣杯六唤起美好的童年记忆与纯真" },
  { id: 42, name: "圣杯七", nameEn: "Seven of Cups", suit: "cups", upright: "幻觉、选择、白日梦、愿望", reversed: "清醒、对齐优先事项", image: "💭", description: "圣杯七展示众多的幻想与难以抉择" },
  { id: 43, name: "圣杯八", nameEn: "Eight of Cups", suit: "cups", upright: "离开、放弃、出走、寻找更深意义", reversed: "犹豫不决、坚守不满", image: "🌌", description: "圣杯八代表转身离开，追寻更深层的意义" },
  { id: 44, name: "圣杯九", nameEn: "Nine of Cups", suit: "cups", upright: "满足、成就、愿望成真、奢华", reversed: "物质主义、不满足", image: "🌟", description: "圣杯九是心愿成真与深度满足感" },
  { id: 45, name: "圣杯十", nameEn: "Ten of Cups", suit: "cups", upright: "幸福、家庭和谐、圆满、整合", reversed: "家庭纷争、破碎", image: "🏡", description: "圣杯十代表情感的圆满与幸福的家庭生活" },
  { id: 46, name: "圣杯侍从", nameEn: "Page of Cups", suit: "cups", upright: "创造性机会、直觉、好奇", reversed: "情感不成熟", image: "🐟", description: "圣杯侍从对情感世界充满好奇" },
  { id: 47, name: "圣杯骑士", nameEn: "Knight of Cups", suit: "cups", upright: "浪漫、魅力、想象力、追求理想", reversed: "幻想、情绪化", image: "🦢", description: "圣杯骑士是浪漫的理想主义者" },
  { id: 48, name: "圣杯皇后", nameEn: "Queen of Cups", suit: "cups", upright: "慈悲、关怀、情感安全、直觉", reversed: "情绪化、不安全感", image: "🌊", description: "圣杯皇后以深沉的慈悲与直觉滋养他人" },
  { id: 49, name: "圣杯国王", nameEn: "King of Cups", suit: "cups", upright: "情感平衡、慷慨、外交、创意", reversed: "情绪化、压力下崩溃", image: "🌀", description: "圣杯国王在波涛中保持情感的平静与智慧" },

  // === 小阿卡纳 — 宝剑 (Swords) ===
  { id: 50, name: "宝剑一", nameEn: "Ace of Swords", suit: "swords", upright: "突破、清晰、锐利的头脑、真相", reversed: "混乱、错误信息", image: "⚔️", description: "宝剑一象征着思想的力量与真理的揭示" },
  { id: 51, name: "宝剑二", nameEn: "Two of Swords", suit: "swords", upright: "困难的选择、优柔寡断、僵局", reversed: "优柔寡断、信息过载", image: "🙈", description: "宝剑二面对两难困境，蒙眼以寻内心答案" },
  { id: 52, name: "宝剑三", nameEn: "Three of Swords", suit: "swords", upright: "心碎、悲伤、痛苦、悲哀", reversed: "走出痛苦、宽恕", image: "💔", description: "宝剑三代表深深的心灵创伤与情感痛苦" },
  { id: 53, name: "宝剑四", nameEn: "Four of Swords", suit: "swords", upright: "休息、恢复、冥想、静养", reversed: "精疲力竭、无法休息", image: "😴", description: "宝剑四是经历风暴后必要的休养与恢复" },
  { id: 54, name: "宝剑五", nameEn: "Five of Swords", suit: "swords", upright: "冲突、失败、紧张、对抗", reversed: "和解、走出冲突", image: "🏴", description: "宝剑五是残酷的胜利，但代价高昂" },
  { id: 55, name: "宝剑六", nameEn: "Six of Swords", suit: "swords", upright: "过渡、变化、旅行、逃离", reversed: "无法离开、抵制变化", image: "⛵", description: "宝剑六代表从动荡中走向平静的过渡旅程" },
  { id: 56, name: "宝剑七", nameEn: "Seven of Swords", suit: "swords", upright: "欺骗、战略、偷偷摸摸", reversed: "欺骗暴露、良心发现", image: "🦊", description: "宝剑七代表机智的策略，但可能涉及欺骗" },
  { id: 57, name: "宝剑八", nameEn: "Eight of Swords", suit: "swords", upright: "困境、受限、被困、自我束缚", reversed: "释放自我、走出困境", image: "🔒", description: "宝剑八展示自我施加的精神束缚" },
  { id: 58, name: "宝剑九", nameEn: "Nine of Swords", suit: "swords", upright: "焦虑、恐惧、噩梦、绝望", reversed: "找到希望、面对恐惧", image: "😰", description: "宝剑九是深夜惊醒时的极度焦虑与担忧" },
  { id: 59, name: "宝剑十", nameEn: "Ten of Swords", suit: "swords", upright: "失败、背叛、结束、危机", reversed: "曙光、好转", image: "🌅", description: "宝剑十是最艰难的终点，同时也是黎明的前兆" },
  { id: 60, name: "宝剑侍从", nameEn: "Page of Swords", suit: "swords", upright: "好奇、思维敏捷、学习", reversed: "鲁莽、言语伤人", image: "🔍", description: "宝剑侍从用敏锐的思维探索世界" },
  { id: 61, name: "宝剑骑士", nameEn: "Knight of Swords", suit: "swords", upright: "冲动、快速行动、有抱负", reversed: "鲁莽、攻击性", image: "💨", description: "宝剑骑士以风一般的速度冲向目标" },
  { id: 62, name: "宝剑皇后", nameEn: "Queen of Swords", suit: "swords", upright: "独立、不偏不倚、清晰、正直", reversed: "冷酷、刻薄", image: "🧊", description: "宝剑皇后以冷静理性和直接的方式处理事务" },
  { id: 63, name: "宝剑国王", nameEn: "King of Swords", suit: "swords", upright: "权威、清晰思维、知识、领导", reversed: "独裁、操纵", image: "🏛️", description: "宝剑国王以智慧与道德权威统治" },

  // === 小阿卡纳 — 星币 (Pentacles) ===
  { id: 64, name: "星币一", nameEn: "Ace of Pentacles", suit: "pentacles", upright: "新的财务机会、繁荣、新开端", reversed: "错失机会、财务不稳定", image: "🪙", description: "星币一代表财富与繁荣的种子" },
  { id: 65, name: "星币二", nameEn: "Two of Pentacles", suit: "pentacles", upright: "平衡、适应、时间管理", reversed: "失衡、混乱", image: "🎭", description: "星币二是在生活多方面中保持灵活平衡" },
  { id: 66, name: "星币三", nameEn: "Three of Pentacles", suit: "pentacles", upright: "团队合作、合作、学习", reversed: "缺乏合作、团队不和", image: "🏗️", description: "星币三代表协作建造伟大事业" },
  { id: 67, name: "星币四", nameEn: "Four of Pentacles", suit: "pentacles", upright: "安全、守旧、保守、节俭", reversed: "挥霍、贪婪", image: "💎", description: "星币四紧抱财富，代表物质安全感" },
  { id: 68, name: "星币五", nameEn: "Five of Pentacles", suit: "pentacles", upright: "财务困难、贫困、逆境", reversed: "财务恢复、走出困境", image: "❄️", description: "星币五象征物质困难与精神孤独" },
  { id: 69, name: "星币六", nameEn: "Six of Pentacles", suit: "pentacles", upright: "慷慨、分享、给予与接受", reversed: "自私、债务", image: "🤲", description: "星币六代表慷慨地给予与平衡地接受" },
  { id: 70, name: "星币七", nameEn: "Seven of Pentacles", suit: "pentacles", upright: "长期愿景、毅力、耐心投资", reversed: "缺乏远见、无报酬", image: "🌿", description: "星币七是耐心等待努力结出硕果" },
  { id: 71, name: "星币八", nameEn: "Eight of Pentacles", suit: "pentacles", upright: "勤奋、技能、细心、学徒", reversed: "缺乏专注、媒介", image: "⚒️", description: "星币八代表专注磨砺技艺的工匠精神" },
  { id: 72, name: "星币九", nameEn: "Nine of Pentacles", suit: "pentacles", upright: "富裕、奢华、自给自足", reversed: "工作过度、物质主义", image: "🌺", description: "星币九代表通过努力实现的物质富裕与自我满足" },
  { id: 73, name: "星币十", nameEn: "Ten of Pentacles", suit: "pentacles", upright: "财富、财务安全、家庭、遗产", reversed: "失去财富、家庭纠纷", image: "🏰", description: "星币十代表世代相传的财富与稳固的家族传承" },
  { id: 74, name: "星币侍从", nameEn: "Page of Pentacles", suit: "pentacles", upright: "机会、目标、技能发展", reversed: "缺乏进步、学习迟缓", image: "📚", description: "星币侍从是热衷学习实用技能的年轻人" },
  { id: 75, name: "星币骑士", nameEn: "Knight of Pentacles", suit: "pentacles", upright: "勤奋、可靠、尽职", reversed: "固执、工作狂", image: "🐂", description: "星币骑士以稳健踏实的步伐走向目标" },
  { id: 76, name: "星币皇后", nameEn: "Queen of Pentacles", suit: "pentacles", upright: "实用、宽厚、务实、养育", reversed: "自我放纵、嫉妒", image: "🌾", description: "星币皇后以实际的方式给予温暖的关怀" },
  { id: 77, name: "星币国王", nameEn: "King of Pentacles", suit: "pentacles", upright: "财富、商业、领导、安全", reversed: "顽固、物质主义", image: "👑", description: "星币国王是商业帝国的创建者与守护者" }
];

// 随机抽取指定数量的牌
function drawCards(count) {
  const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(card => ({
    ...card,
    isReversed: Math.random() > 0.5
  }));
}

// 根据牌阵获取位置含义
function getSpreadPositions(spreadType) {
  const spreads = {
    single: ["当前状况"],
    three: ["过去", "现在", "未来"],
    celtic: ["当前状况", "挑战/阻碍", "远因/基础", "近因/过去", "可能的结果/未来", "你的态度", "外部影响", "希望与恐惧", "建议", "最终结果"]
  };
  return spreads[spreadType] || spreads.single;
}

module.exports = { tarotCards, drawCards, getSpreadPositions };
```

---

### 1.4 `backend/server.js`

```javascript
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

// 限流
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT) || 20,
  message: { error: '请求过于频繁，请稍后再试' }
});
app.use('/api/', limiter);

// ===== 统一 AI 配置工厂 =====
// 根据 .env 中的 AI_PROVIDER 自动选择对应客户端配置
// 支持: openai | deepseek | gemini | claude
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

// 抽牌接口
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
app.post('/api/interpret', async (req, res) => {
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
  console.log(`🔮 AI塔罗服务运行于 http://localhost:${PORT}`);
  console.log(`📡 当前AI提供商: ${provider}`);
  console.log(`🌐 跨域允许来源: ${process.env.ALLOWED_ORIGIN || '*'}`);
});

```

---

## 二、前端源码

### 2.1 `frontend/index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔮 神秘塔罗 · AI占卜</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- 星星背景 -->
  <div class="stars" id="stars"></div>

  <!-- 顶部标题 -->
  <header class="header">
    <div class="logo">🔮</div>
    <h1 class="title">神秘塔罗</h1>
    <p class="subtitle">AI · 占卜 · 启示</p>
  </header>

  <!-- 主容器 -->
  <main class="main">

    <!-- 问题输入区 -->
    <section class="question-section glass-card">
      <h2>✨ 请将心中的问题告知星辰</h2>
      <textarea
        id="questionInput"
        class="question-input"
        placeholder="你可以问关于爱情、事业、人生方向……或者什么都不问，让塔罗为你揭示当下的能量"
        maxlength="200"
        rows="3"
      ></textarea>
      <div class="char-count"><span id="charCount">0</span>/200</div>
    </section>

    <!-- 牌阵选择 -->
    <section class="spread-section">
      <h2>🃏 选择牌阵</h2>
      <div class="spread-buttons">
        <button class="spread-btn active" data-spread="single">
          <span class="spread-icon">🌙</span>
          <span class="spread-name">单张牌</span>
          <span class="spread-desc">快速洞察当下</span>
        </button>
        <button class="spread-btn" data-spread="three">
          <span class="spread-icon">⭐</span>
          <span class="spread-name">时间三张</span>
          <span class="spread-desc">过去·现在·未来</span>
        </button>
        <button class="spread-btn" data-spread="celtic">
          <span class="spread-icon">🌟</span>
          <span class="spread-name">凯尔特十字</span>
          <span class="spread-desc">全面深度解析</span>
        </button>
      </div>
    </section>

    <!-- 开始占卜按钮 -->
    <div class="divination-btn-container">
      <button id="divinationBtn" class="divination-btn">
        <span class="btn-orb"></span>
        <span class="btn-text">✨ 开启占卜</span>
      </button>
    </div>

    <!-- 牌面展示区 -->
    <section class="cards-section" id="cardsSection" style="display:none">
      <h2 class="section-title">🌟 命运之牌</h2>
      <div class="cards-grid" id="cardsGrid"></div>
    </section>

    <!-- AI解读区 -->
    <section class="interpretation-section glass-card" id="interpretationSection" style="display:none">
      <div class="interpretation-header">
        <div class="oracle-avatar">🔮</div>
        <div>
          <h2>神谕解读</h2>
          <p class="oracle-title">— 星辰传话，命运低语 —</p>
        </div>
      </div>
      <div class="interpretation-text" id="interpretationText">
        <div class="loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      <button id="resetBtn" class="reset-btn" style="display:none">🔄 再次占卜</button>
    </section>

  </main>

  <!-- 底部 -->
  <footer class="footer">
    <p>🌙 塔罗仅供参考，人生由你掌舵 · Powered by AI</p>
  </footer>

  <script src="app.js"></script>
</body>
</html>
```

---

### 2.2 `frontend/style.css`

```css
:root {
  --bg-deep: #0a0612;
  --bg-mid: #120824;
  --gold: #d4a843;
  --gold-light: #f0c96b;
  --purple: #7b3fa0;
  --purple-light: #a855f7;
  --mystic-blue: #1e3a5f;
  --text-main: #e8dfc8;
  --text-muted: #9c8a6e;
  --glass-bg: rgba(255,255,255,0.04);
  --glass-border: rgba(212,168,67,0.15);
  --card-bg: #1a0f2e;
  --card-border: rgba(212,168,67,0.3);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Noto Serif SC', serif;
  background: var(--bg-deep);
  color: var(--text-main);
  min-height: 100vh;
  overflow-x: hidden;
}

/* 星星 */
.stars {
  position: fixed; top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none; z-index: 0;
}
.star {
  position: absolute;
  width: 2px; height: 2px;
  background: white;
  border-radius: 50%;
  animation: twinkle var(--dur) var(--delay) infinite alternate;
}
@keyframes twinkle {
  from { opacity: 0.1; transform: scale(1); }
  to { opacity: 0.9; transform: scale(1.5); }
}

/* 顶部 */
.header {
  position: relative; z-index: 1;
  text-align: center;
  padding: 3rem 1rem 1.5rem;
  background: radial-gradient(ellipse at top, rgba(123,63,160,0.3) 0%, transparent 70%);
}
.logo {
  font-size: 4rem;
  animation: float 4s ease-in-out infinite;
  display: block; margin-bottom: 0.5rem;
}
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(-5deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
}
.title {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: clamp(2rem, 6vw, 4rem);
  background: linear-gradient(135deg, var(--gold), var(--purple-light), var(--gold-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  letter-spacing: 0.2em;
}
.subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  letter-spacing: 0.5em;
  margin-top: 0.3rem;
}

/* 主体 */
.main {
  position: relative; z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 1rem 1.5rem 4rem;
}

/* 玻璃卡片 */
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

/* 问题区 */
.question-section h2 {
  font-size: 1.1rem;
  color: var(--gold-light);
  margin-bottom: 1rem;
  font-weight: 300;
  letter-spacing: 0.05em;
}
.question-input {
  width: 100%;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 1rem;
  color: var(--text-main);
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  resize: none;
  transition: border-color 0.3s;
}
.question-input:focus {
  outline: none;
  border-color: var(--gold);
}
.question-input::placeholder { color: var(--text-muted); }
.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.4rem;
}

/* 牌阵按钮 */
.spread-section { margin-bottom: 2rem; }
.spread-section h2 {
  font-size: 1.1rem;
  color: var(--gold-light);
  margin-bottom: 1rem;
  font-weight: 300;
  letter-spacing: 0.05em;
  text-align: center;
}
.spread-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.spread-btn {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 1.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
  display: flex; flex-direction: column;
  align-items: center; gap: 0.4rem;
  color: var(--text-main);
  font-family: inherit;
}
.spread-btn:hover {
  border-color: var(--gold);
  background: rgba(212,168,67,0.1);
  transform: translateY(-2px);
}
.spread-btn.active {
  border-color: var(--gold);
  background: rgba(212,168,67,0.12);
  box-shadow: 0 0 20px rgba(212,168,67,0.2);
}
.spread-icon { font-size: 2rem; }
.spread-name { font-size: 1rem; font-weight: 600; color: var(--gold-light); }
.spread-desc { font-size: 0.78rem; color: var(--text-muted); }

/* 占卜按钮 */
.divination-btn-container { text-align: center; margin-bottom: 3rem; }
.divination-btn {
  position: relative;
  background: linear-gradient(135deg, #4a1a7a, #8b4513, #4a1a7a);
  background-size: 200%;
  border: 1px solid var(--gold);
  border-radius: 50px;
  padding: 1rem 3rem;
  font-size: 1.1rem;
  font-family: 'Ma Shan Zheng', cursive;
  color: var(--gold-light);
  cursor: pointer;
  letter-spacing: 0.1em;
  transition: all 0.3s;
  box-shadow: 0 0 30px rgba(212,168,67,0.2);
  animation: shimmer 3s linear infinite;
  overflow: hidden;
}
@keyframes shimmer {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
.divination-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 50px rgba(212,168,67,0.4);
}
.divination-btn:disabled {
  opacity: 0.5; cursor: not-allowed; transform: none;
}
.btn-orb {
  position: absolute;
  width: 100%; height: 100%;
  top: 0; left: -100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
  transition: left 0.5s;
}
.divination-btn:hover .btn-orb { left: 100%; }

/* 塔罗牌展示 */
.cards-section { margin-bottom: 2rem; }
.section-title {
  text-align: center;
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.5rem;
  color: var(--gold-light);
  margin-bottom: 1.5rem;
  letter-spacing: 0.1em;
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  justify-items: center;
}
.tarot-card {
  width: 140px;
  background: linear-gradient(135deg, #1a0b30, #2d1458);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 1.2rem 0.8rem;
  text-align: center;
  cursor: default;
  transition: transform 0.3s;
  position: relative;
  overflow: hidden;
  animation: cardReveal 0.6s ease-out both;
}
@keyframes cardReveal {
  from { opacity: 0; transform: rotateY(90deg) scale(0.8); }
  to { opacity: 1; transform: rotateY(0) scale(1); }
}
.tarot-card::before {
  content: '';
  position: absolute; top: 0; left: 0;
  right: 0; bottom: 0;
  background: radial-gradient(ellipse at top, rgba(212,168,67,0.05), transparent);
  pointer-events: none;
}
.tarot-card.reversed { transform: rotate(180deg); }
.tarot-card.reversed .card-position,
.tarot-card.reversed .card-reversed-badge { transform: rotate(180deg); }
.card-position {
  font-size: 0.65rem;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}
.card-emoji { font-size: 2.5rem; margin-bottom: 0.5rem; display: block; }
.card-name {
  font-size: 0.9rem;
  color: var(--gold-light);
  margin-bottom: 0.3rem;
  font-weight: 600;
}
.card-name-en {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.card-reversed-badge {
  display: inline-block;
  background: rgba(180, 50, 50, 0.3);
  border: 1px solid rgba(200,80,80,0.4);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
  font-size: 0.6rem;
  color: #ff8888;
  margin-bottom: 0.5rem;
}
.card-keywords {
  font-size: 0.65rem;
  color: var(--text-muted);
  line-height: 1.4;
}

/* AI解读 */
.interpretation-section { }
.interpretation-header {
  display: flex; align-items: center; gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--glass-border);
}
.oracle-avatar {
  font-size: 3rem;
  animation: pulse-glow 2s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%, 100% { filter: drop-shadow(0 0 10px rgba(212,168,67,0.5)); }
  50% { filter: drop-shadow(0 0 25px rgba(168,85,247,0.8)); }
}
.interpretation-header h2 {
  font-family: 'Ma Shan Zheng', cursive;
  font-size: 1.4rem;
  color: var(--gold-light);
  letter-spacing: 0.1em;
}
.oracle-title {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-top: 0.2rem;
}
.interpretation-text {
  line-height: 2;
  font-size: 1rem;
  color: var(--text-main);
  min-height: 100px;
  white-space: pre-wrap;
}
.loading-dots {
  display: flex; gap: 8px; align-items: center;
  padding: 1rem 0;
}
.loading-dots span {
  width: 8px; height: 8px;
  background: var(--gold);
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40% { transform: translateY(-10px); opacity: 1; }
}

.reset-btn {
  margin-top: 2rem;
  background: transparent;
  border: 1px solid var(--gold);
  border-radius: 8px;
  padding: 0.6rem 1.5rem;
  color: var(--gold);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.3s;
}
.reset-btn:hover {
  background: rgba(212,168,67,0.1);
}

/* 底部 */
.footer {
  position: relative; z-index: 1;
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-size: 0.8rem;
  border-top: 1px solid var(--glass-border);
}

/* 响应式 */
@media (max-width: 600px) {
  .spread-buttons { grid-template-columns: 1fr; }
  .cards-grid { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); }
  .tarot-card { width: 110px; padding: 0.8rem 0.5rem; }
}
```

---

### 2.3 `frontend/app.js`

```javascript
// API 地址（生产环境改为你的域名）
const API_BASE = window.location.origin;

let selectedSpread = 'single';
let isLoading = false;

// 生成星星背景
function generateStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 150; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      --dur: ${2 + Math.random() * 3}s;
      --delay: ${Math.random() * 4}s;
      opacity: ${0.2 + Math.random() * 0.6};
    `;
    container.appendChild(star);
  }
}

// 牌阵选择
document.querySelectorAll('.spread-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.spread-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSpread = btn.dataset.spread;
  });
});

// 字数统计
const questionInput = document.getElementById('questionInput');
const charCount = document.getElementById('charCount');
questionInput.addEventListener('input', () => {
  charCount.textContent = questionInput.value.length;
});

// 主占卜流程
document.getElementById('divinationBtn').addEventListener('click', async () => {
  if (isLoading) return;
  isLoading = true;

  const btn = document.getElementById('divinationBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = '🔮 命运轮转中...';

  const question = questionInput.value.trim();

  try {
    // 1. 抽牌
    const drawRes = await fetch(`${API_BASE}/api/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadType: selectedSpread })
    });

    if (!drawRes.ok) throw new Error('抽牌失败');
    const { cards, positions, spreadType } = await drawRes.json();

    // 2. 展示牌面
    displayCards(cards, positions);

    // 3. 展示解读区
    const interpSection = document.getElementById('interpretationSection');
    interpSection.style.display = 'block';
    interpSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const interpText = document.getElementById('interpretationText');
    interpText.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

    // 4. 流式解读
    const interpretRes = await fetch(`${API_BASE}/api/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards, positions, question, spreadType })
    });

    if (!interpretRes.ok) throw new Error('解读失败');

    interpText.textContent = '';
    const reader = interpretRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            interpText.textContent += parsed.text;
          }
          if (parsed.error) {
            interpText.textContent = parsed.error;
          }
        } catch {}
      }
    }

    document.getElementById('resetBtn').style.display = 'inline-block';

  } catch (err) {
    console.error(err);
    alert('占卜遇到问题：' + err.message + '\n请检查后端服务是否正常运行。');
  } finally {
    isLoading = false;
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = '✨ 开启占卜';
  }
});

// 展示牌面
function displayCards(cards, positions) {
  const section = document.getElementById('cardsSection');
  const grid = document.getElementById('cardsGrid');

  section.style.display = 'block';
  grid.innerHTML = '';

  cards.forEach((card, i) => {
    const keywords = card.isReversed ? card.reversed : card.upright;
    const el = document.createElement('div');
    el.className = `tarot-card ${card.isReversed ? 'reversed' : ''}`;
    el.style.animationDelay = `${i * 0.15}s`;
    el.innerHTML = `
      <div class="card-position">${positions[i] || `第${i+1}张`}</div>
      <span class="card-emoji">${card.image}</span>
      <div class="card-name">${card.name}</div>
      <div class="card-name-en">${card.nameEn}</div>
      ${card.isReversed ? '<span class="card-reversed-badge">逆位</span>' : ''}
      <div class="card-keywords">${keywords}</div>
    `;
    grid.appendChild(el);
  });

  section.scrollIntoView({ behavior: 'smooth' });
}

// 重置
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('cardsSection').style.display = 'none';
  document.getElementById('interpretationSection').style.display = 'none';
  document.getElementById('resetBtn').style.display = 'none';
  document.getElementById('interpretationText').textContent = '';
  document.getElementById('cardsGrid').innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 初始化
generateStars();
```

---

## 三、Docker 配置

### 3.1 `Dockerfile`

```dockerfile
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
```

---

### 3.2 `docker-compose.yml`

```yaml
version: '3.8'

services:
  tarot-app:
    build: .
    container_name: ai-tarot
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      # AI 配置（推荐使用 .env 文件）
      - AI_PROVIDER=${AI_PROVIDER:-openai}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - CLAUDE_MODEL=${CLAUDE_MODEL:-claude-sonnet-4-20250514}
      - PORT=3000
      - RATE_LIMIT=20
      - ALLOWED_ORIGIN=${ALLOWED_ORIGIN:-*}
      - NODE_ENV=production
    volumes:
      - tarot-logs:/app/logs
    networks:
      - tarot-net
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  tarot-net:
    driver: bridge

volumes:
  tarot-logs:
```

---

### 3.3 `nginx.conf`（反代配置）

```nginx
# 在aaPanel或其他服务器面板配置的话，不需要nginx.conf
# 直接删掉nginx.conf就可以
# nginx.conf 是给手动部署 Nginx 用的参考文件

server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名

    # 强制跳转HTTPS（申请SSL后启用）
    # return 301 https://$server_name$request_uri;

    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # 反向代理到 Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # SSE 流式响应（关键配置！）
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        chunked_transfer_encoding on;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|ico|woff2)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 1d;
        add_header Cache-Control "public, max-age=86400";
    }
}
```

---

## 四、aaPanel（宝塔面板）完整部署流程

### Step 1：服务器准备（Debian 12）

```bash
# 更新系统
apt update && apt upgrade -y

# 安装基础工具
apt install -y curl wget git vim ufw

# 防火墙放行
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 7800    # 宝塔面板端口
ufw enable
```

### Step 2：安装宝塔面板

```bash
# Debian/Ubuntu 安装命令
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh
bash install.sh ed8484bec

# 等待安装完成，记录以下输出：
# 面板地址：http://你的IP:7800/xxxxxxxxxxxx
# 用户名：xxxxxxxxxx
# 密码：xxxxxxxxxx
```

### Step 3：宝塔面板内安装软件

登录宝塔面板后：
1. **软件商店** → 安装 **Nginx**（推荐 1.24）
2. **软件商店** → 安装 **Node.js 版本管理器**，选择 **Node.js 20**
3. **软件商店** → 安装 **Docker 管理器**

### Step 4：安装 Docker 和 Docker Compose

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash -s docker

# 配置国内镜像加速（推荐）
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",
    "https://hub-mirror.c.163.com"
  ]
}
EOF

systemctl daemon-reload
systemctl restart docker
systemctl enable docker

# 安装 docker-compose
apt install -y docker-compose-plugin
docker compose version  # 验证
```

### Step 5：上传项目文件

**方法A：通过宝塔文件管理器上传**
- 宝塔面板 → 文件 → 上传项目压缩包到 `/www/wwwroot/ai-tarot/`
- 解压：右键 → 解压

**方法B：通过 Git**
```bash
cd /www/wwwroot
git clone https://github.com/你的用户名/ai-tarot.git
cd ai-tarot
```

### Step 6：配置环境变量

```bash
cd /www/wwwroot/ai-tarot

# 创建 .env 文件
cat > .env << 'EOF'
AI_PROVIDER=openai
OPENAI_API_KEY=sk-你的OpenAI密钥
OPENAI_MODEL=gpt-4o-mini
CLAUDE_API_KEY=sk-ant-你的Claude密钥
PORT=3000
RATE_LIMIT=20
ALLOWED_ORIGIN=https://你的域名.com
NODE_ENV=production
EOF

# 保护 .env 文件权限
chmod 600 .env

# 以上代码仅供参考，具体以backend下的.env为准
# 建议直接复制backend下的.env到ai-tarot主目录
```

### Step 7：Docker 构建和启动

```bash
cd /www/wwwroot/ai-tarot

# 构建镜像
docker compose build

# 后台启动
docker compose up -d

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 验证服务
curl http://localhost:3000/api/health
```

### Step 8：宝塔面板配置 Nginx 反代

1. **网站** → **添加站点**
   - 域名：`your-domain.com`
   - PHP版本：纯静态
   
2. **SSL** → **Let's Encrypt** → 申请免费证书（勾选强制HTTPS）

3. **网站设置** → **反向代理** → **添加反向代理**：
   - 代理名称：`tarot-proxy`
   - 目标URL：`http://127.0.0.1:3000`
   
4. **或者** 直接编辑 Nginx 配置文件，将 `nginx.conf` 内容粘贴进去。

⚠️ **关键**：SSE 流式响应需在 Nginx 配置中添加：
```nginx
proxy_buffering off;
proxy_cache off;
proxy_read_timeout 300s;
```

### Step 9：配置宝塔面板计划任务（自动重启）

宝塔面板 → **计划任务** → **添加任务**：
- 任务名称：`检查塔罗服务`
- 任务类型：`Shell脚本`
- 执行周期：每5分钟
- 脚本内容：
```bash
cd /www/wwwroot/ai-tarot
docker compose up -d 2>/dev/null || true
```

### Step 10：验证部署

```bash
# 测试 API
curl -X POST https://你的域名.com/api/draw \
  -H "Content-Type: application/json" \
  -d '{"spreadType":"three"}' | python3 -m json.tool

# 访问网站
# 浏览器打开 https://你的域名.com
```

---

## 五、使用 Claude API 替代 OpenAI

修改 `.env`：
```env
AI_PROVIDER=claude
CLAUDE_API_KEY=sk-ant-你的密钥
CLAUDE_MODEL=claude-sonnet-4-20250514
```

后端安装 SDK：
```bash
# 在 backend/package.json 中添加
npm install @anthropic-ai/sdk
```

然后重新 build：
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 六、常用运维命令

```bash
# 查看容器状态
docker compose ps

# 实时日志
docker compose logs -f

# 重启服务
docker compose restart

# 更新代码后重新部署
git pull
docker compose build
docker compose up -d

# 进入容器调试
docker exec -it ai-tarot sh

# 查看资源占用
docker stats ai-tarot

# 清理未使用镜像
docker image prune -f
```

---

## 七、目录文件速查

| 文件 | 说明 |
|------|------|
| `backend/server.js` | Express 主服务，路由+AI调用+SSE |
| `backend/tarot-data.js` | 78张塔罗牌完整数据 |
| `backend/.env` | API密钥等敏感配置 |
| `frontend/index.html` | 主页面 |
| `frontend/style.css` | 神秘风格样式 |
| `frontend/app.js` | 前端交互逻辑+流式解读 |
| `Dockerfile` | 单容器构建文件 |
| `docker-compose.yml` | 服务编排 |
| `nginx.conf` | Nginx 反代配置 |

---

*🔮 Powered by AI · 仅供参考，人生由你掌舵*
