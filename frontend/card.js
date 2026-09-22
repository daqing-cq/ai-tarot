// ============================================================
// 经典塔罗（Rider-Waite 公版卡面）图片映射
// frontend/cards/ 下每张牌一个 webp：大阿卡纳 00_Fool..21_World，
// 小阿卡纳 Wands01..14 / Cups01..14 / Swords01..14 / Pents01..14
// card-back.webp 为经典卡背图案（1909年原版石榴纹，公有领域）
// ============================================================

// 小阿卡纳：花色 → 文件前缀（backend/tarot-data.js 中 suit 字段与此对应）
const SUIT_PREFIX = {
  wands: 'Wands',
  cups: 'Cups',
  swords: 'Swords',
  pentacles: 'Pents',
};

// 小阿卡纳在各自花色内的序号（1-14）由 id 与花色起始 id 推算：
// 权杖 22-35 / 圣杯 36-49 / 宝剑 50-63 / 星币 64-77（与 tarot-data.js 一致）
const SUIT_START_ID = { wands: 22, cups: 36, swords: 50, pentacles: 64 };

// 牌 id（0-77）→ 卡面图片相对路径 cards/xxx.webp
function cardImagePath(card) {
  const base = 'cards/';
  if (card.suit === 'major') {
    // 大阿卡纳 id 0-21 直接对应 00_Fool .. 21_World
    const names = [
      '00_Fool', '01_Magician', '02_High_Priestess', '03_Empress', '04_Emperor',
      '05_Hierophant', '06_Lovers', '07_Chariot', '08_Strength', '09_Hermit',
      '10_Wheel_of_Fortune', '11_Justice', '12_Hanged_Man', '13_Death',
      '14_Temperance', '15_Devil', '16_Tower', '17_Star', '18_Moon', '19_Sun',
      '20_Judgement', '21_World'
    ];
    return base + (names[card.id] || '00_Fool') + '.webp';
  }
  const prefix = SUIT_PREFIX[card.suit];
  if (!prefix) return null;
  const num = ((card.id - SUIT_START_ID[card.suit]) % 14) + 1;
  return base + prefix + String(num).padStart(2, '0') + '.webp';
}

// 经典卡背
const CARD_BACK_IMAGE = 'cards/card-back.webp';
