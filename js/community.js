/* ============================================================
 * PolyLingua - 社区交流模块
 * 发帖 / 浏览 / 点赞 / 评论
 * ============================================================ */

const Community = {
  render() {
    const posts = Store.getPosts();
    return `
      <div class="between" style="margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="section-title">学习社区 💬</h1>
          <p class="section-sub">与全球语言学习者交流心得、互相鼓励</p>
        </div>
        <button class="btn btn-primary" onclick="Community.openCompose()">✍️ 发布动态</button>
      </div>

      <div class="wrap-gap" style="margin-bottom:20px">
        ${['全部','en','ja','ko'].map((l,i) => `
          <button class="btn ${Community._filter===l || (!Community._filter && l==='全部') ? 'btn-primary' : 'btn-outline'}" onclick="Community.setFilter('${l}')">
            ${l==='全部'?'🌍 全部':LANGUAGES[l].flag+' '+LANGUAGES[l].name}
          </button>`).join('')}
      </div>

      <div id="post-list">
        ${this._renderList(posts)}
      </div>`;
  },

  _filter: '全部',

  setFilter(l) {
    this._filter = l;
    App.render();
  },

  _renderList(posts) {
    const f = this._filter;
    const filtered = f === '全部' ? posts : posts.filter(p => p.lang === f);
    if (!filtered.length) return '<div class="empty"><div class="ic">📝</div>还没有相关动态，快来发布第一条吧！</div>';
    return filtered.map(p => this._postHtml(p)).join('');
  },

  _postHtml(p) {
    const user = Store.currentUser();
    const liked = (p.likedBy || []).includes(user.username);
    const langName = LANGUAGES[p.lang] ? LANGUAGES[p.lang].name : '';
    return `
      <div class="post-card" id="post-${p.id}">
        <div class="post-head">
          <div class="ava">${p.avatar || '🙂'}</div>
          <div class="meta">
            <div class="author">${this._esc(p.author)} <span class="badge badge-lang-${p.lang}" style="margin-left:4px">${langName}</span></div>
            <div class="time">${p.time || ''}</div>
          </div>
        </div>
        <h3>${this._esc(p.title)}</h3>
        <div class="content">${this._esc(p.content)}</div>
        <div class="post-actions">
          <button class="${liked ? 'liked' : ''}" onclick="Community.like('${p.id}')">❤️ ${p.likes || 0}</button>
          <button onclick="Community.toggleComment('${p.id}')">💬 ${(p.comments || []).length}</button>
        </div>
        <div id="comments-${p.id}" style="display:none">
          <div class="comment-list">
            ${(p.comments || []).map(c => `
              <div class="comment">
                <div class="ava">${c.avatar || '🙂'}</div>
                <div class="cbody">
                  <div class="ch">${this._esc(c.author)}</div>
                  <div class="cc">${this._esc(c.content)}</div>
                  <div class="ct">${c.time || ''}</div>
                </div>
              </div>`).join('')}
          </div>
          <div class="row" style="margin-top:10px">
            <input id="cinput-${p.id}" class="fill-input" style="flex:1" placeholder="写下你的评论…" onkeydown="if(event.key==='Enter')Community.submitComment('${p.id}')"/>
            <button class="btn btn-primary" onclick="Community.submitComment('${p.id}')">发送</button>
          </div>
        </div>
      </div>`;
  },

  like(id) {
    const user = Store.currentUser();
    Store.toggleLike(id, user.username);
    this._refresh();
  },

  toggleComment(id) {
    const el = document.getElementById('comments-' + id);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  },

  submitComment(id) {
    const input = document.getElementById('cinput-' + id);
    const text = input.value.trim();
    if (!text) return;
    const user = Store.currentUser();
    Store.addComment(id, {
      author: user.nickname,
      avatar: user.avatar,
      content: text,
      time: '刚刚'
    });
    input.value = '';
    this._refresh();
    setTimeout(() => { document.getElementById('comments-' + id).style.display = 'block'; }, 50);
    App.toast('评论已发布', 'success');
  },

  openCompose() {
    const root = document.getElementById('modal-root');
    root.innerHTML = `
      <div class="modal-overlay" id="compose-overlay">
        <div class="modal" style="max-width:520px" onclick="event.stopPropagation()">
          <h2>发布动态 ✍️</h2>
          <p class="sub">分享你的学习心得或提问求助</p>
          <div class="field">
            <label>语言分类</label>
            <select id="cp-lang">
              <option value="en">🇬🇧 英语</option>
              <option value="ja">🇯🇵 日语</option>
              <option value="ko">🇰🇷 韩语</option>
            </select>
          </div>
          <div class="field">
            <label>标题</label>
            <input id="cp-title" type="text" placeholder="一句话概括你的动态" />
          </div>
          <div class="field">
            <label>内容</label>
            <textarea id="cp-content" rows="4" placeholder="详细描述你的想法…" style="resize:vertical"></textarea>
          </div>
          <div id="cp-err" class="form-err"></div>
          <div class="row" style="justify-content:flex-end">
            <button class="btn btn-ghost" onclick="Community.closeCompose()">取消</button>
            <button class="btn btn-primary" onclick="Community.submitCompose()">发布</button>
          </div>
        </div>
      </div>`;
    document.getElementById('compose-overlay').addEventListener('click', () => this.closeCompose());
    setTimeout(() => document.getElementById('cp-title').focus(), 50);
  },

  submitCompose() {
    const lang = document.getElementById('cp-lang').value;
    const title = document.getElementById('cp-title').value.trim();
    const content = document.getElementById('cp-content').value.trim();
    const err = document.getElementById('cp-err');
    if (!title || !content) { err.textContent = '标题和内容不能为空'; return; }
    const user = Store.currentUser();
    Store.addPost({
      id: 'p' + Date.now(),
      author: user.nickname,
      avatar: user.avatar,
      lang, title, content,
      likes: 0, likedBy: [], comments: [], time: '刚刚'
    });
    Store.incPostsCount(user.username);
    this.closeCompose();
    Achievements.check(user.username);
    App.toast('动态已发布 🎉', 'success');
    App.render();
  },

  closeCompose() {
    document.getElementById('modal-root').innerHTML = '';
  },

  _refresh() {
    const list = document.getElementById('post-list');
    if (list) list.innerHTML = this._renderList(Store.getPosts());
  },

  _esc(s) {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }
};

window.Community = Community;
