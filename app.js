const STORE_KEY = "wikiArchivePages_v1";

const seedPages = {
  "Main Page": {
    summary: "The front door of Wiki Archive.",
    body: "Welcome to Wiki Archive.\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nSee also: [[Lorem Ipsum]], [[Sample Article]], [[Placeholder Topic]].",
    img: null, cats: []
  },
  "Lorem Ipsum": {
    summary: "Placeholder text used in publishing and design.",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    img: null, cats: ["Placeholders"]
  },
  "Sample Article": {
    summary: "",
    body: "Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit.",
    img: null, cats: ["Placeholders", "Samples"]
  },
  "Placeholder Topic": {
    summary: "",
    body: "Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.",
    img: null, cats: ["Placeholders"]
  }
};

const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/* Locked articles live in the code, not in storage. They are re-applied on every
   load and can't be edited, deleted, overwritten by import, or exported. */
const LOCKED = {
  "Terms of Service": {
    summary: "The legally binding terms for using Wiki Archive.",
    body: [
      "# Terms of Service",
      "Last updated: September 28, 2026",
      "",
      "PLEASE READ THESE TERMS CAREFULLY. BY ACCESSING OR USING WIKI ARCHIVE, YOU AGREE TO BE BOUND BY THESE TERMS. IF YOU DO NOT AGREE, DO NOT USE THE SERVICE.",
      "",
      "## 1. Acceptance of Terms",
      "These Terms of Service (the \"Terms\") form a binding agreement between you (\"User,\" \"you,\" or \"your\") and [Operator Name] (\"Operator,\" \"we,\" \"us,\" or \"our\") governing your access to and use of Wiki Archive, including all associated pages, features, and content (collectively, the \"Service\").",
      "",
      "## 2. Definitions",
      "- \"User Content\" means any text, images, categories, summaries, or other material that you create, upload, import, or otherwise submit through the Service.",
      "- \"Locked Content\" means any article designated by the Operator as protected from modification, including this article.",
      "- \"Prohibited Conduct\" means any act described in Sections 5 and 6.",
      "",
      "## 3. Eligibility",
      "You represent that you have the legal capacity to enter into these Terms under the laws of your jurisdiction. If you are under the age of majority in your jurisdiction, you may use the Service only with the consent and supervision of a parent or legal guardian who agrees to be bound by these Terms.",
      "",
      "## 4. User Content and License",
      "You retain all ownership rights in your User Content. You represent and warrant that you own, or have obtained all necessary rights, licenses, and permissions to, all User Content you submit, and that such User Content does not infringe, misappropriate, or violate any third-party right or any applicable law.",
      "",
      "To the extent you make User Content available to others through the Service, including by exporting and sharing it, you grant the recipients a non-exclusive, worldwide, royalty-free, revocable license to view and reproduce that User Content for the purpose of using the Service.",
      "",
      "## 5. Acceptable Use",
      "You agree not to use the Service to:",
      "- Violate any applicable local, national, or international law or regulation",
      "- Post, upload, or import content that is unlawful, defamatory, harassing, threatening, obscene, hateful, or that infringes the rights of any third party",
      "- Post or import malicious code, scripts, or data intended to disrupt, damage, or gain unauthorized access to the Service or any device or system",
      "- Impersonate any person or entity, or misrepresent your affiliation with any person or entity",
      "- Collect or store personal data about others without their lawful consent",
      "",
      "## 6. Vandalism and Abuse",
      "Vandalism is strictly prohibited. \"Vandalism\" means any deliberate act intended to damage, deface, degrade, or corrupt the Service or its content, including without limitation:",
      "- Adding false, misleading, nonsensical, or offensive content to an article in bad faith",
      "- Blanking, deleting, or replacing article content in order to disrupt the Service or mislead others",
      "- Creating articles, categories, or links for the purpose of spam, advertising, or harassment",
      "- Circumventing, disabling, or tampering with any protection, restriction, or lock, including any attempt to modify Locked Content",
      "- Importing or distributing altered data files with the intent to deceive others as to their origin or content",
      "",
      "We reserve the right, in our sole discretion and without prior notice, to revert, remove, or restore any content affected by vandalism, and to take any further action described in Section 12.",
      "",
      "## 7. Intellectual Property",
      "The Service, including its software, design, layout, text, and Locked Content, is owned by the Operator or its licensors and is protected by copyright, trademark, and other intellectual property laws. Except as expressly permitted in these Terms, you may not copy, modify, distribute, sell, lease, reverse engineer, or create derivative works from any part of the Service.",
      "",
      "We respect the intellectual property rights of others. If you believe that content available through the Service infringes your copyright, please contact us using the details in Section 16 with a description of the work, the location of the allegedly infringing material, and your contact information.",
      "",
      "## 8. Privacy and Local Storage",
      "The Service stores User Content locally in your web browser. We do not receive, access, or control that stored data unless you choose to transmit it to us. You are solely responsible for maintaining backups of your User Content, including by using the Export feature. Clearing your browser data, changing devices, or reaching storage limits may result in permanent loss of User Content, for which we accept no responsibility.",
      "",
      "## 9. Disclaimer of Warranties",
      "THE SERVICE IS PROVIDED ON AN \"AS IS\" AND \"AS AVAILABLE\" BASIS, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY CONTENT WILL BE ACCURATE OR RELIABLE.",
      "",
      "## 10. Limitation of Liability",
      "TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE OPERATOR OR ITS AFFILIATES, OFFICERS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING LOSS OF DATA, PROFITS, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF, OR INABILITY TO USE, THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID TO US FOR THE SERVICE IN THE TWELVE MONTHS PRECEDING THE CLAIM OR ONE HUNDRED U.S. DOLLARS (USD $100).",
      "",
      "## 11. Indemnification",
      "You agree to defend, indemnify, and hold harmless the Operator and its affiliates, officers, employees, and agents from and against any and all claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your User Content, your use of the Service, your violation of these Terms, or your violation of any rights of another.",
      "",
      "## 12. Termination and Enforcement",
      "We may suspend, restrict, or terminate your access to the Service at any time, with or without notice, for any conduct that we determine, in our sole discretion, violates these Terms or is otherwise harmful to the Service or other users. Sections 4, 7, and 9 through 15 shall survive any termination of these Terms. Nothing in these Terms limits any remedy available to us at law or in equity, including injunctive relief.",
      "",
      "## 13. Governing Law and Dispute Resolution",
      "These Terms are governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law principles. You agree that any dispute arising out of or relating to these Terms or the Service shall be resolved exclusively in the state or federal courts located in [Jurisdiction], and you consent to the personal jurisdiction of such courts.",
      "",
      "## 14. Changes to These Terms",
      "We reserve the right to modify these Terms at any time. Changes take effect upon posting of the revised Terms, as indicated by the \"Last updated\" date above. Your continued use of the Service after any change constitutes your acceptance of the revised Terms.",
      "",
      "## 15. General Provisions",
      "- Severability: if any provision of these Terms is held invalid or unenforceable, the remaining provisions shall remain in full force and effect.",
      "- Waiver: our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.",
      "- Assignment: you may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.",
      "- Entire agreement: these Terms constitute the entire agreement between you and us regarding the Service and supersede all prior agreements and understandings.",
      "",
      "## 16. Contact",
      "Questions about these Terms may be directed to [Contact Email].",
      "",
      "See also: [[Main Page]]."
    ].join("\n"),
    img: null, cats: ["Legal"]
  }
};
const isLocked = t => has(LOCKED, t);

const $ = id => document.getElementById(id);

function cleanCats(arr){
  const out = [];
  (Array.isArray(arr) ? arr : []).forEach(c => {
    if(typeof c !== 'string') return;
    c = c.trim();
    if(c && !out.includes(c)) out.push(c);
  });
  return out;
}

function normalizePage(v){
  if(!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return {
    summary: typeof v.summary === 'string' ? v.summary : '',
    body: typeof v.body === 'string' ? v.body : '',
    img: (typeof v.img === 'string' && v.img.startsWith('data:image/')) ? v.img : null,
    cats: cleanCats(v.cats)
  };
}

function normalizeAll(obj){
  const out = {};
  if(!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  for(const [t, v] of Object.entries(obj)){
    const title = t.trim();
    const n = normalizePage(v);
    if(title && title !== '__proto__' && n) out[title] = n;
  }
  return out;
}

function withLocked(out){
  Object.assign(out, normalizeAll(LOCKED));
  return out;
}
function loadPages(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    if(raw){
      const out = normalizeAll(JSON.parse(raw));
      if(Object.keys(out).length) return withLocked(out);
    }
  }catch(e){}
  return withLocked(normalizeAll(seedPages));
}
function savePages(){
  try{
    const out = {};
    Object.keys(pages).forEach(t => { if(!isLocked(t)) out[t] = pages[t]; });
    localStorage.setItem(STORE_KEY, JSON.stringify(out));
    return true;
  }
  catch(e){ return false; }
}

let pages = loadPages();

function escapeHtml(t){
  return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---------- categories ---------- */
function catMap(){
  const m = new Map();
  Object.keys(pages).forEach(t => pages[t].cats.forEach(c => {
    if(!m.has(c)) m.set(c, []);
    m.get(c).push(t);
  }));
  return m;
}
function catLink(c){
  return `<a href="#" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</a>`;
}

/* ---------- linking ---------- */
function bindLinks(root){
  root.querySelectorAll('a[data-title]').forEach(a => {
    a.onclick = e => { e.preventDefault(); openPage(a.dataset.title); };
  });
  root.querySelectorAll('a[data-cat]').forEach(a => {
    a.onclick = e => { e.preventDefault(); openCategory(a.dataset.cat); };
  });
}

function renderSidebar(){
  const bar = $('sidebar');
  const cats = catMap();
  bar.innerHTML = '<h3>Articles</h3>' +
    Object.keys(pages).sort().map(t =>
      `<a href="#" data-title="${escapeHtml(t)}">${escapeHtml(t)}${isLocked(t) ? ' 🔒' : ''}</a>`).join('') +
    (cats.size ? '<h3>Categories</h3>' +
      [...cats.keys()].sort().map(c => catLink(c)).join('') : '');
  bindLinks(bar);
}
$('homeLink').onclick = e => { e.preventDefault(); openPage('Main Page'); };

/* ---------- markdown ---------- */
function renderMarkdown(text){
  let html = escapeHtml(text);
  html = html.replace(/^### (.*)$/gm, '<h4>$1</h4>');
  html = html.replace(/^## (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^# (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\[\[([^\]]+)\]\]/g, (m, p) => {
    const raw = p.replace(/&quot;/g,'"').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&');
    const missing = has(pages, raw) ? '' : ' style="color:#c00"';
    return `<a href="#" data-title="${p}"${missing}>${p}</a>`;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) =>
    `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`);
  html = html.replace(/(^|\n)((?:- .*(?:\n|$))+)/g, (m, lead, block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
    return `${lead}<ul>${items}</ul>`;
  });
  return html.split(/\n\n+/).map(b =>
    /^<h[34]>|^<ul>/.test(b.trim()) ? b : `<p>${b.replace(/\n/g, '<br>')}</p>`).join('\n');
}

function infobox(title, p){
  if(!p.img && !p.summary) return '';
  return `<aside class="infobox"><div class="ib-title">${escapeHtml(title)}</div>` +
    (p.img ? `<img src="${escapeHtml(p.img)}" alt="${escapeHtml(title)}">` : '') +
    (p.summary ? `<p>${escapeHtml(p.summary)}</p>` : '') + `</aside>`;
}

/* ---------- article views ---------- */
function openPage(title){
  const el = $('content');
  if(!has(pages, title)){
    el.innerHTML = `<h2>${escapeHtml(title)}</h2><p class="muted">There is no article with this title yet.</p><button id="createBtn">Create article</button>`;
    $('createBtn').onclick = () => createPage(title);
    return;
  }
  const p = pages[title];
  const locked = isLocked(title);
  el.innerHTML = `
    <h2>${escapeHtml(title)}${locked ? ' 🔒' : ''}</h2>
    <div class="toolbar">
      ${locked ? '<span class="muted">🔒 This article is locked and cannot be edited or deleted.</span>' : `
      <button id="editBtn">Edit</button>
      <button id="delBtn">Delete</button>
      <label class="muted">📷 <input type="file" id="imgInput" accept="image/*"></label>
      ${p.img ? '<button id="rmImgBtn">Remove image</button>' : ''}`}
    </div>
    ${infobox(title, p)}
    <div id="body">${renderMarkdown(p.body)}</div>
    ${p.cats.length ? `<div class="cats">Categories: ${p.cats.map(catLink).join(' | ')}</div>` : ''}`;
  bindLinks(el);
  window.scrollTo(0, 0);
  if(locked) return;
  $('editBtn').onclick = () => editPage(title);
  $('imgInput').onchange = e => handleImage(e, title);
  if(p.img) $('rmImgBtn').onclick = () => { p.img = null; savePages(); openPage(title); };
  $('delBtn').onclick = function(){
    if(title === 'Main Page'){ this.textContent = "Main Page can't be deleted"; return; }
    if(!this.dataset.armed){ this.dataset.armed = 1; this.textContent = 'Click again to confirm'; return; }
    delete pages[title]; savePages(); renderSidebar(); openPage('Main Page');
  };
}

function createPage(title){
  if(isLocked(title)) return openPage(title);
  if(!has(pages, title)){
    pages[title] = {summary:'', body:'', img:null, cats:[]};
    savePages(); renderSidebar();
  }
  editPage(title);
}

function editPage(title){
  if(isLocked(title)) return openPage(title);
  const p = pages[title];
  $('content').innerHTML = `
    <h2>Editing: ${escapeHtml(title)}</h2>
    <label class="lbl" for="editSummary">Summary <span class="muted">(shown in the infobox)</span></label>
    <textarea id="editSummary"></textarea>
    <label class="lbl" for="editBody">Article</label>
    <textarea id="editBody"></textarea>
    <label class="lbl" for="editCats">Categories <span class="muted">(comma-separated)</span></label>
    <input type="text" id="editCats" style="width:100%;margin-bottom:12px" placeholder="History, Science">
    <div class="toolbar"><button id="saveBtn">Save</button><button id="cancelBtn">Cancel</button></div>
    <p class="muted">Markdown: **bold**, *italic*, # Heading, [link](https://...), [[Internal Page]], - bullet</p>`;
  $('editSummary').value = p.summary;
  $('editBody').value = p.body;
  $('editCats').value = p.cats.join(', ');
  $('saveBtn').onclick = () => {
    p.summary = $('editSummary').value.trim();
    p.body = $('editBody').value;
    p.cats = cleanCats($('editCats').value.split(','));
    savePages(); renderSidebar(); openPage(title);
  };
  $('cancelBtn').onclick = () => openPage(title);
}

function handleImage(e, title){
  if(isLocked(title)) return;
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      pages[title].img = c.toDataURL('image/jpeg', 0.85);
      savePages(); openPage(title);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

/* ---------- category views ---------- */
function openCategory(name){
  const list = catMap().get(name) || [];
  $('content').innerHTML = `
    <h2>Category: ${escapeHtml(name)}</h2>
    ${list.length
      ? `<p class="muted">${list.length} article${list.length === 1 ? '' : 's'} in this category.</p>
         <ul class="list">${list.slice().sort().map(t => `<li><a href="#" data-title="${escapeHtml(t)}">${escapeHtml(t)}</a></li>`).join('')}</ul>`
      : '<p class="muted">No articles in this category.</p>'}`;
  bindLinks($('content'));
  window.scrollTo(0, 0);
}

function openCategories(){
  const m = catMap();
  $('content').innerHTML = `
    <h2>Categories</h2>
    ${m.size
      ? `<ul class="list">${[...m.keys()].sort().map(c => `<li>${catLink(c)} <span class="muted">(${m.get(c).length})</span></li>`).join('')}</ul>`
      : '<p class="muted">No categories yet. Add some when editing an article.</p>'}`;
  bindLinks($('content'));
  window.scrollTo(0, 0);
}

/* ---------- import / export ---------- */
function exportJson(){
  const out = {};
  Object.keys(pages).forEach(t => { if(!isLocked(t)) out[t] = pages[t]; });
  return JSON.stringify({format: 'wiki-archive', version: 1, pages: out}, null, 2);
}

function parseImport(text){
  let data = JSON.parse(text);
  if(data && typeof data === 'object' && data.pages && typeof data.pages === 'object') data = data.pages;
  if(!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Expected a JSON object of articles.');
  const incoming = normalizeAll(data);
  Object.keys(incoming).forEach(t => { if(isLocked(t)) delete incoming[t]; });
  const total = Object.keys(data).length;
  return {incoming, skipped: total - Object.keys(incoming).length};
}

function showExport(){
  $('content').innerHTML = `
    <h2>Export</h2>
    <p class="muted">Every article as JSON. Download it or copy it to back up or move to another browser.</p>
    <textarea id="ioBox" spellcheck="false" readonly></textarea>
    <div class="toolbar" style="border:0">
      <button id="dlBtn">Download .json</button>
      <button id="copyBtn">Copy</button>
    </div>
    <p id="ioMsg" class="muted"></p>`;
  const box = $('ioBox'), msg = $('ioMsg');
  box.value = exportJson();
  msg.textContent = `${Object.keys(JSON.parse(box.value).pages).length} articles ready to export.`;
  $('dlBtn').onclick = () => {
    try{
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([box.value], {type: 'application/json'}));
      a.download = 'wiki-archive.json';
      document.body.appendChild(a); a.click(); a.remove();
      msg.textContent = 'Download started. If nothing happened, copy the JSON from the box instead.';
    }catch(e){
      msg.textContent = 'Download is not available here. Copy the JSON from the box instead.';
    }
  };
  $('copyBtn').onclick = async () => {
    try{ await navigator.clipboard.writeText(box.value); msg.textContent = 'Copied to clipboard.'; }
    catch(e){ box.select(); msg.textContent = 'Selected. Copy it with your keyboard or share menu.'; }
  };
  window.scrollTo(0, 0);
}

function showImport(){
  $('content').innerHTML = `
    <h2>Import</h2>
    <p class="muted">Load a .json file or paste JSON below, then click Import. Articles with the same title are overwritten; everything else is kept.</p>
    <textarea id="ioBox" spellcheck="false" placeholder="Paste JSON here..."></textarea>
    <div class="toolbar" style="border:0">
      <label class="muted">📁 <input type="file" id="ioFile" accept=".json,application/json"></label>
      <button id="importBtn">Import</button>
    </div>
    <p id="ioMsg" class="muted"></p>`;
  const box = $('ioBox'), msg = $('ioMsg');
  let pending = null;

  $('ioFile').onchange = e => {
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = () => { box.value = r.result; pending = null; msg.textContent = `Loaded ${f.name}. Click Import to apply.`; };
    r.readAsText(f);
  };
  $('importBtn').onclick = () => {
    const text = box.value.trim();
    if(!text){ msg.textContent = 'Nothing to import. Load a file or paste JSON first.'; return; }
    try{
      if(pending && pending.text === text){
        Object.assign(pages, pending.incoming);
        const ok = savePages();
        renderSidebar();
        msg.textContent = `Imported ${Object.keys(pending.incoming).length} articles.` +
          (ok ? '' : ' Warning: browser storage is full, so these may not persist after a reload.');
        pending = null;
        return;
      }
      const {incoming, skipped} = parseImport(text);
      const n = Object.keys(incoming).length;
      if(!n){ msg.textContent = 'No valid articles found in that JSON.'; return; }
      const over = Object.keys(incoming).filter(t => has(pages, t)).length;
      pending = {text, incoming};
      msg.textContent = `Found ${n} articles (${over} will overwrite existing)` +
        (skipped ? `, ${skipped} invalid entries skipped` : '') + '. Click Import again to confirm.';
    }catch(err){
      pending = null;
      msg.textContent = 'Could not read that JSON: ' + err.message;
    }
  };
  window.scrollTo(0, 0);
}

/* ---------- header ---------- */
function showNewForm(){
  $('content').innerHTML = `
    <h2>New article</h2>
    <label class="lbl" for="newTitle">Title</label>
    <div class="toolbar" style="border:0">
      <input type="text" id="newTitle" placeholder="Article title">
      <button id="createNewBtn">Create</button>
    </div>`;
  const go = () => { const t = $('newTitle').value.trim(); if(t && t !== '__proto__') createPage(t); };
  $('createNewBtn').onclick = go;
  $('newTitle').addEventListener('keydown', e => { if(e.key === 'Enter') go(); });
  $('newTitle').focus();
  window.scrollTo(0, 0);
}

$('goBtn').onclick = () => { const t = $('searchBox').value.trim(); if(t) openPage(t); };
$('searchBox').addEventListener('keydown', e => { if(e.key === 'Enter') $('goBtn').click(); });
$('newBtn').onclick = showNewForm;
$('catsBtn').onclick = openCategories;
$('importBtn').onclick = showImport;
$('exportBtn').onclick = showExport;

renderSidebar();
openPage('Main Page');
