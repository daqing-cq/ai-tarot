// 四季牌阵独立页面（/four-seasons-spread）专用脚本
// 与主站 app.js 相对独立，避免互相牵连；逐张抽牌/翻牌/AI解读逻辑与主站一致
//
// ⚠️ 安全说明：这里的"锁定状态"只是前端体验层（避免用户白白操作一遍才被拒）。
// 真正的硬性拦截在后端 /api/draw 里已经做了——即便有人绕开前端直接调用接口，
// 服务端发现 spreadType==='season' 且今天不是二分二至时，依然会返回 403。
// 所以这里前端拦截可以做得"友好"，不用担心被绕过。

const API_BASE = window.location.origin;

let isLoading = false;
let isInterpreting = false;
let countdownTimer = null;

let currentCards = [];
let currentPositions = [];
let flippedCount = 0;
let totalCards = 0;

// 今天是否为二分二至（页面加载时核验一次；之后每次点按钮前都用这个值拦截）
let seasonLocked = true;
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

// 倒计时（AI解读次数用完时显示）
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
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = n => String(n).padStart(2, '0');
    const el = document.getElementById(elementId);
    if (el) el.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  update();
  countdownTimer = setInterval(update, 1000);
}

// 统一的"未开放"提示文案
function lockMessage() {
  return seasonNextInfo
    ? `四季牌阵今天还没开放，下次开放时间为 ${seasonNextInfo.date}（${seasonNextInfo.label}）`
    : '四季牌阵今天还没开放，仅限春分、夏至、秋分、冬至这四天';
}

// 更新页面顶部的横幅（未开放时常驻显示，提醒直接进来的人）
function renderLockBanner() {
  const banner = document.getElementById('lockBanner');
  if (seasonLocked) {
    banner.style.display = 'block';
    banner.textContent = `🔒 ${lockMessage()}`;
  } else {
    banner.style.display = 'none';
  }
}

// ============================================================
// 页面加载即核验：防止有人直接在地址栏输入网址绕开首页的悬浮按钮检查
// ============================================================
async function initGuard() {
  try {
    const res = await fetch(`${API_BASE}/api/season-status`);
    const data = await res.json();
    seasonLocked = !data.available;
    seasonNextInfo = data.next || null;
  } catch (err) {
    console.error('查询四季牌阵状态失败:', err);
    // 查询失败时保守处理：当作未开放，不放行（宁可拦错，不可放过）
    seasonLocked = true;
    seasonNextInfo = null;
  }
  renderLockBanner();
}

// 字数统计
const questionInput = document.getElementById('questionInput');
const charCount = document.getElementById('charCount');
questionInput.addEventListener('input', () => {
  charCount.textContent = questionInput.value.length;
});

// ============================================================
// 占卜按钮：每次点击都先看 seasonLocked，未开放就弹窗拦截，不发请求
// ============================================================
document.getElementById('divinationBtn').addEventListener('click', async () => {
  if (seasonLocked) {
    alert(lockMessage());
    return;
  }
  if (isLoading) return;
  isLoading = true;

  const btn = document.getElementById('divinationBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = '🔮 命运轮转中...';

  const interpSection = document.getElementById('interpretationSection');
  interpSection.style.display = 'none';
  document.getElementById('interpretationText').textContent = '';
  document.getElementById('resetBtn').style.display = 'none';
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }

  try {
    const drawRes = await fetch(`${API_BASE}/api/draw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spreadType: 'season' })
    });

    if (!drawRes.ok) {
      const errData = await drawRes.json().catch(() => ({}));
      // 服务端也判定未开放（比如前端状态过期了）：同步锁定状态并用同样的弹窗
      if (drawRes.status === 403) {
        seasonLocked = true;
        if (errData.next) seasonNextInfo = errData.next;
        renderLockBanner();
      }
      throw new Error(errData.error || '抽牌失败，请刷新页面重试');
    }
    const { cards, positions, spreadType } = await drawRes.json();

    currentCards = cards;
    currentPositions = positions;

    renderFaceDownCards(cards, positions, spreadType);

  } catch (err) {
    console.error(err);
    alert(err.message || '抽牌失败，请刷新页面重试');
  } finally {
    isLoading = false;
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = '🧭 占卜本季运势';
  }
});

// 渲染牌阵（背面朝上，点击单张翻牌）
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

function flipSlot(slot) {
  if (slot.classList.contains('flipped')) return;
  slot.classList.add('flipped');
  flippedCount++;
  updateFlipProgress();
}

document.getElementById('flipAllBtn').addEventListener('click', () => {
  if (seasonLocked) { alert(lockMessage()); return; }
  const slots = document.querySelectorAll('.card-slot:not(.flipped)');
  slots.forEach((slot, i) => {
    setTimeout(() => slot.classList.add('flipped'), i * 150);
  });
  flippedCount = totalCards;
  updateFlipProgress();
});

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
// AI 解读按钮：同样先拦一次锁定状态
// ============================================================
document.getElementById('interpretBtn').addEventListener('click', async () => {
  if (seasonLocked) { alert(lockMessage()); return; }
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
        spreadType: 'season'
      })
    });

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

// 重置按钮：同样先拦一次（虽然重置本身没有副作用，但保持行为一致）
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
initGuard();
