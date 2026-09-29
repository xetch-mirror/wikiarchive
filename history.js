// Revision history page. Anyone can read it; admins can revert.
window.showHistory = async function(title){
  const auth = window.wikiAuth;
  const el = document.getElementById('content');
  el.innerHTML = '<h2></h2><div class="toolbar"><button id="hBack">Back to article</button></div><div id="hList"><p class="muted">Loading…</p></div>';
  el.querySelector('h2').textContent = 'History: ' + title;
  document.getElementById('hBack').onclick = () => openPage(title);
  const list = document.getElementById('hList');

  const r = await auth.call('/history/' + encodeURIComponent(title), 'GET');
  if(!r.ok || !Array.isArray(r.data)){ list.textContent = 'Could not load history.'; return; }
  if(!r.data.length){ list.innerHTML = '<p class="muted">No saved versions yet.</p>'; return; }

  const admin = auth.user() && auth.user().admin;
  list.innerHTML = '';
  r.data.forEach(rev => {
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #ccc';
    const info = document.createElement('div');
    info.textContent = new Date(rev.ts * 1000).toLocaleString() + ' · ' + (rev.username || 'unknown') +
      ' · ' + rev.size + ' characters';
    row.appendChild(info);
    if(admin){
      const b = document.createElement('button');
      b.textContent = 'Revert to this version';
      b.onclick = async () => {
        if(!b.dataset.armed){ b.dataset.armed = 1; b.textContent = 'Click again to confirm'; return; }
        const rr = await auth.call('/revert', 'POST', {id: rev.id});
        if(!rr.ok){ b.textContent = rr.data.error || 'Revert failed'; return; }
        await loadRemote();
        openPage(title);
      };
      row.appendChild(b);
    }
    list.appendChild(row);
  });
};
