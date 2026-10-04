const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const randHex = n => hex(crypto.getRandomValues(new Uint8Array(n)));
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const now = () => Math.floor(Date.now() / 1000);

const HOUR = 3600;
const ADMIN_IDLE = 12 * HOUR;
const ADMIN_MAX = 7 * 86400;
const USER_IDLE = 30 * 86400;

async function hashPassword(password, saltHex){
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const salt = new Uint8Array(saltHex.match(/../g).map(h => parseInt(h, 16)));
  const bits = await crypto.subtle.deriveBits(
    {name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000}, key, 256);
  return hex(bits);
}

function same(a, b){
  if(a.length !== b.length) return false;
  let d = 0;
  for(let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

async function readJson(request, max){
  try{
    const text = await request.text();
    if(text.length > max) return null;
    const v = JSON.parse(text);
    return v && typeof v === 'object' ? v : null;
  }catch(e){ return null; }
}

async function lockedFor(env, keys){
  const t = now();
  let wait = 0;
  for(const k of keys){
    const r = await env.DB.prepare('SELECT locked_until FROM login_attempts WHERE key = ?').bind(k).first();
    if(r && r.locked_until > t) wait = Math.max(wait, r.locked_until - t);
  }
  return wait;
}

async function recordFail(env, key, limit, maxLock){
  const t = now();
  await env.DB.prepare('DELETE FROM login_attempts WHERE last < ? AND locked_until < ?')
    .bind(t - 86400, t).run();
  const r = await env.DB.prepare('SELECT fails, level, last FROM login_attempts WHERE key = ?').bind(key).first();
  let fails = r ? r.fails : 0;
  let level = r ? r.level : 0;
  if(r && t - r.last > HOUR) fails = 0;
  if(r && t - r.last > 86400) level = 0;
  fails++;
  let lock = 0;
  if(fails >= limit){
    level++;
    lock = Math.min(900 * Math.pow(2, level - 1), maxLock);
    fails = 0;
  }
  await env.DB.prepare(
    'INSERT OR REPLACE INTO login_attempts (key, fails, level, locked_until, last) VALUES (?, ?, ?, ?, ?)')
    .bind(key, fails, level, lock ? t + lock : 0, t).run();
  return lock;
}

async function clearFails(env, keys){
  for(const k of keys){
    await env.DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(k).run();
  }
}

async function newSession(env, user){
  const token = randHex(32);
  const t = now();
  await env.DB.prepare('DELETE FROM sessions WHERE expires < ?').bind(t).run();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires, created) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), user.id, t + (user.is_admin ? ADMIN_IDLE : USER_IDLE), t).run();
  return {token, user: {username: user.username, admin: !!user.is_admin}};
}

async function who(request, env){
  const m = (request.headers.get('authorization') || '').match(/^Bearer (.+)$/);
  if(!m) return null;
  const th = await sha256(m[1]);
  const t = now();
  const s = await env.DB.prepare(
    'SELECT u.id, u.username, u.is_admin, s.created, s.expires FROM sessions s ' +
    'JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires > ?').bind(th, t).first();
  if(!s) return null;
  const created = s.created || (s.expires - USER_IDLE);
  let expires = t + (s.is_admin ? ADMIN_IDLE : USER_IDLE);
  if(s.is_admin){
    const cap = created + ADMIN_MAX;
    if(t >= cap){
      await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(th).run();
      return null;
    }
    expires = Math.min(expires, cap);
  }
  if(!s.created || Math.abs(expires - s.expires) > 300){
    await env.DB.prepare('UPDATE sessions SET expires = ?, created = ? WHERE token_hash = ?')
      .bind(expires, created, th).run();
  }
  return {id: s.id, username: s.username, is_admin: s.is_admin};
}

async function route(request, env, json){
  const method = request.method;
  const seg = new URL(request.url).pathname.split('/').filter(Boolean);
  if(seg[0] !== 'api') return json({error: 'not found'}, 404);
  const name = seg[1];
  const title = seg[2] ? decodeURIComponent(seg[2]) : null;

  if(method === 'POST' && name === 'signup'){
    const b = await readJson(request, 5000);
    if(!b) return json({error: 'Bad request'}, 400);
    const username = String(b.username || '').trim();
    const password = String(b.password || '');
    const email = String(b.email || '').trim();
    if(!/^[A-Za-z0-9_]{3,20}$/.test(username))
      return json({error: 'Username must be 3-20 letters, numbers or _'}, 400);
    if(password.length < 8 || password.length > 200)
      return json({error: 'Password must be 8-200 characters'}, 400);
    if(email && (email.length > 200 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)))
      return json({error: 'Email looks invalid'}, 400);
    const count = (await env.DB.prepare('SELECT COUNT(*) AS c FROM users').first()).c;
    const salt = randHex(16);
    const hash = await hashPassword(password, salt);
    try{
      await env.DB.prepare(
        'INSERT INTO users (username, email, salt, hash, is_admin, created) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(username, email || null, salt, hash, count === 0 ? 1 : 0, now()).run();
    }catch(e){ return json({error: 'Username or email already taken'}, 409); }
    const user = await env.DB.prepare('SELECT id, username, is_admin FROM users WHERE username = ?')
      .bind(username).first();
    return json(await newSession(env, user));
  }

  if(method === 'POST' && name === 'login'){
    const b = await readJson(request, 5000);
    if(!b) return json({error: 'Bad request'}, 400);
    const uname = String(b.username || '').trim();
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const kPair = 'p:' + uname.toLowerCase().slice(0, 40) + '|' + ip;
    const kAcct = 'a:' + uname.toLowerCase().slice(0, 40);
    const wait = await lockedFor(env, [kPair, kAcct]);
    if(wait) return json({error: 'Too many failed attempts.', retryAfter: wait}, 429);
    const u = await env.DB.prepare(
      'SELECT id, username, salt, hash, is_admin FROM users WHERE username = ?')
      .bind(uname).first();
    const hash = await hashPassword(String(b.password || '').slice(0, 200), u ? u.salt : '00'.repeat(16));
    if(!u || !same(hash, u.hash)){
      const l1 = await recordFail(env, kPair, 3, 86400);
      const l2 = await recordFail(env, kAcct, 10, HOUR);
      const lock = Math.max(l1, l2);
      if(lock) return json({error: 'Too many failed attempts.', retryAfter: lock}, 429);
      return json({error: 'Wrong username or password'}, 401);
    }
    await clearFails(env, [kPair, kAcct]);
    return json(await newSession(env, u));
  }

  if(method === 'POST' && name === 'logout'){
    const m = (request.headers.get('authorization') || '').match(/^Bearer (.+)$/);
    if(m) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(m[1])).run();
    return json({ok: true});
  }

  if(method === 'GET' && name === 'me'){
    const u = await who(request, env);
    return u ? json({username: u.username, admin: !!u.is_admin}) : json({error: 'Not logged in'}, 401);
  }

  if(method === 'GET' && name === 'pages' && !title){
    const {results} = await env.DB.prepare('SELECT * FROM pages').all();
    const out = {};
    results.forEach(r => {
      out[r.title] = {summary: r.summary, body: r.body, img: r.img, cats: JSON.parse(r.cats)};
    });
    return json(out);
  }

  if(method === 'GET' && name === 'history' && title){
    const {results} = await env.DB.prepare(
      'SELECT id, username, ts, length(body) AS size FROM revisions WHERE title = ? ORDER BY id DESC LIMIT 50')
      .bind(title).all();
    return json(results);
  }

  const user = await who(request, env);
  if(!user) return json({error: 'Log in to edit'}, 401);

  if(method === 'POST' && name === 'change-password'){
    const b = await readJson(request, 5000);
    if(!b) return json({error: 'Bad request'}, 400);
    const oldPw = String(b.oldPassword || '').slice(0, 200);
    const newPw = String(b.newPassword || '');
    if(newPw.length < 8 || newPw.length > 200)
      return json({error: 'Password must be 8-200 characters'}, 400);
    if(newPw === oldPw)
      return json({error: 'Choose a password different from the current one'}, 400);
    const key = 'c:' + user.id;
    const wait = await lockedFor(env, [key]);
    if(wait) return json({error: 'Too many failed attempts.', retryAfter: wait}, 429);
    const row = await env.DB.prepare('SELECT salt, hash FROM users WHERE id = ?').bind(user.id).first();
    const check = await hashPassword(oldPw, row.salt);
    if(!same(check, row.hash)){
      const lock = await recordFail(env, key, 3, 86400);
      if(lock) return json({error: 'Too many failed attempts.', retryAfter: lock}, 429);
      return json({error: 'Current password is wrong'}, 401);
    }
    await clearFails(env, [key]);
    const salt = randHex(16);
    const hash = await hashPassword(newPw, salt);
    await env.DB.batch([
      env.DB.prepare('UPDATE users SET salt = ?, hash = ? WHERE id = ?').bind(salt, hash, user.id),
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id)
    ]);
    return json({ok: true, ...(await newSession(env, user))});
  }

  const savePage = (t, p) => [
    env.DB.prepare('INSERT OR REPLACE INTO pages (title, summary, body, img, cats) VALUES (?, ?, ?, ?, ?)')
      .bind(t, p.summary, p.body, p.img, p.cats),
    env.DB.prepare(
      'INSERT INTO revisions (title, summary, body, img, cats, user_id, username, ts) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(t, p.summary, p.body, p.img, p.cats, user.id, user.username, now())
  ];

  if(method === 'PUT' && name === 'pages' && title){
    const b = await readJson(request, 1800000);
    if(!b) return json({error: 'Bad request'}, 400);
    const p = {
      summary: String(b.summary || ''),
      body: String(b.body || ''),
      img: b.img ? String(b.img) : null,
      cats: JSON.stringify(Array.isArray(b.cats) ? b.cats.map(String).slice(0, 50) : [])
    };
    if(title.length > 120 || p.summary.length > 5000 || p.body.length > 200000 ||
       (p.img && (!p.img.startsWith('data:image/') || p.img.length > 1500000)))
      return json({error: 'Article too large or invalid'}, 400);
    const cur = await env.DB.prepare('SELECT summary, body, img, cats FROM pages WHERE title = ?')
      .bind(title).first();
    if(cur && cur.summary === p.summary && cur.body === p.body &&
       (cur.img || null) === p.img && cur.cats === p.cats) return json({ok: true, unchanged: true});
    await env.DB.batch(savePage(title, p));
    return json({ok: true});
  }

  if(!user.is_admin) return json({error: 'Admins only'}, 403);

  if(method === 'DELETE' && name === 'pages' && title){
    await env.DB.prepare('DELETE FROM pages WHERE title = ?').bind(title).run();
    return json({ok: true});
  }

  if(method === 'POST' && name === 'revert'){
    const b = await readJson(request, 1000);
    const rev = b && await env.DB.prepare(
      'SELECT title, summary, body, img, cats FROM revisions WHERE id = ?').bind(Number(b.id)).first();
    if(!rev) return json({error: 'Revision not found'}, 404);
    await env.DB.batch(savePage(rev.title, rev));
    return json({ok: true});
  }

  return json({error: 'Bad request'}, 400);
}

export default {
  async fetch(request, env){
    const cors = {
      'access-control-allow-origin': env.ALLOWED_ORIGIN || '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type'
    };
    const json = (d, s = 200) => new Response(JSON.stringify(d), {
      status: s, headers: {...cors, 'content-type': 'application/json'}
    });
    if(request.method === 'OPTIONS') return new Response(null, {headers: cors});
    try{ return await route(request, env, json); }
    catch(e){ return json({error: 'Server error'}, 500); }
  }
};
