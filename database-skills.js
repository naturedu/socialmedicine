(async()=>{
'use strict';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
const responses=await Promise.all([fetch('data/database-skills.json'),fetch('data/database-sources.json')]);
if(responses.some(r=>!r.ok))throw new Error('读取失败');
const [rows,sources]=await Promise.all(responses.map(r=>r.json())),sourceMap=new Map(sources.map(s=>[s.id,s]));
const prepared=rows.map(d=>({...d,search:JSON.stringify(d).toLowerCase(),local:!d.local_status.startsWith('官方')}));
$('#dbFamily').innerHTML+=[...new Set(rows.map(d=>d.family))].map(f=>`<option>${esc(f)}</option>`).join('');
const list=a=>`<ul>${a.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
function render(){
 const q=$('#dbSearch').value.trim().toLowerCase(),family=$('#dbFamily').value,evidence=$('#dbEvidence').value;
 const filtered=prepared.filter(d=>(!q||d.search.includes(q))&&(!family||d.family===family)&&(!evidence||d.local===(evidence==='local')));
 $('#dbCount').textContent=`找到 ${filtered.length} / ${rows.length} 个数据库与扩展 · 13份专属/组合Skills · 元数据与模型执行分开核验`;
 $('#dbResults').innerHTML=filtered.map(d=>`<details class="db-card" ${filtered.length===1?'open':''} id="db-${esc(d.id)}"><summary><span class="meta">${esc(d.region)} / ${esc(d.family)}</span><h2>${esc(d.name)}</h2><span class="introline">${esc(d.overview)}</span><span class="status">${esc(d.local_status)}</span><span class="openhint">展开模块、具体步骤、选题与核对点 ↓</span></summary><div class="db-body"><div class="actions"><a href="guides/${esc(d.guide)}.html">📖 打开完整Skill与操作路线 ↗</a><a href="skills/${esc(d.guide)}.md" download>下载Skill</a></div><h3>文件与模块</h3><div class="chips">${d.modules.map(m=>`<span>${esc(m)}</span>`).join('')}</div><h3>具体怎么做</h3><ol>${d.workflow.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><h3>可以先评估的研究问题</h3>${list(d.questions)}<h3>容易走错的地方</h3><div class="boundaries">${list(d.pitfalls)}</div><h3>官方文档与产品入口</h3><ul>${d.source_ids.map(id=>{const s=sourceMap.get(id);return s?`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)} ↗</a>：${esc(s.supports)}</li>`:''}).join('')}</ul><p class="meta">${esc(d.scope)} 核对日期：${esc(d.checked)}。</p></div></details>`).join('')||'<p>没有匹配记录，可清空关键词或更换类别。</p>';
}
for(const id of ['dbSearch','dbFamily','dbEvidence'])$('#'+id).addEventListener('input',render);
render();
}catch(error){$('#dbCount').textContent='数据库卡片暂未载入，请从网站或本地HTTP预览打开后重试。';}
})();
