/* ============================================================
 * PolyLingua - 用户注册 / 登录 模块
 * ============================================================ */

const Auth = {
  /* 渲染登录模态 */
  openLogin() {
    this._renderAuthModal('login');
  },
  openRegister() {
    this._renderAuthModal('register');
  },

  _renderAuthModal(mode) {
    const root = document.getElementById('modal-root');
    const isLogin = mode === 'login';
    root.innerHTML = `
      <div class="modal-overlay" id="auth-overlay">
        <div class="modal" onclick="event.stopPropagation()">
          <h2>${isLogin ? '欢迎回来 👋' : '加入 PolyLingua 🚀'}</h2>
          <p class="sub">${isLogin ? '登录继续你的语言学习之旅' : '注册账号，开启沉浸式多语种学习'}</p>
          <div id="auth-err" class="form-err"></div>
          ${!isLogin ? `
          <div class="field">
            <label>昵称</label>
            <input id="f-nick" type="text" placeholder="给自己起个昵称" />
          </div>` : ''}
          <div class="field">
            <label>用户名</label>
            <input id="f-user" type="text" placeholder="用于登录的用户名" autocomplete="username" />
          </div>
          <div class="field">
            <label>密码</label>
            <input id="f-pass" type="password" placeholder="请输入密码" autocomplete="current-password" />
          </div>
          <button class="btn btn-primary btn-lg" style="width:100%" onclick="Auth.submit('${mode}')">
            ${isLogin ? '登 录' : '注 册'}
          </button>
          <div class="switch">
            ${isLogin ? '还没有账号？<a onclick="Auth.openRegister()">立即注册</a>'
                     : '已有账号？<a onclick="Auth.openLogin()">去登录</a>'}
          </div>
        </div>
      </div>`;
    document.getElementById('auth-overlay').addEventListener('click', () => this.close());
    setTimeout(() => {
      const el = document.getElementById(isLogin ? 'f-user' : 'f-nick');
      if (el) el.focus();
    }, 50);
    // 回车提交
    document.getElementById('f-pass').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submit(mode);
    });
  },

  submit(mode) {
    const errEl = document.getElementById('auth-err');
    const user = document.getElementById('f-user').value.trim();
    const pass = document.getElementById('f-pass').value;
    errEl.textContent = '';
    if (!user || !pass) { errEl.textContent = '请填写用户名和密码'; return; }
    if (user.length < 2) { errEl.textContent = '用户名至少 2 个字符'; return; }
    if (pass.length < 4) { errEl.textContent = '密码至少 4 个字符'; return; }

    let res;
    if (mode === 'register') {
      const nick = document.getElementById('f-nick')?.value.trim() || user;
      res = Store.register(user, pass, nick);
    } else {
      res = Store.login(user, pass);
    }
    if (!res.ok) { errEl.textContent = res.msg; return; }
    this.close();
    App.toast(mode === 'register' ? '注册成功，欢迎加入！' : '登录成功，继续学习吧！', 'success');
    App.onAuthChange();
  },

  logout() {
    Store.logout();
    App.toast('已退出登录');
    App.onAuthChange();
  },

  close() {
    document.getElementById('modal-root').innerHTML = '';
  }
};

window.Auth = Auth;
