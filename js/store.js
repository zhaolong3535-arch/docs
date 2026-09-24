/* ============================================================
 * PolyLingua - 本地数据存储层 (localStorage 持久化)
 * ============================================================ */

const Store = {
  KEYS: {
    USERS: 'pl_users',
    SESSION: 'pl_session',
    PROGRESS: 'pl_progress', // keyed by username
    POSTS: 'pl_posts'
  },

  _read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  _write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /* ---------- 用户 / 鉴权 ---------- */
  getUsers() {
    return this._read(this.KEYS.USERS, {});
  },
  register(username, password, nickname) {
    const users = this.getUsers();
    if (users[username]) return { ok: false, msg: '该用户名已被注册' };
    users[username] = { username, password, nickname: nickname || username, avatar: this._randomAvatar(), createdAt: Date.now() };
    this._write(this.KEYS.USERS, users);
    // 初始化进度
    const all = this._read(this.KEYS.PROGRESS, {});
    all[username] = this._blankProgress();
    this._write(this.KEYS.PROGRESS, all);
    this.setSession(username);
    return { ok: true };
  },
  login(username, password) {
    const users = this.getUsers();
    if (!users[username]) return { ok: false, msg: '用户不存在' };
    if (users[username].password !== password) return { ok: false, msg: '密码错误' };
    this.setSession(username);
    return { ok: true };
  },
  logout() {
    localStorage.removeItem(this.KEYS.SESSION);
  },
  setSession(username) {
    this._write(this.KEYS.SESSION, { username, ts: Date.now() });
  },
  getSession() {
    return this._read(this.KEYS.SESSION, null);
  },
  currentUser() {
    const s = this.getSession();
    if (!s) return null;
    const users = this.getUsers();
    return users[s.username] || null;
  },
  _randomAvatar() {
    const list = ['🦊', '🐱', '🐻', '🐼', '🐨', '🦁', '🐯', '🐰', '🐸', '🐵', '🦉', '🐙'];
    return list[Math.floor(Math.random() * list.length)];
  },

  /* ---------- 学习进度 ---------- */
  _blankProgress() {
    return {
      xp: 0,
      completedLessons: [],        // lesson ids
      lessonStats: {},              // lessonId -> { bestScore, accuracy, type, ts }
      dailyActivity: {},            // 'YYYY-MM-DD' -> xp earned that day
      streak: 0,
      maxStreak: 0,
      lastStudyDate: null,
      unlockedAchievements: [],
      typeCounts: { vocab: 0, grammar: 0, speaking: 0, listening: 0 },
      typeAccuracy: { vocab: [], grammar: [], speaking: [], listening: [] },
      postsCount: 0,
      preferences: { langs: [], goal: 'daily', dailyGoal: 30 } // dailyGoal in xp
    };
  },
  getProgress(username) {
    const all = this._read(this.KEYS.PROGRESS, {});
    return all[username] || this._blankProgress();
  },
  saveProgress(username, progress) {
    const all = this._read(this.KEYS.PROGRESS, {});
    all[username] = progress;
    this._write(this.KEYS.PROGRESS, all);
  },

  /* 记录一节课完成 */
  recordLesson(username, lesson, score, accuracy) {
    const p = this.getProgress(username);
    const already = p.completedLessons.includes(lesson.id);
    if (!already) {
      p.completedLessons.push(lesson.id);
      p.completedLessonsCount = p.completedLessons.length;
      // 仅首次完成才加 xp，避免重复刷分
      p.xp += lesson.xp;
    }
    p.lessonStats[lesson.id] = {
      bestScore: Math.max((p.lessonStats[lesson.id]?.bestScore || 0), score),
      accuracy: accuracy,
      type: lesson.type,
      ts: Date.now()
    };
    // 类型计数与准确率
    p.typeCounts[lesson.type] = (p.typeCounts[lesson.type] || 0) + (already ? 0 : 1);
    if (accuracy != null) {
      if (!p.typeAccuracy[lesson.type]) p.typeAccuracy[lesson.type] = [];
      p.typeAccuracy[lesson.type].push(accuracy);
    }
    // 当日活动 + 连胜
    const today = new Date().toISOString().slice(0, 10);
    p.dailyActivity[today] = (p.dailyActivity[today] || 0) + (already ? 0 : lesson.xp);
    this._updateStreak(p, today);
    this.saveProgress(username, p);
    return p;
  },

  _updateStreak(p, today) {
    if (p.lastStudyDate === today) {
      // already counted today
    } else {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (p.lastStudyDate === yesterday) {
        p.streak = (p.streak || 0) + 1;
      } else {
        p.streak = 1;
      }
      p.lastStudyDate = today;
    }
    p.maxStreak = Math.max(p.maxStreak || 0, p.streak || 0);
  },

  /* 更新偏好 */
  setPreferences(username, prefs) {
    const p = this.getProgress(username);
    p.preferences = { ...p.preferences, ...prefs };
    this.saveProgress(username, p);
  },

  incPostsCount(username) {
    const p = this.getProgress(username);
    p.postsCount = (p.postsCount || 0) + 1;
    this.saveProgress(username, p);
  },

  /* ---------- 社区 ---------- */
  getPosts() {
    const stored = this._read(this.KEYS.POSTS, null);
    if (stored) return stored;
    // 首次使用种子数据
    this._write(this.KEYS.POSTS, SEED_POSTS);
    return SEED_POSTS;
  },
  savePosts(posts) {
    this._write(this.KEYS.POSTS, posts);
  },
  addPost(post) {
    const posts = this.getPosts();
    posts.unshift(post);
    this.savePosts(posts);
  },
  toggleLike(postId, username) {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.likedBy = post.likedBy || [];
    if (post.likedBy.includes(username)) {
      post.likedBy = post.likedBy.filter(u => u !== username);
      post.likes = Math.max(0, (post.likes || 0) - 1);
    } else {
      post.likedBy.push(username);
      post.likes = (post.likes || 0) + 1;
    }
    this.savePosts(posts);
  },
  addComment(postId, comment) {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.comments = post.comments || [];
    post.comments.push(comment);
    this.savePosts(posts);
  },

  /* ---------- 统计派生 ---------- */
  getStats(username) {
    const p = this.getProgress(username);
    const langsTouched = new Set();
    let speakingDone = 0, listeningDone = 0;
    p.completedLessons.forEach(lid => {
      const course = COURSES.find(c => c.lessons.some(l => l.id === lid));
      if (course) langsTouched.add(course.lang);
      const lesson = COURSES.flatMap(c => c.lessons).find(l => l.id === lid);
      if (lesson) {
        if (lesson.type === 'speaking') speakingDone++;
        if (lesson.type === 'listening') listeningDone++;
      }
    });
    return {
      ...p,
      completedLessonsCount: p.completedLessons.length,
      langsTouched: langsTouched.size,
      speakingDone,
      listeningDone,
      postsCount: p.postsCount || 0,
      maxStreak: p.maxStreak || 0
    };
  }
};

window.Store = Store;
