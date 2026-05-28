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