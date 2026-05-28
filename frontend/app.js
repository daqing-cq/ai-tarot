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
