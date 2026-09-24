/* ============================================================
 * PolyLingua - 成就激励系统
 * 徽章 / 积分 / 等级 / 连胜
 * ============================================================ */

const Achievements = {
  /* 等级计算：每 200 xp 一级 */
  level(xp) {
    return Math.floor(xp / 200) + 1;
  },
  levelProgress(xp) {
    const into = xp % 200;
    return Math.round((into / 200) * 100);
  },
  levelTitle(lv) {
    if (lv >= 10) return '语言大师';
    if (lv >= 7) return '语言学者';
    if (lv >= 5) return '资深学习者';
    if (lv >= 3) return '进阶学员';
    if (lv >= 2) return '勤奋学徒';
    return '语言萌新';
  },

  /* 检查并解锁新成就，返回新解锁列表 */
  check(username) {
    const stats = Store.getStats(username);
    const p = Store.getProgress(username);
    const unlocked = p.unlockedAchievements || [];
    const newly = [];
    ACHIEVEMENTS.forEach(a => {
      if (!unlocked.includes(a.id) && a.cond(stats)) {
        unlocked.push(a.id);
        newly.push(a);
      }
    });
    if (newly.length) {
      p.unlockedAchievements = unlocked;
      Store.saveProgress(username, p);
      // 通知
      newly.forEach((a, i) => {
        setTimeout(() => App.toast(`🎖️ 解锁成就：${a.name}！`, 'success'), i * 600);
      });
    }
    return newly;
  },

  render() {
    const user = Store.currentUser();
    const stats = Store.getStats(user.username);
    const p = Store.getProgress(user.username);
    const unlocked = p.unlockedAchievements || [];
    const lv = this.level(stats.xp);
    const lvPct = this.levelProgress(stats.xp);
    const into = stats.xp % 200;

    return `
      <h1 class="section-title">成就与等级 🏆</h1>
      <p class="section-sub">坚持学习，收集专属徽章</p>

      <div class="card" style="margin-bottom:24px;background:linear-gradient(135deg,#f59e0b,#f97316);color:#fff">
        <div class="between" style="flex-wrap:wrap;gap:16px">
          <div class="row" style="gap:16px">
            <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.25);display:grid;place-items:center;font-size:30px;font-weight:900">${lv}</div>
            <div>
              <div style="font-size:13px;opacity:.9">当前等级</div>
              <div style="font-size:22px;font-weight:900">${this.levelTitle(lv)}</div>
              <div style="font-size:13px;opacity:.9;margin-top:2px">累计 ${stats.xp} 经验值</div>
            </div>
          </div>
          <div style="min-width:220px">
            <div class="between" style="font-size:13px;opacity:.9;margin-bottom:4px"><span>距下一级</span><span>${200 - into} xp</span></div>
            <div style="height:10px;background:rgba(255,255,255,.25);border-radius:999px;overflow:hidden">
              <i style="display:block;height:100%;width:${lvPct}%;background:#fff;border-radius:999px;transition:width .5s"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="stat-grid" style="margin-bottom:24px">
        <div class="stat-card"><div class="ic">🎖️</div><div class="val">${unlocked.length}/${ACHIEVEMENTS.length}</div><div class="lbl">已解锁徽章</div></div>
        <div class="stat-card"><div class="ic">🔥</div><div class="val">${stats.maxStreak}</div><div class="lbl">最长连胜</div></div>
        <div class="stat-card"><div class="ic">🎤</div><div class="val">${stats.speakingDone}</div><div class="lbl">口语课时</div></div>
        <div class="stat-card"><div class="ic">🎧</div><div class="val">${stats.listeningDone}</div><div class="lbl">听力课时</div></div>
      </div>

      <h3 style="font-size:18px;font-weight:800;margin-bottom:14px">徽章墙</h3>
      <div class="ach-grid">
        ${ACHIEVEMENTS.map(a => {
          const got = unlocked.includes(a.id);
          return `
            <div class="ach-card ${got ? 'unlocked' : 'locked'}">
              <div class="ic">${a.icon}</div>
              <h4>${a.name}</h4>
              <p>${a.desc}</p>
              <div class="tag">${got ? '✓ 已解锁' : '🔒 未解锁'}</div>
            </div>`;
        }).join('')}
      </div>`;
  }
};

window.Achievements = Achievements;
