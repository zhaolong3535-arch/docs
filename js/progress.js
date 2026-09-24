/* ============================================================
 * PolyLingua - 学习进度追踪与可视化仪表盘
 * ============================================================ */

const Progress = {
  render() {
    const user = Store.currentUser();
    const stats = Store.getStats(user.username);
    const p = Store.getProgress(user.username);
    const today = new Date().toISOString().slice(0, 10);
    const todayXp = p.dailyActivity[today] || 0;
    const dailyGoal = p.preferences.dailyGoal || 30;

    // 近 7 天活动
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: ['日','一','二','三','四','五','六'][d.getDay()], xp: p.dailyActivity[key] || 0 });
    }
    const maxXp = Math.max(10, ...days.map(d => d.xp));

    // 类型准确率
    const typeAvg = (type) => {
      const arr = p.typeAccuracy[type] || [];
      if (!arr.length) return null;
      return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    };
    const typeIcons = { vocab: '单词', grammar: '语法', speaking: '口语', listening: '听力' };

    // 连胜日历（近7天）
    const streakHtml = days.map(d => {
      const active = d.xp > 0;
      return `<div class="streak-cell ${active ? 'active' : ''}" title="${d.key}: ${d.xp}xp">${d.label}</div>`;
    }).join('');

    return `
      <h1 class="section-title">学习仪表盘 📊</h1>
      <p class="section-sub">追踪你的每一点进步，保持学习动力</p>

      <div class="stat-grid">
        <div class="stat-card"><div class="ic">🔥</div><div class="val">${stats.streak || 0}</div><div class="lbl">连续学习天数</div></div>
        <div class="stat-card"><div class="ic">💎</div><div class="val">${stats.xp}</div><div class="lbl">累计经验值</div></div>
        <div class="stat-card"><div class="ic">📚</div><div class="val">${stats.completedLessonsCount}</div><div class="lbl">完成课时</div></div>
        <div class="stat-card"><div class="ic">🌐</div><div class="val">${stats.langsTouched}</div><div class="lbl">学习语种</div></div>
      </div>

      <div class="dash-grid">
        <div class="chart-card">
          <div class="between">
            <div>
              <div class="section-title" style="font-size:18px">近 7 天学习活跃度</div>
              <div class="muted" style="font-size:13px">每日获得经验值</div>
            </div>
            <div class="badge" style="background:#fef3c7;color:#b45309">今日 ${todayXp}/${dailyGoal} xp</div>
          </div>
          <div class="bar-chart">
            ${days.map(d => `
              <div class="bar-col">
                <div class="bar-val">${d.xp}</div>
                <div class="bar" style="height:${(d.xp / maxXp) * 100}%"></div>
                <div class="bar-lbl">${d.label}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="chart-card">
          <div class="section-title" style="font-size:18px">学习连胜 🔥</div>
          <div class="muted" style="font-size:13px">最长连胜 ${stats.maxStreak} 天</div>
          <div class="streak-cells">${streakHtml}</div>
          <hr style="border:none;border-top:1px solid var(--border);margin:18px 0"/>
          <div class="section-title" style="font-size:18px">技能掌握度</div>
          <div class="muted" style="font-size:13px">各模块平均正确率</div>
          <div style="margin-top:14px">
            ${Object.keys(typeIcons).map(t => {
              const v = typeAvg(t);
              const pct = v == null ? 0 : v;
              const color = v == null ? '#cbd5e1' : (pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444');
              return `<div style="margin-bottom:12px">
                <div class="between" style="font-size:13px;margin-bottom:4px"><span>${typeIcons[t]}</span><span style="font-weight:700;color:${color}">${v == null ? '未练习' : pct + '%'}</span></div>
                <div style="height:8px;background:var(--bg);border-radius:999px;overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:${color};transition:width .5s"></i></div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="chart-card" style="margin-top:20px">
        <div class="section-title" style="font-size:18px">学习目标设置 🎯</div>
        <p class="muted" style="font-size:13px;margin-bottom:14px">设定每日目标，养成持续学习习惯</p>
        <div class="row" style="gap:10px;flex-wrap:wrap">
          ${[20, 30, 50, 80].map(g => `
            <button class="btn ${dailyGoal === g ? 'btn-primary' : 'btn-outline'}" onclick="Progress.setGoal(${g})">每日 ${g} xp</button>
          `).join('')}
        </div>
      </div>`;
  },

  setGoal(g) {
    const user = Store.currentUser();
    Store.setPreferences(user.username, { dailyGoal: g });
    App.toast('每日目标已更新为 ' + g + ' xp', 'success');
    App.render();
  }
};

window.Progress = Progress;
