// Login + shared session helper (window.wikiAuth). Needs API_BASE from app.js.
(function(){
  const KEY = 'wikiSession';
  const read = () => { try{ return JSON.parse(localStorage.getItem(KEY) || 'null'); }catch(e){ return null; } };

  const waitText = secs => {
    if(!secs) return '';
    const m = Math.ceil(secs / 60);
    return m > 1 ? ' Try again in about ' + m + ' minutes.' : ' Try again in a minute.';
  };

  const auth = window.wikiAuth = {
    token: () => (read() || {}).token || null,
    user: () => (read() || {}).user || null,
    set(session){ try{ localStorage.setItem(KEY, JSON.stringify(session)); }catch(e){} auth.bar(); },
    clear(){ try{ localStorage.removeItem(KEY); }catch(e){} auth.bar(); },

    async call(path, method, body){
      const headers = {'content-type': 'application/json'};
      if(auth.token()) headers.authorization = 'Bearer ' + auth.token();
      try{
        const r = await fetch(API_BASE + path, {method, headers, body: body ? JSON.stringify(body) : undefined});
        let data = {};
        try{ data = await r.json(); }catch(e){}
        return {ok: r.ok, status: r.status, data};
      }catch(e){
        return {ok: false, status: 0, data: {error: 'Could not reach the server'}};
      }
    },

    // Log in / Sign up / Log out buttons next to Export
    bar(){
      let box = document.getElementById('authBox');
      if(!box){
        const anchor = document.getElementById('exportBtn');
        if(!anchor) return;
        box = document.createElement('span');
        box.id = 'authBox';
        anchor.insertAdjacentElement('afterend', box);
      }
      box.innerHTML = '';
      const add = (label, fn) => {
        const b = document.createElement('button');
        b.textContent = label; b.onclick = fn; box.appendChild(b);
      };
      const u = auth.user();
      if(u){
        const s = document.createElement('span');
        s.className = 'muted';
        s.textContent = '👤 ' + u.username + (u.admin ? ' (admin)' : '') + ' ';
        box.appendChild(s);
        add('Change password', () => auth.showChangePassword());
        add('Log out', async () => { await auth.call('/logout', 'POST'); auth.clear(); });
      }else{
        add('Log in', () => auth.showLogin());
        add('Sign up', () => auth.showSignup && auth.showSignup());
      }
    },

    showLogin(){
      const el = document.getElementById('content');
      el.innerHTML = `<h2>Log in</h2>
        <label class="lbl" for="liUser">Username</label>
        <input type="text" id="liUser" autocomplete="username" style="width:100%;margin-bottom:12px">
        <label class="lbl" for="liPass">Password</label>
        <input type="password" id="liPass" autocomplete="current-password" style="width:100%;margin-bottom:12px">
        <div class="toolbar"><button id="liBtn">Log in</button><button id="liSignup">Sign up instead</button></div>
        <p class="muted" id="liMsg"></p>`;
      const msg = document.getElementById('liMsg');
      const go = async () => {
        msg.textContent = 'Logging in…';
        const r = await auth.call('/login', 'POST', {
          username: document.getElementById('liUser').value,
          password: document.getElementById('liPass').value
        });
        if(!r.ok){
          if(r.status === 429){
            msg.textContent = (r.data.error || 'Too many failed attempts.') + waitText(r.data.retryAfter);
          }else{
            msg.textContent = r.data.error || 'Login failed';
          }
          return;
        }
        auth.set({token: r.data.token, user: r.data.user});
        openPage('Main Page');
      };
      document.getElementById('liBtn').onclick = go;
      document.getElementById('liPass').onkeydown = e => { if(e.key === 'Enter') go(); };
      document.getElementById('liSignup').onclick = () => auth.showSignup && auth.showSignup();
    },

    showChangePassword(){
      if(!auth.user()){ auth.showLogin(); return; }
      const el = document.getElementById('content');
      el.innerHTML = `<h2>Change password</h2>
        <label class="lbl" for="cpOld">Current password</label>
        <input type="password" id="cpOld" autocomplete="current-password" style="width:100%;margin-bottom:12px">
        <label class="lbl" for="cpNew">New password (at least 8 characters)</label>
        <input type="password" id="cpNew" autocomplete="new-password" style="width:100%;margin-bottom:12px">
        <label class="lbl" for="cpNew2">Repeat new password</label>
        <input type="password" id="cpNew2" autocomplete="new-password" style="width:100%;margin-bottom:12px">
        <div class="toolbar"><button id="cpBtn">Change password</button><button id="cpCancel">Cancel</button></div>
        <p class="muted" id="cpMsg"></p>`;
      const msg = document.getElementById('cpMsg');
      const go = async () => {
        const oldPassword = document.getElementById('cpOld').value;
        const newPassword = document.getElementById('cpNew').value;
        const again = document.getElementById('cpNew2').value;
        if(!oldPassword){ msg.textContent = 'Enter your current password'; return; }
        if(newPassword.length < 8){ msg.textContent = 'New password must be at least 8 characters'; return; }
        if(newPassword !== again){ msg.textContent = 'The new passwords don\u2019t match'; return; }
        if(newPassword === oldPassword){ msg.textContent = 'Choose a password different from the current one'; return; }
        msg.textContent = 'Changing password…';
        const r = await auth.call('/change-password', 'POST', {oldPassword, newPassword});
        if(!r.ok){
          if(r.status === 429){
            msg.textContent = (r.data.error || 'Too many failed attempts.') + waitText(r.data.retryAfter);
          }else{
            msg.textContent = r.data.error || 'Could not change password';
          }
          return;
        }
        if(r.data.token) auth.set({token: r.data.token, user: auth.user()});
        msg.textContent = 'Password changed. Other devices have been logged out.';
        document.getElementById('cpOld').value = '';
        document.getElementById('cpNew').value = '';
        document.getElementById('cpNew2').value = '';
      };
      document.getElementById('cpBtn').onclick = go;
      document.getElementById('cpNew2').onkeydown = e => { if(e.key === 'Enter') go(); };
      document.getElementById('cpCancel').onclick = () => openPage('Main Page');
    }
  };

  auth.bar();
})();
