// ============================================================
// 二分二至（春分 / 夏至 / 秋分 / 冬至）日期计算
//
// 四季牌阵的设定：传说中这四天是"二分二至"，太阳能量转换的节点，
// 因此只有这四天牌阵能量才足够强，才可以开放使用。
//
// 计算方法：Jean Meeus《Astronomical Algorithms》中给出的均值公式
// （只用了 JDE0 主项，没有叠加后面 24 项的周期修正）。
// 这个公式对"今天是不是那一天"这种按日判断来说精度完全够用——
// 公式本身的理论误差最多在半小时左右，几乎不会跨越到第二天。
// 唯一的理论风险：如果某年节气恰好卡在北京时间 00:00 前后几十分钟内，
// 才有极小概率被判定错一天。考虑到这是占卜网站的彩蛋功能而不是天文台，
// 这个精度是够用的。
//
// 时区：统一按北京时间（UTC+8）计算"今天"和节气发生的日期，
// 这是中文语境下谈论"节气"时约定俗成的基准时区。
// ============================================================

// Julian Day -> 公历日期（标准 Meeus 算法）
function jdToDate(jd) {
  jd += 0.5;
  const Z = Math.floor(jd);
  const F = jd - Z;

  let A;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }

  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);

  const dayFloat = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;

  return { year, month, day: Math.floor(dayFloat) };
}

// 某一年四个节气的"均值" JDE（Y 是以 2000 年为基准的千年数）
function meanJDE(year, kind) {
  const Y = (year - 2000) / 1000;
  switch (kind) {
    case 'spring': // 春分
      return 2451623.80984 + 365242.37404 * Y + 0.05169 * Y ** 2 - 0.00411 * Y ** 3 - 0.00057 * Y ** 4;
    case 'summer': // 夏至
      return 2451716.56767 + 365241.62603 * Y + 0.00325 * Y ** 2 + 0.00888 * Y ** 3 - 0.0003 * Y ** 4;
    case 'autumn': // 秋分
      return 2451810.21715 + 365242.01767 * Y - 0.11575 * Y ** 2 + 0.00337 * Y ** 3 + 0.00078 * Y ** 4;
    case 'winter': // 冬至
      return 2451900.05952 + 365242.74049 * Y - 0.06223 * Y ** 2 - 0.00823 * Y ** 3 + 0.00032 * Y ** 4;
    default:
      throw new Error(`未知节气类型: ${kind}`);
  }
}

const SOLAR_TERMS = [
  { key: 'spring', label: '春分' },
  { key: 'summer', label: '夏至' },
  { key: 'autumn', label: '秋分' },
  { key: 'winter', label: '冬至' }
];

// 取得"今天"在北京时间（UTC+8）下的年/月/日
// 用 getTime() 加 8 小时再取 UTC 字段，不依赖服务器自身时区设置
function beijingToday() {
  const now = new Date();
  const bj = new Date(now.getTime() + 8 * 3600 * 1000);
  return { year: bj.getUTCFullYear(), month: bj.getUTCMonth() + 1, day: bj.getUTCDate() };
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// 某一年四个节气对应的北京时间日期，格式 YYYY-MM-DD
function listYearSolarTerms(year) {
  return SOLAR_TERMS.map(({ key, label }) => {
    const jde = meanJDE(year, key);
    const d = jdToDate(jde + 8 / 24); // 换算成北京时间
    return { label, date: `${d.year}-${pad2(d.month)}-${pad2(d.day)}` };
  });
}

// 判断"今天"（北京时间）是不是春分/夏至/秋分/冬至之一
// 返回节气名称（如"春分"），不是则返回 null
function getTodaySolarTerm() {
  const today = beijingToday();
  const todayStr = `${today.year}-${pad2(today.month)}-${pad2(today.day)}`;
  const hit = listYearSolarTerms(today.year).find(t => t.date === todayStr);
  return hit ? hit.label : null;
}

// 找到下一个即将到来的节气（今天也算），用于"暂未开放"时提示用户
function getNextSolarTerm() {
  const today = beijingToday();
  const todayStr = `${today.year}-${pad2(today.month)}-${pad2(today.day)}`;
  const candidates = [...listYearSolarTerms(today.year), ...listYearSolarTerms(today.year + 1)]
    .sort((a, b) => (a.date > b.date ? 1 : -1));
  return candidates.find(c => c.date >= todayStr) || candidates[0];
}

module.exports = { getTodaySolarTerm, getNextSolarTerm };
