/* ============================================================
 * PolyLingua - 个性化学习路径推荐
 * 基于用户进度、薄弱模块、学习语种偏好生成推荐
 * ============================================================ */

const Recommend = {
  /* 生成推荐列表 */
  generate(username) {
    const p = Store.getProgress(username);
    const stats = Store.getStats(username);
    const recos = [];

    // 1. 偏好语种中未开始的入门课程
    const prefLangs = p.preferences.langs || [];
    const langsToConsider = prefLangs.length ? prefLangs : Object.keys(LANGUAGES);

    // 2. 找出薄弱模块（正确率最低）
    const typeAvg = (type) => {
      const arr = p.typeAccuracy[type] || [];
      if (!arr.length) return null;
      return arr.reduce((a, b) => a + b, 0) / arr.length;
    };
    const weakTypes = [];
    ['vocab', 'grammar', 'speaking', 'listening'].forEach(t => {
      const v = typeAvg(t);
      if (v != null && v < 75) weakTypes.push({ type: t, avg: v });
    });
    weakTypes.sort((a, b) => a.avg - b.avg);

    // 3. 推荐策略
    const allLessons = COURSES.flatMap(c => c.lessons.map(l => ({ lesson: l, course: c })));
    const isDone = (lid) => p.completedLessons.includes(lid);

    // 策略A：薄弱模块强化 —— 在已学语种中找该类型未完成课
    if (weakTypes.length) {
      const wt = weakTypes[0].type;
      const tip = RECOMMEND_RULES.weakTypeBoost[wt];
      // 找用户学过的语种
      const touchedLangs = new Set();
      p.completedLessons.forEach(lid => {
        const c = COURSES.find(c => c.lessons.some(l => l.id === lid));
        if (c) touchedLangs.add(c.lang);
      });
      const target = allLessons.find(x =>
        !isDone(x.lesson.id) &&
        x.lesson.type === wt &&
        (touchedLangs.size ? touchedLangs.has(x.course.lang) : true)
      );
      if (target) {
        recos.push({
          icon: this._typeIcon(wt),
          title: `${target.course.title} · ${target.lesson.title}`,
          desc: tip,
          lesson: target.lesson, course: target.course, tag: '薄弱强化'
        });
      }
    }

    // 策略B：继续未完成课程 —— 同一课程里下一节未完成的课
    const startedCourses = COURSES.filter(c => c.lessons.some(l => isDone(l.id)) && !c.lessons.every(l => isDone(l.id)));
    if (startedCourses.length) {
      const c = startedCourses[0];
      const next = c.lessons.find(l => !isDone(l.id));
      if (next && !recos.find(r => r.lesson.id === next.id)) {
        recos.push({
          icon: '▶️',
          title: `${c.title} · ${next.title}`,
          desc: '继续完成你已开始的课程',
          lesson: next, course: c, tag: '继续学习'
        });
      }
    }

    // 策略C：拓展新语种
    const untouchedLang = Object.keys(LANGUAGES).find(l => {
      // 该语种没有任何完成的课
      return !COURSES.filter(c => c.lang === l).some(c => c.lessons.some(lsn => isDone(lsn.id)));
    });
    if (untouchedLang) {
      const c = COURSES.find(c => c.lang === untouchedLang);
      if (c) {
        const first = c.lessons[0];
        recos.push({
          icon: LANGUAGES[untouchedLang].flag,
          title: `${c.title} · ${first.title}`,
          desc: '尝试一门新语言，拓宽视野',
          lesson: first, course: c, tag: '新语种'
        });
      }
    }

    // 策略D：升级到下一级别（当前级别课程完成度 >= 70%）
    for (const lang of langsToConsider) {
      const langCourses = COURSES.filter(c => c.lang === lang).sort((a, b) => LEVELS.findIndex(l => l.code === a.level) - LEVELS.findIndex(l => l.code === b.level));
      for (let i = 0; i < langCourses.length; i++) {
        const c = langCourses[i];
        const doneCount = c.lessons.filter(l => isDone(l.id)).length;
        if (doneCount / c.lessons.length >= 0.7 && i + 1 < langCourses.length) {
          const nextCourse = langCourses[i + 1];
          const first = nextCourse.lessons[0];
          if (!recos.find(r => r.lesson.id === first.id)) {
            recos.push({
              icon: '⬆️',
              title: `${nextCourse.title} · ${first.title}`,
              desc: RECOMMEND_RULES.nextLevel,
              lesson: first, course: nextCourse, tag: '升级挑战'
            });
          }
          break;
        }
      }
    }

    // 兜底：随机推荐一节未完成课
    if (!recos.length) {
      const target = allLessons.find(x => !isDone(x.lesson.id));
      if (target) {
        recos.push({
          icon: this._typeIcon(target.lesson.type),
          title: `${target.course.title} · ${target.lesson.title}`,
          desc: '从这节课开始你的学习之旅',
          lesson: target.lesson, course: target.course, tag: '推荐'
        });
      }
    }

    return recos.slice(0, 4);
  },

  _typeIcon(type) {
    return { vocab: '🔤', grammar: '✍️', speaking: '🎤', listening: '🎧' }[type] || '📖';
  },

  render() {
    const user = Store.currentUser();
    const recos = this.generate(user.username);
    const p = Store.getProgress(user.username);
    const today = new Date().toISOString().slice(0, 10);
    const todayXp = p.dailyActivity[today] || 0;
    const goal = p.preferences.dailyGoal || 30;
    const goalPct = Math.min(100, Math.round((todayXp / goal) * 100));

    return `
      <h1 class="section-title">为你推荐 🎯</h1>
      <p class="section-sub">基于你的学习数据，智能规划下一步学习路径</p>

      <div class="card" style="margin-bottom:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff">
        <div class="between" style="flex-wrap:wrap;gap:16px">
          <div>
            <div style="font-size:14px;opacity:.9">今日学习目标</div>
            <div style="font-size:28px;font-weight:900;margin-top:4px">${todayXp} / ${goal} xp</div>
            <div style="font-size:13px;opacity:.85;margin-top:4px">${goalPct >= 100 ? '🎉 今日目标已达成！' : `还差 ${goal - todayXp} xp 完成今日目标`}</div>
          </div>
          <div style="width:200px">
            <div style="height:10px;background:rgba(255,255,255,.25);border-radius:999px;overflow:hidden">
              <i style="display:block;height:100%;width:${goalPct}%;background:#fff;border-radius:999px;transition:width .5s"></i>
            </div>
            <div style="text-align:right;font-size:12px;margin-top:6px;opacity:.9">${goalPct}%</div>
          </div>
        </div>
      </div>

      <h3 style="font-size:18px;font-weight:800;margin-bottom:14px">推荐课程</h3>
      ${recos.length ? recos.map(r => `
        <div class="reco-card" onclick="Learning.start(${JSON.stringify(r.lesson).replace(/"/g, '&quot;')})">
          <div class="ric">${r.icon}</div>
          <div class="rt">
            <h4>${r.title}</h4>
            <p>${r.desc}</p>
          </div>
          <span class="badge badge-level">${r.tag}</span>
        </div>
      `).join('') : '<div class="empty"><div class="ic">🎉</div>你已经完成了所有课程，太棒了！</div>'}

      <div class="card" style="margin-top:24px">
        <h3 style="font-size:18px;font-weight:800;margin-bottom:10px">💡 学习小贴士</h3>
        <ul style="color:var(--text-soft);font-size:14px;padding-left:20px;line-height:2">
          <li>每天固定时间学习 15-20 分钟，效果优于单次长时间学习</li>
          <li>遇到薄弱模块不要回避，针对性练习能快速提升</li>
          <li>口语和听力建议大声跟读，激活口腔肌肉记忆</li>
          <li>尝试多语种学习，不同语言间会形成正向迁移</li>
        </ul>
      </div>`;
  }
};

window.Recommend = Recommend;
