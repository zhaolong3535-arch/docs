/* ============================================================
 * PolyLingua - 互动学习模块
 * 单词记忆 / 语法练习 / 口语跟读 / 听力训练
 * 使用 Web Speech API (TTS + STT) 实现真实发音与识别
 * ============================================================ */

const Learning = {
  state: null, // 当前会话状态

  /* 语音合成：朗读文本 */
  speak(text, lang) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang || 'en-US';
    u.rate = 0.92;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  },

  /* 语音识别：判断用户朗读 */
  recognize(lang, onResult, onEnd) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { onResult(null, false, '当前浏览器不支持语音识别，请使用 Chrome'); return null; }
    const r = new SR();
    r.lang = lang || 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult(transcript, true);
    };
    r.onerror = () => onResult(null, false, '识别失败，请重试');
    r.onend = () => onEnd && onEnd();
    r.start();
    return r;
  },

  /* 字符串相似度 (基于编辑距离的归一化) */
  similarity(a, b) {
    a = (a || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    b = (b || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').trim();
    if (!a && !b) return 0;
    const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    const dist = dp[a.length][b.length];
    return 1 - dist / Math.max(a.length, b.length);
  },

  /* 初始化会话状态 */
  _initState(lesson) {
    const course = COURSES.find(c => c.lessons.some(l => l.id === lesson.id));
    const lang = LANGUAGES[course.lang];
    this.state = {
      lesson, course, lang,
      items: [...lesson.items],
      index: 0,
      correct: 0,
      total: lesson.items.length,
      answered: false
    };
  },

  /* 启动一节课的学习会话（从推荐/课程入口调用） */
  start(lesson) {
    this._initState(lesson);
    App.go('learn/' + lesson.id);
  },

  progress() {
    return Math.round((this.state.index / this.state.total) * 100);
  },

  next() {
    this.state.index++;
    this.state.answered = false;
    if (this.state.index >= this.state.total) {
      this.finish();
    } else {
      App.renderLearnView();
    }
  },

  finish() {
    const { lesson, correct, total } = this.state;
    const accuracy = total ? Math.round((correct / total) * 100) : 100;
    const score = accuracy;
    const user = Store.currentUser();
    Store.recordLesson(user.username, lesson, score, accuracy);
    // 检查并解锁成就
    const newlyUnlocked = Achievements.check(user.username);
    App.renderLearnResult(lesson, accuracy, newlyUnlocked);
    App.refreshTopbar();
    // 清理会话状态，避免影响后续课程
    this.state = null;
  },

  /* ============ 单词记忆 ============ */
  renderVocab() {
    const { items, index, lang } = this.state;
    const item = items[index];
    return `
      <div class="learn-card flashcard" id="fc" onclick="Learning.flipCard()">
        <div class="fc-inner">
          <div class="fc-face fc-front">
            <div class="word">${item.word}</div>
            <div class="phon">${item.phonetic || ''} <span class="muted">${item.pos || ''}</span></div>
            <button class="speak-btn" onclick="event.stopPropagation(); Learning.speak('${this._esc(item.word)}','${lang.tts}')">🔊 朗读</button>
            <div class="muted" style="margin-top:auto;font-size:13px">点击卡片查看释义</div>
          </div>
          <div class="fc-face fc-back">
            <div class="meaning">${item.meaning}</div>
            <div class="ex">"${item.example}"<br/><span class="muted">${item.exampleTrans || ''}</span></div>
            <button class="speak-btn" onclick="event.stopPropagation(); Learning.speak('${this._esc(item.example)}','${lang.tts}')">🔊 例句</button>
          </div>
        </div>
      </div>
      <div class="between" style="margin-top:20px">
        <span class="muted">记住这个词了吗？</span>
        <div class="row">
          <button class="btn btn-ghost" onclick="Learning.markKnown(false)">再看一次</button>
          <button class="btn btn-primary" onclick="Learning.markKnown(true)">已掌握 ✓</button>
        </div>
      </div>`;
  },

  flipCard() {
    document.getElementById('fc').classList.toggle('flipped');
  },

  markKnown(known) {
    if (known) this.state.correct++;
    this.next();
  },

  /* ============ 语法练习 ============ */
  renderGrammar() {
    const { items, index, answered } = this.state;
    const item = items[index];
    const isFill = item.type === 'fill';
    let optionsHtml = '';
    if (isFill) {
      optionsHtml = `
        <input id="fill-input" class="fill-input" placeholder="输入你的答案" onkeydown="if(event.key==='Enter')Learning.submitGrammar()"/>
        <div style="margin-top:16px"><button class="btn btn-primary" onclick="Learning.submitGrammar()">提交答案</button></div>`;
    } else {
      optionsHtml = '<div class="options">' + item.options.map((o, i) =>
        `<button class="option" data-val="${this._esc(o)}" onclick="Learning.chooseGrammar('${this._esc(o)}')">${o}</button>`
      ).join('') + '</div>';
    }
    const feedback = answered ? this._grammarFeedback(item) : '<div id="grammar-fb" style="min-height:24px"></div>';
    return `
      <div class="learn-card">
        <div class="q-text">${item.q}</div>
        <div id="grammar-options">${optionsHtml}</div>
        <div id="grammar-fb" style="margin-top:18px;min-height:24px;font-size:14px"></div>
      </div>`;
  },

  chooseGrammar(val) {
    if (this.state.answered) return;
    const item = this.state.items[this.state.index];
    const isCorrect = val === item.answer;
    if (isCorrect) this.state.correct++;
    this.state.answered = true;
    document.querySelectorAll('#grammar-options .option').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.val === item.answer) b.classList.add('correct');
      else if (b.dataset.val === val) b.classList.add('wrong');
    });
    this._showGrammarFb(isCorrect, item);
  },

  submitGrammar() {
    if (this.state.answered) { this.next(); return; }
    const item = this.state.items[this.state.index];
    const input = document.getElementById('fill-input').value.trim().toLowerCase();
    const isCorrect = input === String(item.answer).toLowerCase();
    if (isCorrect) this.state.correct++;
    this.state.answered = true;
    document.getElementById('fill-input').value = item.answer;
    document.getElementById('fill-input').style.borderColor = isCorrect ? 'var(--success)' : 'var(--danger)';
    this._showGrammarFb(isCorrect, item);
  },

  _showGrammarFb(isCorrect, item) {
    const fb = document.getElementById('grammar-fb');
    fb.innerHTML = `<div style="color:${isCorrect ? 'var(--success)' : 'var(--danger)'};font-weight:700">${isCorrect ? '✓ 回答正确' : '✗ 正确答案：' + item.answer}</div>
      <div class="muted" style="margin-top:6px">💡 ${item.explain}</div>
      <button class="btn btn-primary" style="margin-top:14px" onclick="Learning.next()">${this.state.index + 1 >= this.state.total ? '查看结果' : '下一题 →'}</button>`;
  },

  /* ============ 口语跟读 ============ */
  renderSpeaking() {
    const { items, index, lang } = this.state;
    const item = items[index];
    return `
      <div class="learn-card speak-stage">
        <div class="muted">请大声朗读下面的句子</div>
        <div class="target">${item.text}</div>
        <div class="trans">${item.translation}</div>
        <button class="speak-btn" onclick="Learning.speak('${this._esc(item.text)}','${lang.tts}')">🔊 听标准发音</button>
        <div style="margin-top:24px">
          <button class="mic-btn" id="mic-btn" onclick="Learning.startMic()">🎤</button>
          <div class="muted" style="margin-top:10px;font-size:13px" id="mic-hint">点击麦克风开始朗读</div>
        </div>
        <div class="recog-result" id="recog-result"></div>
        <div id="speak-fb"></div>
      </div>`;
  },

  startMic() {
    if (this.state.answered) return;
    const { lang } = this.state;
    const btn = document.getElementById('mic-btn');
    btn.classList.add('recording');
    document.getElementById('mic-hint').textContent = '正在聆听……请朗读';
    document.getElementById('recog-result').className = 'recog-result';
    document.getElementById('recog-result').textContent = '';

    this.recognize(lang.stt, (transcript, ok, errMsg) => {
      btn.classList.remove('recording');
      if (!ok) {
        document.getElementById('mic-hint').textContent = errMsg || '识别失败';
        return;
      }
      const target = this.state.items[this.state.index].text;
      const sim = this.similarity(transcript, target);
      const match = sim >= 0.6;
      const resEl = document.getElementById('recog-result');
      resEl.className = 'recog-result ' + (match ? 'match' : 'mismatch');
      resEl.innerHTML = `你说：${transcript}<br/><span class="similarity">相似度 ${Math.round(sim * 100)}%</span>`;
      if (match) this.state.correct++;
      this.state.answered = true;
      document.getElementById('speak-fb').innerHTML = `
        <div style="color:${match ? 'var(--success)' : 'var(--danger)'};font-weight:700;margin-top:8px">
          ${match ? '✓ 发音不错！' : '✗ 再试试，注意发音细节'}
        </div>
        <button class="btn btn-primary" style="margin-top:14px" onclick="Learning.next()">${this.state.index + 1 >= this.state.total ? '查看结果' : '下一句 →'}</button>`;
      document.getElementById('mic-hint').textContent = match ? '很棒！' : '可点击麦克风重试，或进入下一句';
      // 允许重试：未答完才能重录，但这里已 answered，提供一个重试按钮
      if (!match) {
        document.getElementById('speak-fb').innerHTML += `<button class="btn btn-ghost" style="margin-top:8px;margin-left:8px" onclick="Learning.retrySpeak()">重试</button>`;
      }
    }, () => btn.classList.remove('recording'));
  },

  retrySpeak() {
    this.state.answered = false;
    if (this.state.correct > 0) this.state.correct--; // 撤销之前误计
    document.getElementById('recog-result').className = 'recog-result';
    document.getElementById('recog-result').textContent = '';
    document.getElementById('speak-fb').innerHTML = '';
    document.getElementById('mic-hint').textContent = '点击麦克风开始朗读';
  },

  /* ============ 听力训练 ============ */
  renderListening() {
    const { items, index } = this.state;
    const item = items[index];
    const answered = this.state.answered;
    let optionsHtml = '<div class="options">' + item.options.map(o =>
      `<button class="option ${answered ? 'disabled' : ''}" data-val="${this._esc(o)}" onclick="Learning.chooseListen('${this._esc(o)}')">${o}</button>`
    ).join('') + '</div>';
    let fb = '';
    if (answered) {
      const isCorrect = this.state._lastCorrect;
      fb = `<div style="margin-top:14px;color:${isCorrect ? 'var(--success)' : 'var(--danger)'};font-weight:700">${isCorrect ? '✓ 正确' : '✗ 正确答案：' + item.answer}</div>
        <div class="muted" style="margin-top:6px">📜 原文：${item.transcript}</div>
        <button class="btn btn-primary" style="margin-top:14px" onclick="Learning.next()">${this.state.index + 1 >= this.state.total ? '查看结果' : '下一题 →'}</button>`;
    }
    return `
      <div class="learn-card">
        <div class="listen-audio-box">
          <button class="play-audio-btn" onclick="Learning.playListen()">▶</button>
          <div class="muted" style="font-size:13px">点击播放音频（可多次播放）</div>
        </div>
        <div class="q-text">${item.question}</div>
        <div id="listen-opts">${optionsHtml}</div>
        <div id="listen-fb">${fb}</div>
      </div>`;
  },

  playListen() {
    const item = this.state.items[this.state.index];
    this.speak(item.audio, this.state.lang.tts);
  },

  chooseListen(val) {
    if (this.state.answered) return;
    const item = this.state.items[this.state.index];
    const isCorrect = val === item.answer;
    if (isCorrect) this.state.correct++;
    this.state.answered = true;
    this.state._lastCorrect = isCorrect;
    document.querySelectorAll('#listen-opts .option').forEach(b => {
      b.classList.add('disabled');
      if (b.dataset.val === item.answer) b.classList.add('correct');
      else if (b.dataset.val === val) b.classList.add('wrong');
    });
    const isC = isCorrect;
    document.getElementById('listen-fb').innerHTML = `
      <div style="color:${isC ? 'var(--success)' : 'var(--danger)'};font-weight:700;margin-top:14px">${isC ? '✓ 正确' : '✗ 正确答案：' + item.answer}</div>
      <div class="muted" style="margin-top:6px">📜 原文：${item.transcript}</div>
      <button class="btn btn-primary" style="margin-top:14px" onclick="Learning.next()">${this.state.index + 1 >= this.state.total ? '查看结果' : '下一题 →'}</button>`;
  },

  /* ============ 工具 ============ */
  _esc(s) {
    return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
};

window.Learning = Learning;
