// Sign up form. Loaded after login.js. The first account created becomes the admin.
(function(){
  window.wikiAuth.showSignup = function(){
    const auth = window.wikiAuth;
    const el = document.getElementById('content');
    el.innerHTML = `<h2>Sign up</h2>
      <label class="lbl" for="suUser">Username <span class="muted">(3-20 letters, numbers or _)</span></label>
      <input type="text" id="suUser" autocomplete="username" style="width:100%;margin-bottom:12px">
      <label class="lbl" for="suEmail">Email <span class="muted">(optional)</span></label>
      <input type="email" id="suEmail" autocomplete="email" style="width:100%;margin-bottom:12px">
      <label class="lbl" for="suPass">Password <span class="muted">(at least 8 characters)</span></label>
      <input type="password" id="suPass" autocomplete="new-password" style="width:100%;margin-bottom:12px">
      <label class="lbl" for="suPass2">Repeat password</label>
      <input type="password" id="suPass2" autocomplete="new-password" style="width:100%;margin-bottom:12px">
      <div class="toolbar"><button id="suBtn">Create account</button><button id="suLogin">Log in instead</button></div>
      <p class="muted" id="suMsg"></p>`;
    const msg = document.getElementById('suMsg');
    const go = async () => {
      const pass = document.getElementById('suPass').value;
      if(pass !== document.getElementById('suPass2').value){ msg.textContent = "Passwords don't match"; return; }
      msg.textContent = 'Creating account…';
      const r = await auth.call('/signup', 'POST', {
        username: document.getElementById('suUser').value,
        email: document.getElementById('suEmail').value,
        password: pass
      });
      if(!r.ok){ msg.textContent = r.data.error || 'Sign up failed'; return; }
      auth.set({token: r.data.token, user: r.data.user});
      openPage('Main Page');
    };
    document.getElementById('suBtn').onclick = go;
    document.getElementById('suPass2').onkeydown = e => { if(e.key === 'Enter') go(); };
    document.getElementById('suLogin').onclick = () => auth.showLogin();
  };
})();
