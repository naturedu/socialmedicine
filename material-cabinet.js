(async()=>{
'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
const res=await fetch('data/material-index.json');if(!res.ok)throw new Error('索引读取失败');const data=await res.json();let page=1;const size=30;
$('#collections').innerHTML=data.collections.map(c=>`<button data-collection="${esc(c.id)}">${esc(c.title)}<b>${c.count}</b><small>${esc(c.kind)} · 点此查看</small></button>`).join('');
$('#kind').innerHTML+=[...new Set(data.collections.map(c=>c.kind))].map(k=>`<option>${esc(k)}</option>`).join('');
$('#collection').innerHTML+=data.collections.map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('');
const prepared=data.records.map(r=>({...r,search:JSON.stringify(r).toLowerCase()}));
function render(){const q=$('#query').value.trim().toLowerCase(),kind=$('#kind').value,col=$('#collection').value;
const rows=prepared.filter(r=>(!q||r.search.includes(q))&&(!kind||r.kind===kind)&&(!col||r.collection===col));const pages=Math.max(1,Math.ceil(rows.length/size));page=Math.min(page,pages);
$('#count').textContent=`找到 ${rows.length} / ${data.count} 条资料记录 · ${data.collections.length} 个目录 · 保留原始字段与来源`;
$('#results').innerHTML=rows.slice((page-1)*size,page*size).map(r=>`<article class="record"><span class="meta">${esc(r.kind)} / ${esc(r.collection_title)}</span><h3>${esc(r.title)}</h3><p>${esc(r.summary)}</p><div class="actions"><a href="${esc(r.url)}">打开所属栏目或阅读页 ↗</a><a href="${esc(r.source)}" target="_blank" rel="noopener">原始资料与字段 ↗</a></div><details><summary>展开完整记录、说明与核验状态</summary><pre>${esc(JSON.stringify(r.details,null,2))}</pre></details></article>`).join('')||'<p>没有匹配记录。可清空关键词或更换目录。</p>';
$('#page').textContent=`${page} / ${pages}`;$('#prev').disabled=page<=1;$('#next').disabled=page>=pages;}
for(const id of ['query','kind','collection'])$('#'+id).addEventListener('input',()=>{page=1;render()});
document.querySelectorAll('[data-collection]').forEach(btn=>btn.onclick=()=>{$('#query').value='';$('#kind').value='';$('#collection').value=btn.dataset.collection;page=1;render();$('#query').scrollIntoView({block:'center',behavior:'smooth'});});
$('#prev').onclick=()=>{page--;render();};$('#next').onclick=()=>{page++;render();};render();
}catch(err){$('#count').textContent='完整资料索引暂未载入，请通过网站或本地HTTP预览打开后重试。';}
})();
