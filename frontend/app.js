// API 地址（自动读取当前域名，无需修改）
const API_BASE = window.location.origin;

let selectedSpread = 'single';
let isLoading = false;
let countdownTimer = null; // 倒计时定时器

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
  // 清除已有的倒计时，避免重复
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

    // 补零：1 → 01
    const pad = n => String(n).padStart(2, '0');
    const el = document.getElementById(elementId);
    if (el) el.textContent = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  update(); // 立即执行一次，避免第一秒空白
  countdownTimer = setInterval(update, 1000);
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

    if (!drawRes.ok) throw new Error('抽牌失败，请刷新页面重试');
    const { cards, positions, spreadType } = await drawRes.json();

    // 2. 展示牌面
    displayCards(cards, positions);

    // 3. 展示解读区
    const interpSection = document.getElementById('interpretationSection');
    interpSection.style.display = 'block';
    interpSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const interpText = document.getElementById('interpretationText');
    interpText.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

    // 4. 调用 AI 解读
    const interpretRes = await fetch(`${API_BASE}/api/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cards, positions, question, spreadType })
    });

    // 单独处理限流：次数已用完（429）
    if (interpretRes.status === 429) {
      const errData = await interpretRes.json();
      const limit = errData.error.match(/限(\d+)次/)?.[1] || '2';

      // 渲染限流提示 + 倒计时占位元素
      interpText.innerHTML = `
        <div style="text-align:center;padding:1.5rem 0;">
          <div style="font-size:2.5rem;margin-bottom:1rem;">🌙</div>
          <div style="color:#d4a843;font-size:1rem;line-height:2.2;">
            你今日的占卜次数已用完<br>
            <span style="font-size:0.85rem;color:#9c8a6e;">每24小时限 ${limit} 次</span>
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

      // 启动倒计时
      if (errData.resetTime) {
        startCountdown(errData.resetTime, 'countdownDisplay');
      }

      document.getElementById('resetBtn').style.display = 'inline-block';
      return;
    }

    if (!interpretRes.ok) throw new Error('解读服务异常，请稍后重试');

    // 5. 读取 SSE 流式输出
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
    const interpSection = document.getElementById('interpretationSection');
    const interpText = document.getElementById('interpretationText');
    interpSection.style.display = 'block';
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

// 重置（清除倒计时）
document.getElementById('resetBtn').addEventListener('click', () => {
  // 停止倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  document.getElementById('cardsSection').style.display = 'none';
  document.getElementById('interpretationSection').style.display = 'none';
  document.getElementById('resetBtn').style.display = 'none';
  document.getElementById('interpretationText').textContent = '';
  document.getElementById('cardsGrid').innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// 初始化
generateStars();
