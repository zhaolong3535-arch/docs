// 电商价格采集对比工具 - 前端逻辑
const PLATFORM_COLORS = { jd: '#E2231A', taobao: '#FF6A00', pdd: '#E22E2E' };
const PLATFORM_NAMES = { jd: '京东', taobao: '淘宝', pdd: '拼多多' };

const charts = {}; // 保存 Chart 实例以便销毁重建

const $ = (id) => document.getElementById(id);
const fmt = (n) => Number(n).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
const money = (n) => '¥' + fmt(n);

function setStatus(msg, kind) {
  const el = $('status');
  el.textContent = msg || '';
  el.className = 'status' + (kind ? ' ' + kind : '');
}

function destroyCharts() {
  Object.values(charts).forEach((c) => c && c.destroy && c.destroy());
}

function show(el, on = true) { el.hidden = !on; }

// ------------------------------------------------------------------
// 渲染：摘要卡片
// ------------------------------------------------------------------
function renderSummary(r) {
  show($('cards'));
  const s = r.summary;
  $('c-total').textContent = s.total;
  $('c-min').textContent = money(s.price_min);
  $('c-max').textContent = money(s.price_max);
  $('c-avg').textContent = money(s.price_avg);
  $('c-rec').textContent = (r.items || []).filter((i) => i.recommended).length;
}

// ------------------------------------------------------------------
// 渲染：平台横向对比表
// ------------------------------------------------------------------
function renderPlatformTable(rows) {
  show($('platform-section'));
  const t = $('platform-table');
  t.innerHTML = `
    <thead><tr>
      <th>平台</th><th class="num">数量</th><th class="num">最低价</th>
      <th class="num">均价</th><th class="num">最高价</th>
      <th class="num">均销量</th><th class="num">均店铺分</th>
    </tr></thead>
    <tbody>
      ${rows.map((r) => `
        <tr>
          <td><span class="pf-tag ${r.platform}">${PLATFORM_NAMES[r.platform]}</span></td>
          <td class="num">${r.count}</td>
          <td class="num">${money(r.price_min)}</td>
          <td class="num"><b>${money(r.price_avg)}</b></td>
          <td class="num">${money(r.price_max)}</td>
          <td class="num">${fmt(r.sales_avg)}</td>
          <td class="num">${r.shop_rating_avg.toFixed(2)}</td>
        </tr>`).join('')}
    </tbody>`;
}

// ------------------------------------------------------------------
// 渲染：商品列表
// ------------------------------------------------------------------
function renderItemsTable(items) {
  show($('items-section'));
  const t = $('items-table');
  t.innerHTML = `
    <thead><tr>
      <th class="num">#</th><th>平台</th><th>商品名称</th>
      <th class="num">价格</th><th class="num">原价</th><th class="num">折扣</th>
      <th class="num">销量</th><th class="num">店铺分</th>
      <th class="num">性价比</th><th>推荐</th><th>链接</th>
    </tr></thead>
    <tbody>
      ${items.map((it) => {
        const orig = it.original_price ? `<del>${money(it.original_price)}</del>` : '—';
        const disc = it.discount_ratio > 0 ? (it.discount_ratio * 100).toFixed(0) + '%' : '—';
        const score = it.value_score;
        const rec = it.recommended ? '<span class="rec-star">★</span>' : '';
        const link = it.url ? `<a class="link" href="${it.url}" target="_blank" rel="noopener">详情</a>` : '—';
        return `
          <tr>
            <td class="num">${it.rank}</td>
            <td><span class="pf-tag ${it.platform}">${PLATFORM_NAMES[it.platform]}</span></td>
            <td class="title">${escapeHtml(it.title)}</td>
            <td class="price"><b>${money(it.price)}</b></td>
            <td class="num">${orig}</td>
            <td class="num">${disc}</td>
            <td class="num">${fmt(it.sales)}</td>
            <td class="num">${it.shop_rating.toFixed(2)}</td>
            <td class="num">
              <span class="score-bar"><i style="width:${score}%"></i></span>${score}
            </td>
            <td>${rec}</td>
            <td>${link}</td>
          </tr>`;
      }).join('')}
    </tbody>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ------------------------------------------------------------------
// 渲染：图表（Chart.js）
// ------------------------------------------------------------------
function renderCharts(r) {
  show($('charts'));
  destroyCharts();

  // 1) 平台价格对比：分组柱状（最低/均价/最高）
  const cmp = r.platform_comparison;
  const labels = cmp.map((c) => PLATFORM_NAMES[c.platform]);
  charts['platform'] = new Chart($('chart-platform'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: '最低价', data: cmp.map((c) => c.price_min), backgroundColor: '#4C9F70' },
        { label: '均价', data: cmp.map((c) => c.price_avg), backgroundColor: '#F2B134' },
        { label: '最高价', data: cmp.map((c) => c.price_max), backgroundColor: '#E26D5C' },
      ],
    },
    options: chartBaseOpts('价格 (元)'),
  });

  // 2) 价格分布：分箱 + 按平台堆叠
  charts['dist'] = new Chart($('chart-dist'), makeDistChart(r.items));

  // 3) 价格-销量散点，推荐高亮
  charts['scatter'] = new Chart($('chart-scatter'), makeScatterChart(r.items));
}

function chartBaseOpts(yLabel) {
  return {
    responsive: true,
    plugins: { legend: { labels: { color: '#9aa3b2', font: { size: 11 } } } },
    scales: {
      x: { ticks: { color: '#9aa3b2' }, grid: { color: '#2a2f3a' } },
      y: { ticks: { color: '#9aa3b2' }, grid: { color: '#2a2f3a' }, title: { display: true, text: yLabel, color: '#9aa3b2' } },
    },
  };
}

function makeDistChart(items) {
  if (!items || !items.length) return { type: 'bar', data: { labels: ['无数据'], datasets: [] } };
  const prices = items.map((i) => i.price);
  const lo = Math.min(...prices), hi = Math.max(...prices);
  const bins = 8;
  const step = Math.max(0.01, (hi - lo) / bins);
  const edges = Array.from({ length: bins + 1 }, (_, i) => lo + i * step);
  const labels = edges.slice(0, -1).map((e, i) => `${money(e)}+`);
  const platforms = [...new Set(items.map((i) => i.platform))];
  const datasets = platforms.map((pf) => {
    const data = Array(bins).fill(0);
    items.filter((i) => i.platform === pf).forEach((i) => {
      let idx = Math.floor((i.price - lo) / step);
      if (idx >= bins) idx = bins - 1;
      if (idx < 0) idx = 0;
      data[idx]++;
    });
    return {
      label: PLATFORM_NAMES[pf],
      data,
      backgroundColor: PLATFORM_COLORS[pf],
      stack: 's',
    };
  });
  return { type: 'bar', data: { labels, datasets }, options: chartBaseOpts('数量') };
}

function makeScatterChart(items) {
  const platforms = [...new Set(items.map((i) => i.platform))];
  const datasets = platforms.map((pf) => ({
    label: PLATFORM_NAMES[pf],
    data: items.filter((i) => i.platform === pf).map((i) => ({ x: i.price, y: i.sales })),
    backgroundColor: PLATFORM_COLORS[pf],
    pointRadius: 4,
  }));
  // 推荐点单独一个 dataset 以放大高亮
  const rec = items.filter((i) => i.recommended).map((i) => ({ x: i.price, y: i.sales }));
  datasets.push({
    label: '★ 推荐',
    data: rec,
    backgroundColor: '#e1b12c',
    pointRadius: 8,
    pointStyle: 'star',
  });
  return {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#9aa3b2', font: { size: 11 } } } },
      scales: {
        x: { type: 'logarithmic', title: { display: true, text: '价格 (元, log)', color: '#9aa3b2' }, ticks: { color: '#9aa3b2' }, grid: { color: '#2a2f3a' } },
        y: { type: 'logarithmic', title: { display: true, text: '销量 (log)', color: '#9aa3b2' }, ticks: { color: '#9aa3b2' }, grid: { color: '#2a2f3a' } },
      },
    },
  };
}

// ------------------------------------------------------------------
// 渲染：原始采集示例（初始化展示）
// ------------------------------------------------------------------
function renderRawTable(sample) {
  if (!sample || !sample.products) { show($('raw-section'), false); return; }
  show($('raw-section'));
  $('raw-count').textContent = sample.raw_count;
  const t = $('raw-table');
  t.innerHTML = `
    <thead><tr>
      <th>平台</th><th>商品ID</th><th>商品名称</th><th class="num">价格</th>
      <th class="num">原价</th><th class="num">销量</th><th class="num">店铺分</th><th>链接</th>
    </tr></thead>
    <tbody>
      ${sample.products.slice(0, 50).map((p) => `
        <tr>
          <td><span class="pf-tag ${p.platform}">${PLATFORM_NAMES[p.platform]}</span></td>
          <td>${escapeHtml(p.product_id)}</td>
          <td class="title">${escapeHtml(p.title)}</td>
          <td class="num">${money(p.price)}</td>
          <td class="num">${p.original_price ? money(p.original_price) : '—'}</td>
          <td class="num">${fmt(p.sales)}</td>
          <td class="num">${p.shop_rating.toFixed(2)}</td>
          <td>${p.url ? `<a class="link" href="${p.url}" target="_blank" rel="noopener">链接</a>` : '—'}</td>
        </tr>`).join('')}
    </tbody>`;
}

// ------------------------------------------------------------------
// 渲染主流程
// ------------------------------------------------------------------
function renderResult(r) {
  renderSummary(r);
  renderPlatformTable(r.platform_comparison || []);
  renderItemsTable(r.items || []);
  renderCharts(r);
}

// ------------------------------------------------------------------
// 事件绑定
// ------------------------------------------------------------------
async function loadSample() {
  setStatus('正在加载示例数据…');
  try {
    const res = await fetch('/api/sample');
    const data = await res.json();
    if (data.sample_result) {
      renderResult(data.sample_result);
      renderRawTable(data.sample_data);
      setStatus(`已加载示例：关键词「${data.sample_result.keyword}」 · 仿真数据 · 可直接在上方输入新关键词运行`, 'ok');
    }
  } catch (e) {
    setStatus('示例加载失败：' + e.message, 'error');
  }
}

async function runSearch(e) {
  e.preventDefault();
  const keyword = $('keyword').value.trim();
  if (!keyword) { setStatus('请输入关键词', 'error'); return; }
  const platforms = [...document.querySelectorAll('.platform-pick input:checked')].map((c) => c.value);
  const limit = parseInt($('limit').value, 10) || 8;
  const btn = $('run-btn');
  btn.disabled = true;
  setStatus(`正在采集「${keyword}」… (平台: ${platforms.join('/')} · 每平台 ${limit} 条)`);
  show($('raw-section'), false); // 运行后隐藏原始示例
  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, platforms, limit, mock: true }),
    });
    const r = await res.json();
    if (r.error) { setStatus(r.error, 'error'); return; }
    renderResult(r);
    setStatus(`采集完成：关键词「${keyword}」 · 共 ${r.summary.total} 条 · 数据来源：仿真`, 'ok');
  } catch (err) {
    setStatus('运行失败：' + err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-form').addEventListener('submit', runSearch);
  loadSample();
});
