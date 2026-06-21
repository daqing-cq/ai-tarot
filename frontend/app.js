// API 地址（自动读取当前域名，无需修改）
const API_BASE = window.location.origin;

let selectedSpread = 'single';
let isLoading = false;        // 抽牌请求锁
let isInterpreting = false;   // AI解读请求锁
let countdownTimer = null;    // 倒计时定时器

// 当前这一局的数据（抽牌后保存，点击"召唤神谕"时才使用）
let currentCards = [];
let currentPositions = [];
let currentSpreadType = '';
let flippedCount = 0;
let totalCards = 0;

// 四季牌阵今天是否开放（仅春分/夏至/秋分/冬至当天）
let seasonAvailable = false;
let seasonNextInfo = null;

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

// 倒计时函数：传入 resetTime 时间戳，在 elementId 元素里实时更新
function startCountdown(resetTime, elementId) {
  if (countdownTimer) clearInterval(countdownTimer);

  function update() {
    const now = Date.now();
    const remainMs = resetTime - now;

    if (remainMs <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      const el = document.getElementById(elementId);
      if (el) el.textContent = '00:00:00';
      return;
    }

    const totalSeconds = Math.floor(remainMs / 1000);
    const hours   = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = n => String(n).padStart(2, '0');
    const el = document.getElementById(elementId);
    if (el) el.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  update();
  countdownTimer = setInterval(update, 1000);
}

// 查询四季牌阵今天是否开放，并更新按钮的可点击状态与文案
async function checkSeasonAvailability() {
  const seasonBtn = document.getElementById('seasonBtn');
  const seasonDesc = document.getElementById('seasonDesc');
  try {
    const res = await fetch(`${API_BASE}/api/season-status`);
    const data = await res.json();
    seasonAvailable = !!data.available;
    seasonNextInfo = data.next || null;

    if (seasonAvailable) {
      seasonBtn.classList.remove('disabled');
      seasonDesc.textContent = data.today ? `今日${data.today}，可占卜本季运势` : '现已开放';
    } else {
      seasonBtn.classList.add('disabled');
      seasonDesc.textContent = seasonNextInfo
        ? `下次开放：${seasonNextInfo.date}（${seasonNextInfo.label}）`
        : '仅限春分·夏至·秋分·冬至';
    }
  } catch (err) {
    // 查询失败不影响其他牌阵使用，只是四季牌阵按钮保持默认文案
    console.error('查询四季牌阵状态失败:', err);
  }
}

// 牌阵选择
document.querySelectorAll('.spread-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.spread === 'season' && !seasonAvailable) {
      alert(seasonNextInfo
        ? `四季牌阵今天还没开放，下次是 ${seasonNextInfo.date}（${seasonNextInfo.label}）`
        : '四季牌阵只在春分、夏至、秋分、冬至这四天开放');
      return;
    }
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

// ============================================================
// 第一步：抽牌（只抽牌、不调用AI，免费且不消耗AI配额）
// ============================================================
document.getElementById('divinationBtn').addEventListener('click', async () => {
  if (isLoading) return;

  // 双重保险：即便按钮没被正确置灰，这里也再拦一次
  if (selectedSpread === 'season' && !seasonAvailable) {
    alert(seasonNextInfo
      ? `四季牌阵今天还没开放，下次是 ${seasonNextInfo.date}（${seasonNextInfo.label}）`
      : '四季牌阵只在春分、夏至、秋分、冬至这四天开放');
    return;
  }

  isLoading = true;

  const btn = document.getElementById('divinationBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = '🔮 命运轮转中...';

  // 新一轮抽牌前，先清掉上一轮可能残留的解读结果
  const interpSection = document.getElementById('interpretationSection');
  interpSection.style.display = 'none';
  document.getElementById('interpretationText').textContent = '';
  document.getElementById('resetBtn').style.display = 'none';
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

  try {
    const drawRes = await fetch(`${API_BASE}/api/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadType: selectedSpread })
    });

    if (!drawRes.ok) {
      const errData = await drawRes.json().catch(() => ({}));
      throw new Error(errData.error || '抽牌失败，请刷新页面重试');
    }
    const { cards, positions, spreadType } = await drawRes.json();

    currentCards = cards;
    currentPositions = positions;
    currentSpreadType = spreadType;

    renderFaceDownCards(cards, positions, spreadType);

  } catch (err) {
    console.error(err);
    alert(err.message || '抽牌失败，请刷新页面重试');
  } finally {
    isLoading = false;
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = '🃏 抽取塔罗牌';
  }
});

// ============================================================
// 渲染牌阵：卡牌以背面朝上的方式按牌阵布局呈现，点击单张翻牌
// ============================================================
function renderFaceDownCards(cards, positions, spreadType) {
  const section = document.getElementById('cardsSection');
  const grid = document.getElementById('cardsGrid');
  const flipHint = document.getElementById('flipHint');
  const interpretBtn = document.getElementById('interpretBtn');

  flippedCount = 0;
  totalCards = cards.length;

  grid.className = `cards-grid layout-${spreadType}`;
  grid.innerHTML = '';

  interpretBtn.disabled = true;
  interpretBtn.classList.remove('ready');
  flipHint.textContent = '🔮 轻触卡牌，揭开命运的面纱';
  flipHint.classList.remove('all-flipped');

  cards.forEach((card, i) => {
    const keywords = card.isReversed ? card.reversed : card.upright;

    const slot = document.createElement('div');
    slot.className = `card-slot pos-${i}`;
    slot.style.animationDelay = `${i * 0.1}s`;

    slot.innerHTML = `
      <div class="card-inner">
        <div class="card-face card-back">
          <span class="card-back-icon">🔮</span>
        </div>
        <div class="card-face card-front">
          <div class="tarot-card ${card.isReversed ? 'reversed' : ''}">
            <div class="card-position">${positions[i] || `第${i + 1}张`}</div>
            <span class="card-emoji">${card.image}</span>
            <div class="card-name">${card.name}</div>
            <div class="card-name-en">${card.nameEn}</div>
            ${card.isReversed ? '<span class="card-reversed-badge">逆位</span>' : ''}
            <div class="card-keywords">${keywords}</div>
          </div>
        </div>
      </div>`;

    slot.addEventListener('click', () => flipSlot(slot));
    grid.appendChild(slot);
  });

  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth' });
}

// 翻开单张卡牌
function flipSlot(slot) {
  if (slot.classList.contains('flipped')) return;
  slot.classList.add('flipped');
  flippedCount++;
  updateFlipProgress();
}

// 翻开全部（带依次翻开的小动效）
document.getElementById('flipAllBtn').addEventListener('click', () => {
  const slots = document.querySelectorAll('.card-slot:not(.flipped)');
  slots.forEach((slot, i) => {
    setTimeout(() => slot.classList.add('flipped'), i * 150);
  });
  flippedCount = totalCards;
  updateFlipProgress();
});

// 更新提示文案 + 解锁"召唤神谕"按钮
function updateFlipProgress() {
  const flipHint = document.getElementById('flipHint');
  const interpretBtn = document.getElementById('interpretBtn');

  if (totalCards > 0 && flippedCount >= totalCards) {
    flipHint.textContent = '✨ 命运已然显现，可召唤神谕为你解读';
    flipHint.classList.add('all-flipped');
    interpretBtn.disabled = false;
    interpretBtn.classList.add('ready');
  } else {
    flipHint.textContent = `🔮 轻触卡牌，揭开命运的面纱（${flippedCount}/${totalCards}）`;
  }
}

// ============================================================
// 第二步：点击"召唤神谕"才会调用AI模型进行解读（消耗AI配额）
// ============================================================
document.getElementById('interpretBtn').addEventListener('click', async () => {
  if (isInterpreting || flippedCount < totalCards) return;
  isInterpreting = true;

  const interpretBtn = document.getElementById('interpretBtn');
  interpretBtn.disabled = true;
  interpretBtn.textContent = '🔮 神谕降临中...';

  const question = questionInput.value.trim();

  const interpSection = document.getElementById('interpretationSection');
  interpSection.style.display = 'block';
  interpSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const interpText = document.getElementById('interpretationText');
  interpText.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  try {
    const interpretRes = await fetch(`${API_BASE}/api/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cards: currentCards,
        positions: currentPositions,
        question,
        spreadType: currentSpreadType
      })
    });

    // 单独处理限流：次数已用完（429）
    if (interpretRes.status === 429) {
      const errData = await interpretRes.json();
      const limit = errData.error.match(/限(\d+)次/)?.[1] || '2';

      interpText.innerHTML = `
        <div style="text-align:center;padding:1.5rem 0;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">🌙</div>
          <div style="color:#d4a843;font-size:1rem;line-height:2.2;">
            你今日的占卜次数已用完<br>
            <span style="font-size:0.85rem;color:#9c8a6e;">${errData.error}</span>
          </div>
          <div style="margin-top:1.2rem;">
            <span style="color:#9c8a6e;font-size:0.9rem;">距离下次占卜还剩</span><br>
            <span
              id="countdownDisplay"
              style="
                font-size:2rem;
                font-family:'Courier New',monospace;
                color:#d4a843;
                letter-spacing:0.15em;
                text-shadow:0 0 12px rgba(212,168,67,0.5);
                display:inline-block;
                margin-top:0.4rem;
              "
            >--:--:--</span>
          </div>
        </div>`;

      if (errData.resetTime) {
        startCountdown(errData.resetTime, 'countdownDisplay');
      }

      document.getElementById('resetBtn').style.display = 'inline-block';
      return;
    }

    if (!interpretRes.ok) throw new Error('解读服务异常，请稍后重试');

    // 读取 SSE 流式输出
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
          if (parsed.text) interpText.textContent += parsed.text;
          if (parsed.error) interpText.textContent = parsed.error;
        } catch {}
      }
    }

    document.getElementById('resetBtn').style.display = 'inline-block';

  } catch (err) {
    console.error(err);
    interpText.innerHTML = `
      <div style="text-align:center;padding:1.5rem 0;">
        <div style="font-size:2.5rem;margin-bottom:1rem;">⚠️</div>
        <div style="color:#ff8888;font-size:1rem;line-height:2;">
          星象暂时混沌，占卜未能完成<br>
          <span style="font-size:0.85rem;color:#9c8a6e;">${err.message}</span>
        </div>
      </div>`;
    document.getElementById('resetBtn').style.display = 'inline-block';

  } finally {
    isInterpreting = false;
    interpretBtn.disabled = false;
    interpretBtn.textContent = '🔮 召唤神谕（AI 解读）';
  }
});

// 重置（回到最初状态，清除倒计时与牌阵）
document.getElementById('resetBtn').addEventListener('click', () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  document.getElementById('cardsSection').style.display = 'none';
  document.getElementById('interpretationSection').style.display = 'none';
  document.getElementById('resetBtn').style.display = 'none';
  document.getElementById('interpretationText').textContent = '';
  document.getElementById('cardsGrid').innerHTML = '';

  flippedCount = 0;
  totalCards = 0;
  currentCards = [];
  currentPositions = [];

  const interpretBtn = document.getElementById('interpretBtn');
  interpretBtn.disabled = true;
  interpretBtn.classList.remove('ready');
  interpretBtn.textContent = '🔮 召唤神谕（AI 解读）';

  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 初始化
generateStars();
checkSeasonAvailability();
