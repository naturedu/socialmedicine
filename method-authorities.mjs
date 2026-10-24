let pending;
export function loadAuthorities() {
  return pending ||= fetch(new URL('./data/method-authorities.json', import.meta.url))
    .then(r => { if (!r.ok) throw new Error('Sources unavailable'); return r.json(); });
}
export function sourceRows(data, id) {
  return [...new Set(data.methods[id] || data.skills[id] || [])].map(key => data.sources[key]).filter(Boolean);
}
const node = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
export function attachAuthorities(card, id, data) {
  if (card.querySelector('.authority-links')) return;
  const rows = sourceRows(data, id);
  if (!rows.length) return;
  const box = node('div', null, 'authority-links');
  box.style.cssText = 'border-top:1px solid #d7e1d3;padding-top:12px;margin-top:14px;font-size:13px;line-height:1.7;overflow-wrap:anywhere';
  box.append(node('strong', '原始方法与官方来源'));
  for (const row of rows) {
    const p = node('p'); p.style.margin = '7px 0';
    const a = node('a', row.title + ' ↗'); a.href = row.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    p.append(a, node('small', ' · ' + row.type)); box.append(p);
  }
  const note = node('small', '报告指南、原始方法与软件文档用途不同。');
  const more = node('a', ' 核对状态'); more.href = 'method-sources.html#' + encodeURIComponent(id);
  box.append(note, more); card.append(box);
  const heading = card.querySelector('h3,h2');
  if (heading && !heading.querySelector('a')) {
    const a = node('a', heading.textContent); a.href = rows[0].url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.title = '打开：' + rows[0].title; heading.replaceChildren(a);
  }
}

async function renderDirectory() {
  const root = document.getElementById('authorityDirectory'); if (!root) return;
  const status = document.getElementById('authorityStatus');
  try {
    const [data, methods] = await Promise.all([loadAuthorities(), fetch('./data/methods.json').then(r => {if(!r.ok)throw new Error();return r.json();})]);
    const search = document.getElementById('authorityQuery');
    function render() {
      const q = search.value.trim().toLowerCase(); root.replaceChildren(); let count = 0;
      for (const method of methods) {
        const sources = sourceRows(data, method.id);
        if (q && !(method.id+' '+method.name+' '+sources.map(s=>s.title+' '+s.type).join(' ')).toLowerCase().includes(q)) continue;
        count++; const card = node('article', null, 'entry'); card.id = method.id;
        card.append(node('span', method.id, 'tag'), node('h2', method.name));
        for (const s of sources) {
          const p = node('p'), a = node('a', s.title + ' ↗'); a.href=s.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);
          card.append(p, node('p', s.type + ' · ' + s.scope, 'tiny'), node('p', `${s.verification} · ${s.checkedDate}。${s.verificationScope || ''}`, 'tiny'));
        }
        const local = node('a', '阅读本站方法说明与代码');local.href='guides/methods-89.html#method-'+method.id.toLowerCase();card.append(local);root.append(card);
      }
      status.textContent=`${count} / ${methods.length} 个方法；来源按用途选择，不作唯一权威排名。`;
    }
    search.addEventListener('input',render);render();
    if(location.hash)document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  } catch {status.textContent='来源目录暂时无法读取，请稍后刷新；本站方法说明仍可阅读。';}
}
if(typeof document!=='undefined')void renderDirectory();
