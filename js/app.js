/* ============================================================
 * PolyLingua - 主应用：路由 / 视图渲染 / 导航
 * ============================================================ */

const App = {
  route: { name: 'home', params: {} },

  /* ---------------- 启动 ---------------- */
  init() {
    window.addEventListener('hashchange', () => this.handleHash());
    this.handleHash();
  },

  handleHash() {
    const hash = location.hash.slice(1) || 'home';
    const [name, ...rest] = hash.split('/');
    const params = {};
    if (name === 'course' && rest[0]) params.id = decodeURIComponent(rest[0]);
    if (name === 'learn' && rest[0]) params.lessonId = decodeURIComponent(rest[0]);
    this.route = { name: name || 'home', params };
    this.render();
    window.scrollTo(0, 0);
  },

  go(hash) {
    location.hash = hash;
  },

  /* ---------------- 鉴权变化 ---------------- */
  onAuthChange() {
    // 登录后默认进入推荐页
    if (Store.currentUser() && this.route.name === 'home') {
      this.go('recommend');
    } else {
      this.render();
    }
  },

  /* ---------------- 总渲染 ---------------- */
  render() {
    this.renderTopbar();
    this.renderSidebar();
    const view = document.getElementById('view');
    const user = Store.currentUser();

    // 需要登录的页面
    const protectedRoutes = ['recommend', 'courses', 'course', 'learn', 'dashboard', 'community', 'achievements', 'profile'];
    if (protectedRoutes.includes(this.route.name) && !user) {
      view.innerHTML = this._loginRequired();
      view.className = 'view';
      return;
    }

    switch (this.route.name) {
      case 'home': view.innerHTML = this.renderLanding(); break;
      case 'courses': view.innerHTML = this.renderCourses(); break;
      case 'course': view.innerHTML = this.renderCourseDetail(this.route.params.id); break;
      case 'learn': this.renderLearnView(); break;
      case 'recommend': view.innerHTML = Recommend.render(); break;
      case 'dashboard': view.innerHTML = Progress.render(); break;
      case 'community': view.innerHTML = Community.render(); break;
      case 'achievements': view.innerHTML = Achievements.render(); break;
      case 'profile': view.innerHTML = this.renderProfile(); break;
      default: view.innerHTML = this.renderLanding();
    }
    view.className = 'view' + (this.route.name === 'learn' ? ' full' : '');
  },

  refreshTopbar() {
    this.renderTopbar();
  },

  /* ---------------- 顶部导航 ---------------- */
  renderTopbar() {
    const topbar = document.getElementById('topbar');
    const user = Store.currentUser();
    const r = this.route.name;
    const link = (name, label) => `<a class="${r === name ? 'active' : ''}" onclick="App.go('${name}')">${label}</a>`;

    if (!user) {
      topbar.innerHTML = `
        <div class="brand" onclick="App.go('home')"><div class="logo">🌍</div><span>PolyLingua</span></div>
        <div class="spacer"></div>
        <div class="nav-links">
          ${link('home','首页')}
          <a onclick="App.go('courses')">课程</a>
        </div>
        <button class="btn btn-ghost" onclick="Auth.openLogin()">登录</button>
        <button class="btn btn-primary" onclick="Auth.openRegister()">免费注册</button>`;
    } else {
      const stats = Store.getStats(user.username);
      const lv = Achievements.level(stats.xp);
      topbar.innerHTML = `
        <div class="brand" onclick="App.go('recommend')"><div class="logo">🌍</div><span>PolyLingua</span></div>
        <div class="spacer"></div>
        <div class="nav-links">
          ${link('recommend','🎯 推荐')}
          ${link('courses','📚 课程')}
          ${link('dashboard','📊 进度')}
          ${link('community','💬 社区')}
          ${link('achievements','🏆 成就')}
        </div>
        <div class="user-chip" onclick="App.go('profile')">
          <div class="ava">${user.avatar}</div>
          <span>${user.nickname}</span>
          <span class="xp-pill">Lv.${lv} · ${stats.xp}xp</span>
        </div>`;
    }
  },

  /* ---------------- 侧边栏 ---------------- */
  renderSidebar() {
    const sb = document.getElementById('sidebar');
    const user = Store.currentUser();
    if (!user || this.route.name === 'home' || this.route.name === 'learn') {
      sb.innerHTML = '';
      return;
    }
    const r = this.route.name;
    const item = (name, icon, label) => `<a class="${r === name ? 'active' : ''}" onclick="App.go('${name}')"><span class="ic">${icon}</span>${label}</a>`;
    const stats = Store.getStats(user.username);
    const p = Store.getProgress(user.username);
    const today = new Date().toISOString().slice(0, 10);
    const todayXp = p.dailyActivity[today] || 0;
    const goal = p.preferences.dailyGoal || 30;
    const pct = Math.min(100, Math.round((todayXp / goal) * 100));

    sb.innerHTML = `
      ${item('recommend','🎯','学习推荐')}
      ${item('courses','📚','课程中心')}
      ${item('dashboard','📊','学习进度')}
      ${item('achievements','🏆','成就徽章')}
      ${item('community','💬','学习社区')}
      ${item('profile','👤','个人中心')}
      <div class="side-title">今日目标</div>
      <div style="padding:0 14px">
        <div class="between" style="font-size:12px;color:var(--text-soft);margin-bottom:6px">
          <span>🔥 ${p.streak || 0} 天连胜</span><span>${todayXp}/${goal}</span>
        </div>
        <div style="height:8px;background:var(--bg);border-radius:999px;overflow:hidden">
          <i style="display:block;height:100%;width:${pct}%;background:linear-gradient(90deg,var(--accent),#f97316);border-radius:999px"></i>
        </div>
        <div style="font-size:11px;color:var(--text-soft);margin-top:8px">${pct >= 100 ? '🎉 今日目标已达成' : '继续加油！'}</div>
      </div>`;
  },

  /* ---------------- 着陆页 ---------------- */
  renderLanding() {
    const user = Store.currentUser();
    if (user) { this.go('recommend'); return ''; }
    return `
      <div class="hero">
        <div class="float-flags"><span>🇬🇧</span><span>🇯🇵</span><span>🇰🇷</span></div>
        <h1>沉浸式多语种学习<br/>开启你的语言之旅</h1>
        <p>英语、日语、韩语……分级课程体系 + 互动式学习，从听说读写全面突破，让语言学习变得高效又有趣。</p>
        <div class="cta">
          <button class="btn btn-lg" style="background:#fff;color:var(--primary)" onclick="Auth.openRegister()">免费开始学习 →</button>
          <button class="btn btn-lg btn-ghost" style="color:#fff;border:1.5px solid rgba(255,255,255,.5)" onclick="Auth.openLogin()">已有账号 · 登录</button>
        </div>
      </div>

      <div class="feature-grid">
        <div class="feature"><div class="ic">📚</div><h3>分级课程体系</h3><p>按 CEFR 标准 A1-C2 分级，循序渐进，从入门到精通。</p></div>
        <div class="feature"><div class="ic">🎮</div><h3>互动式学习</h3><p>单词记忆、语法练习、口语跟读、听力训练四大模块，学练结合。</p></div>
        <div class="feature"><div class="ic">🎤</div><h3>真实语音交互</h3><p>基于语音合成与识别技术，开口说、听得懂，告别哑巴外语。</p></div>
        <div class="feature"><div class="ic">📊</div><h3>进度可视化</h3><p>学习仪表盘实时追踪，连胜日历与技能雷达一目了然。</p></div>
        <div class="feature"><div class="ic">🎯</div><h3>个性化推荐</h3><p>智能分析学习数据，为你定制专属学习路径。</p></div>
        <div class="feature"><div class="ic">🏆</div><h3>成就激励</h3><p>积分、等级、徽章、连胜，让坚持学习充满成就感。</p></div>
      </div>

      <div class="card" style="margin-top:32px">
        <h2 class="section-title">支持学习的语言</h2>
        <p class="section-sub">三种主流语言，更多语种持续更新中</p>
        <div class="lang-pick">
          ${Object.values(LANGUAGES).map(l => `
            <div class="lp" onclick="Auth.openRegister()">
              <div class="flag">${l.flag}</div>
              <div class="ln">${l.name}</div>
              <div class="muted" style="font-size:12px">${l.native}</div>
            </div>`).join('')}
        </div>
      </div>

      <div class="card" style="margin-top:24px;text-align:center;background:linear-gradient(135deg,#eef2ff,#faf5ff)">
        <h2 style="font-size:24px;font-weight:900;margin-bottom:8px">准备好开始了吗？</h2>
        <p class="muted" style="margin-bottom:18px">注册即可免费体验全部功能</p>
        <button class="btn btn-primary btn-lg" onclick="Auth.openRegister()">立即注册，开启学习 🚀</button>
      </div>`;
  },

  /* ---------------- 课程中心 ---------------- */
  renderCourses() {
    const user = Store.currentUser();
    const p = Store.getProgress(user.username);
    const isDone = (lid) => p.completedLessons.includes(lid);

    // 按语言分组
    const grouped = {};
    COURSES.forEach(c => { (grouped[c.lang] = grouped[c.lang] || []).push(c); });

    const langTabs = Object.keys(LANGUAGES).map(code => {
      const l = LANGUAGES[code];
      return `<button class="btn ${this._langFilter === code || (!this._langFilter && code === Object.keys(LANGUAGES)[0]) ? 'btn-primary' : 'btn-outline'}" onclick="App.filterLang('${code}')">${l.flag} ${l.name}</button>`;
    }).join('');

    const activeLang = this._langFilter || Object.keys(LANGUAGES)[0];
    const courses = grouped[activeLang] || [];

    return `
      <h1 class="section-title">课程中心 📚</h1>
      <p class="section-sub">分级课程体系，按你的水平选择</p>
      <div class="wrap-gap" style="margin-bottom:20px">${langTabs}</div>
      <div class="course-grid">
        ${courses.map(c => {
          const total = c.lessons.length;
          const done = c.lessons.filter(l => isDone(l.id)).length;
          const pct = Math.round((done / total) * 100);
          const lvl = LEVELS.find(l => l.code === c.level);
          return `
            <div class="course-card" style="border-top-color:${c.color}" onclick="App.go('course/${c.id}')">
              <div class="cc-head">
                <div class="cc-flags">${LANGUAGES[c.lang].flag}</div>
                <h3>${c.title}</h3>
                <div class="cc-desc">${c.desc}</div>
                <div class="wrap-gap" style="margin-top:10px">
                  <span class="badge badge-level">${c.level} ${lvl ? lvl.name : ''}</span>
                  <span class="muted" style="font-size:12px">${total} 节课</span>
                </div>
                <div class="progress-bar"><i style="width:${pct}%;background:${c.color}"></i></div>
              </div>
              <div class="cc-foot">
                <span>${done}/${total} 已完成</span>
                <span style="font-weight:700;color:${c.color}">${pct}% →</span>
              </div>
            </div>`;
        }).join('')}
      </div>`;
  },

  _langFilter: null,
  filterLang(code) {
    this._langFilter = code;
    this.render();
  },

  /* ---------------- 课程详情 ---------------- */
  renderCourseDetail(courseId) {
    const course = COURSES.find(c => c.id === courseId);
    if (!course) return '<div class="empty">课程不存在</div>';
    const user = Store.currentUser();
    const p = Store.getProgress(user.username);
    const isDone = (lid) => p.completedLessons.includes(lid);
    const typeIcon = { vocab: '🔤', grammar: '✍️', speaking: '🎤', listening: '🎧' };
    const typeName = { vocab: '单词记忆', grammar: '语法练习', speaking: '口语跟读', listening: '听力训练' };
    const total = course.lessons.length;
    const done = course.lessons.filter(l => isDone(l.id)).length;

    return `
      <a class="back-link" onclick="App.go('courses')">← 返回课程中心</a>
      <div class="card" style="border-top:5px solid ${course.color};margin-bottom:24px">
        <div class="row" style="gap:16px;flex-wrap:wrap">
          <div style="font-size:48px">${LANGUAGES[course.lang].flag}</div>
          <div style="flex:1">
            <div class="wrap-gap" style="margin-bottom:6px">
              <span class="badge badge-lang-${course.lang}">${LANGUAGES[course.lang].name}</span>
              <span class="badge badge-level">${course.level} ${LEVELS.find(l=>l.code===course.level)?.name}</span>
            </div>
            <h1 style="font-size:26px;font-weight:900">${course.title}</h1>
            <p class="muted" style="margin-top:6px">${course.desc}</p>
            <div class="row" style="margin-top:12px;gap:18px;font-size:14px">
              <span class="muted">📚 ${total} 节课</span>
              <span class="muted">✅ 已完成 ${done}</span>
              <span class="muted">进度 ${Math.round(done/total*100)}%</span>
            </div>
          </div>
        </div>
      </div>

      <h3 style="font-size:18px;font-weight:800;margin-bottom:14px">课程内容</h3>
      <div class="lesson-list">
        ${course.lessons.map((l, i) => {
          const doneFlag = isDone(l.id);
          const stat = p.lessonStats[l.id];
          return `
            <div class="lesson-row ${doneFlag ? 'done' : ''}" onclick="App.go('learn/${l.id}')">
              <div class="lic" style="background:${course.color}22;color:${course.color}">${typeIcon[l.type]}</div>
              <div class="lbody">
                <div class="ltitle">${i+1}. ${l.title}</div>
                <div class="lmeta">${typeName[l.type]} · ${l.items.length} 题 · +${l.xp} xp ${stat ? '· 最佳 '+stat.accuracy+'%' : ''}</div>
              </div>
              ${doneFlag ? '<span class="lcheck">✓</span>' : '<span class="muted">开始 →</span>'}
            </div>`;
        }).join('')}
      </div>`;
  },

  /* ---------------- 学习视图 ---------------- */
  renderLearnView() {
    const view = document.getElementById('view');
    const lid = this.route.params.lessonId;
    // 当无状态、切换到不同课程、或上一节已完成时，重新初始化会话
    if (!Learning.state || Learning.state.lesson.id !== lid || Learning.state.index >= Learning.state.total) {
      const lesson = COURSES.flatMap(c => c.lessons).find(l => l.id === lid);
      if (!lesson) { view.innerHTML = '<div class="empty">课程不存在</div>'; return; }
      Learning._initState(lesson);
    }
    const st = Learning.state;
    const typeIcon = { vocab: '🔤', grammar: '✍️', speaking: '🎤', listening: '🎧' };
    const typeName = { vocab: '单词记忆', grammar: '语法练习', speaking: '口语跟读', listening: '听力训练' };

    let body = '';
    switch (st.lesson.type) {
      case 'vocab': body = Learning.renderVocab(); break;
      case 'grammar': body = Learning.renderGrammar(); break;
      case 'speaking': body = Learning.renderSpeaking(); break;
      case 'listening': body = Learning.renderListening(); break;
    }

    view.innerHTML = `
      <div class="learn-wrap">
        <div class="learn-head">
          <a class="back-link" onclick="App.backToCourse()">← 退出</a>
          <span class="badge badge-type-${st.lesson.type}">${typeIcon[st.lesson.type]} ${typeName[st.lesson.type]}</span>
        </div>
        <div class="between" style="margin-bottom:8px;font-size:13px;color:var(--text-soft)">
          <span>${st.course.title} · ${st.lesson.title}</span>
          <span>${st.index + 1} / ${st.total}</span>
        </div>
        <div class="learn-progress"><i style="width:${Learning.progress()}%"></i></div>
        ${body}
      </div>`;
  },

  _courseIdOfLesson(lid) {
    const c = COURSES.find(c => c.lessons.some(l => l.id === lid));
    return c ? c.id : '';
  },

  /* 退出学习回到课程详情 */
  backToCourse() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const lid = this.route.params.lessonId;
    Learning.state = null;
    this.go('course/' + this._courseIdOfLesson(lid));
  },

  /* 学习结果页 */
  renderLearnResult(lesson, accuracy, newlyUnlocked) {
    const view = document.getElementById('view');
    const color = accuracy >= 80 ? '#10b981' : accuracy >= 60 ? '#f59e0b' : '#ef4444';
    const circleLen = 2 * Math.PI * 70;
    const dashOffset = circleLen * (1 - accuracy / 100);
    const user = Store.currentUser();
    const stats = Store.getStats(user.username);

    view.innerHTML = `
      <div class="learn-wrap">
        <div class="learn-card result-screen">
          <div class="big">${accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}</div>
          <h2 style="font-size:26px;margin-top:8px">${accuracy >= 80 ? '太棒了！' : accuracy >= 60 ? '不错！继续努力' : '再接再厉'}</h2>
          <p class="muted">本节课完成 · ${lesson.title}</p>
          <div class="score-ring">
            <svg width="160" height="160">
              <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" stroke-width="12"/>
              <circle cx="80" cy="80" r="70" fill="none" stroke="${color}" stroke-width="12"
                stroke-linecap="round" stroke-dasharray="${circleLen}" stroke-dashoffset="${dashOffset}"
                style="transition:stroke-dashoffset 1s"/>
            </svg>
            <div class="score-num">${accuracy}%</div>
          </div>
          <div class="row" style="justify-content:center;gap:24px;margin:20px 0">
            <div><div style="font-size:24px;font-weight:900;color:var(--primary)">+${lesson.xp}</div><div class="muted" style="font-size:13px">经验值</div></div>
            <div><div style="font-size:24px;font-weight:900;color:var(--accent)">Lv.${Achievements.level(stats.xp)}</div><div class="muted" style="font-size:13px">当前等级</div></div>
            <div><div style="font-size:24px;font-weight:900;color:var(--danger)">🔥 ${stats.streak||0}</div><div class="muted" style="font-size:13px">连胜天数</div></div>
          </div>
          ${newlyUnlocked && newlyUnlocked.length ? `
            <div class="card" style="background:linear-gradient(135deg,#fef3c7,#fde68a);margin:16px 0">
              <div style="font-weight:800;margin-bottom:8px">🎖️ 新解锁成就</div>
              ${newlyUnlocked.map(a => `<div class="row" style="gap:10px;margin-bottom:6px"><span style="font-size:28px">${a.icon}</span><div><div style="font-weight:700">${a.name}</div><div class="muted" style="font-size:12px">${a.desc}</div></div></div>`).join('')}
            </div>` : ''}
          <div class="row" style="justify-content:center;gap:12px;margin-top:12px">
            <button class="btn btn-outline" onclick="App.backToCourse()">返回课程</button>
            <button class="btn btn-primary" onclick="App.go('recommend')">查看下一步推荐</button>
          </div>
        </div>
      </div>`;
  },

  /* ---------------- 个人中心 ---------------- */
  renderProfile() {
    const user = Store.currentUser();
    const stats = Store.getStats(user.username);
    const p = Store.getProgress(user.username);
    const lv = Achievements.level(stats.xp);

    // 语种偏好切换
    const langPrefs = p.preferences.langs || [];
    return `
      <h1 class="section-title">个人中心 👤</h1>
      <p class="section-sub">管理你的账号与学习偏好</p>

      <div class="card" style="margin-bottom:20px">
        <div class="row" style="gap:18px;flex-wrap:wrap">
          <div style="width:80px;height:80px;border-radius:50%;background:var(--primary-light);display:grid;place-items:center;font-size:44px">${user.avatar}</div>
          <div style="flex:1">
            <h2 style="font-size:24px;font-weight:900">${user.nickname}</h2>
            <p class="muted">@${user.username} · ${Achievements.levelTitle(lv)} (Lv.${lv})</p>
            <div class="wrap-gap" style="margin-top:10px">
              <span class="badge badge-level">💎 ${stats.xp} 经验</span>
              <span class="badge" style="background:#fee2e2;color:#b91c1c">🔥 ${stats.streak||0} 天连胜</span>
              <span class="badge" style="background:#d1fae5;color:#047857">📚 ${stats.completedLessonsCount} 课时</span>
            </div>
          </div>
          <button class="btn btn-outline" onclick="Auth.logout()">退出登录</button>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <h3 style="font-size:18px;font-weight:800;margin-bottom:10px">学习语种偏好</h3>
        <p class="muted" style="font-size:13px;margin-bottom:14px">选择你感兴趣的语言，推荐系统将优先为你匹配</p>
        <div class="lang-pick" style="margin:0">
          ${Object.values(LANGUAGES).map(l => {
            const sel = langPrefs.includes(l.code);
            return `<div class="lp ${sel ? 'sel' : ''}" onclick="App.toggleLangPref('${l.code}')">
              <div class="flag">${l.flag}</div>
              <div class="ln">${l.name}</div>
              <div style="font-size:12px;color:${sel?'var(--primary)':'var(--text-soft)'}">${sel?'✓ 已选':'点击选择'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card"><div class="ic">🌐</div><div class="val">${stats.langsTouched}</div><div class="lbl">学习语种数</div></div>
        <div class="stat-card"><div class="ic">🎖️</div><div class="val">${(p.unlockedAchievements||[]).length}</div><div class="lbl">解锁徽章</div></div>
        <div class="stat-card"><div class="ic">💬</div><div class="val">${stats.postsCount}</div><div class="lbl">社区动态</div></div>
        <div class="stat-card"><div class="ic">📅</div><div class="val">${Object.keys(p.dailyActivity).length}</div><div class="lbl">活跃天数</div></div>
      </div>`;
  },

  toggleLangPref(code) {
    const user = Store.currentUser();
    const p = Store.getProgress(user.username);
    let langs = p.preferences.langs || [];
    if (langs.includes(code)) langs = langs.filter(c => c !== code);
    else langs.push(code);
    Store.setPreferences(user.username, { langs });
    this.render();
  },

  /* ---------------- 工具 ---------------- */
  _loginRequired() {
    return `
      <div class="empty" style="padding:80px 20px">
        <div class="ic">🔒</div>
        <h2 style="margin-bottom:8px">请先登录</h2>
        <p style="margin-bottom:20px">登录后即可体验全部学习功能</p>
        <div class="row" style="justify-content:center">
          <button class="btn btn-primary" onclick="Auth.openLogin()">登录</button>
          <button class="btn btn-outline" onclick="Auth.openRegister()">注册</button>
        </div>
      </div>`;
  },

  toast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + (type || '');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => { t.className = 'toast'; }, 2400);
  }
};

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
