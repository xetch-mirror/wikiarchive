# Build Your Own Wiki Archive

So you want your own wiki. Good news: it's easier than it sounds, and it can run for free on Cloudflare.

Here's the idea. Your articles live in a small database. A tiny API sits in front of it. And the website itself is just plain HTML and JavaScript that talks to that API. No frameworks, no servers to babysit.

Everything below can be done from the Cloudflare dashboard in your browser. If you're on your phone, you're still fine.

## The three pieces

- **`wiki`** is your database (D1). It holds articles, edit history and user accounts.
- **`wikiapi`** is a Worker that sits between the site and the database.
- **`wikiarchive`** is a Worker that serves your actual website files.

You'll need a free Cloudflare account. That's it.

---

## Step 1: Make the database

1. In the Cloudflare dashboard, go to **Storage & Databases → D1 → Create database**.
2. Call it `wiki`.
3. Open it, tap the **Console** tab, paste this in, and run it:

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT,
  summary TEXT,
  image_url TEXT,
  body TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  summary TEXT,
  image_url TEXT,
  body TEXT NOT NULL,
  edited_by INTEGER,
  edited_at INTEGER NOT NULL,
  FOREIGN KEY (page_id) REFERENCES pages(id)
);

CREATE INDEX IF NOT EXISTS idx_revisions_page ON revisions(page_id, edited_at DESC);
CREATE INDEX IF NOT EXISTS idx_pages_category ON pages(category);
```

Save this as `schema.sql` in your project too. Since the wiki is open source, anyone who forks it will need to run the exact same thing on their own database.

---

## Step 2: Make the API

1. Go to **Workers & Pages → Create → Create Worker**. Name it `wikiapi` and deploy.
2. Open it, then **Settings → Bindings → Add → D1 database**. Set the variable name to `DB` and pick your `wiki` database. (That name matters, the code below expects it.)
3. Hit **Edit code** and start with this:

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", ...cors },
      });

    if (url.pathname === "/api/pages" && request.method === "GET") {
      const { results } = await env.DB
        .prepare("SELECT slug, title, category, summary, image_url, updated_at FROM pages ORDER BY title")
        .all();
      return json(results);
    }

    const m = url.pathname.match(/^\/api\/pages\/([^/]+)$/);
    if (m && request.method === "GET") {
      const page = await env.DB
        .prepare("SELECT * FROM pages WHERE slug = ?")
        .bind(m[1])
        .first();
      return page ? json(page) : json({ error: "Not found" }, 404);
    }

    return json({ error: "Not found" }, 404);
  },
};
```

From there you'll add the rest of the routes you want:

- `GET /api/pages` to list articles (optionally filtered by `?category=`)
- `GET /api/pages/:slug` to read one
- `POST /api/pages` to create or edit (login required)
- `GET /api/pages/:slug/history` to see past versions
- `POST /api/signup`, `POST /api/login` and `POST /api/change-password`

One habit worth having from day one: always use `.bind()` with `?` placeholders for your queries. Never stitch user input into SQL by hand.

---

## Step 3: Login, signup and keeping people safe

This is the part where it pays to be careful, so here's what to do and why.

**Hash passwords. Never store them as typed.** If someone ever got a copy of your database, they should find gibberish, not passwords. The browser-built-in Web Crypto API can do this for you:

```js
async function hashPassword(password, saltBytes) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    key, 256
  );
  return new Uint8Array(bits);
}
```

Give every user their own random salt so two people with the same password don't end up with the same hash.

**Compare hashes the slow-and-steady way.** A normal `===` can finish faster or slower depending on how much matches, and that tiny difference can leak information. This version always checks every byte:

```js
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
```

**Lock people out after 3 wrong tries.** This stops someone from guessing passwords all day. When a login comes in:

1. If the account is currently locked, say no right away.
2. If the password is wrong, add one to `failed_attempts`.
3. On the third miss, lock the account for a while (15 minutes is a good start) and reset the counter.
4. If the password is right, reset the counter to zero.

And whatever goes wrong, give the same vague answer: "Invalid username or password." Don't tell people which half was wrong.

**Changing passwords.** Ask for the old password first and check it with `safeEqual` before saving the new one (with a fresh salt).

**Sessions.** After a good login, hand back a signed token with the user id and an expiry time. Keep the signing key in the Worker's **Settings → Variables and Secrets**, never in your code or on GitHub.

**About email.** It's optional here on purpose. Fewer emails stored means less to leak. The tradeoff is there's no "forgot password" email, so if someone gets locked out for good, an admin resets them by hand in the D1 console.

---

## Step 4: Edit history

This is what makes a wiki feel like a wiki: nothing ever really gets lost.

Whenever someone saves an edit, do two things: update the live page, and drop a copy into `revisions` with who made the change and when. Do both together in a batch so they can't get out of sync:

```js
await env.DB.batch([
  env.DB.prepare("UPDATE pages SET title=?, body=?, updated_at=?, updated_by=? WHERE id=?")
    .bind(title, body, now, userId, pageId),
  env.DB.prepare("INSERT INTO revisions (page_id, title, body, edited_by, edited_at) VALUES (?,?,?,?,?)")
    .bind(pageId, title, body, userId, now),
]);
```

Want to bring back an old version? Don't delete anything. Just save the old text as a brand new edit. That way the history always tells the full story.

---

## Step 5: The website

Keep things in separate files so they're easy to find and fix:

```
wiki/
├── index.html
├── app.js        # list, view, edit, categories, history, JSON import
├── login.js
├── signup.js
├── schema.sql
└── README.md
```

At the top of `app.js`, point the site at your API:

```js
const API = "https://wikiapi.YOUR-SUBDOMAIN.workers.dev";
```

Then the fun bits:

- **Infobox:** a photo and short summary at the top of each article.
- **Categories:** tag each article, and let people filter the home page.
- **JSON import:** upload a file of articles in one go. It looks like this:

```json
[
  {
    "slug": "hamburger",
    "title": "Hamburger",
    "category": "Food",
    "summary": "A sandwich of a ground-meat patty in a bun.",
    "image_url": "https://example.com/burger.jpg",
    "body": "Full article text here..."
  }
]
```

---

## Step 6: Put it online

1. Go to **Workers & Pages** and open (or create) the Worker for your site, like `wikiarchive`.
2. Upload `index.html`, `app.js`, `login.js` and `signup.js` as static assets.
3. Deploy, then open the URL. Check it in a private tab, too. Visitors who aren't logged in should still see your articles.

Changed something later? Upload the new files and deploy again.

---

## Step 7: Share it with the world

Since it's open source, put it on GitHub with a license and a README that walks people through:

1. Creating a D1 database called `wiki`.
2. Running `schema.sql` in the console.
3. Creating the API Worker, binding the database as `DB`, and adding a `SESSION_SECRET`.
4. Setting `API` in `app.js` to their own API address.
5. Deploying the site Worker.
6. Signing up, then making the first account an admin:

```sql
UPDATE users SET role = 'admin' WHERE id = 1;
```

---

## Before you launch: a quick gut-check

- [ ] Passwords are hashed with their own salt
- [ ] Hashes are compared with `safeEqual`
- [ ] The 3-strike lockout works
- [ ] The session secret lives in Worker Secrets, not in code
- [ ] Every SQL query uses `.bind()`
- [ ] Article text is escaped before showing it, so nobody can sneak in scripts
- [ ] Editing and importing need a login
- [ ] Login errors stay vague

## When something goes wrong

- **`/api/pages` throws an error:** check the D1 binding is named exactly `DB`.
- **CORS error in the browser:** make sure the Worker sends the CORS headers and answers `OPTIONS` requests.
- **Site shows old files:** redeploy the site Worker after uploading.
- **Someone's locked out:** in the D1 console, set `failed_attempts = 0` and `locked_until = 0` on their row.

Have fun with it. Start small, get one article showing up, and build from there.
