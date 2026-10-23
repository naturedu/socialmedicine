(async()=>{
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try{
 const response=await fetch('data/visual-skills.json');
 if(!response.ok)throw new Error('HTTP '+response.status);
 const rows=await response.json();
 const list=(items,ordered=false)=>`<${ordered?'ol':'ul'}>${items.map(x=>`<li>${esc(x)}</li>`).join('')}</${ordered?'ol':'ul'}>`;
 function render(){
  const query=$('#visualSearch').value.trim().toLowerCase(),group=$('#visualGroup').value;
  const found=rows.filter(r=>(!group||r.group===group)&&(!query||JSON.stringify(r).toLowerCase().includes(query)));
  $('#visualCount').textContent=`找到 ${found.length} / ${rows.length} 份技能 · 展开查看材料、步骤与任务书`;
  $('#visualResults').innerHTML=found.map(r=>`<details class="visual-card" id="skill-${esc(r.id)}"${found.length===1?' open':''}><summary><span class="card-kind">${esc(r.icon)} ${esc(r.group)}</span><h2>${esc(r.name)}</h2><p>${esc(r.description)}</p><span class="expand">查看怎么做、交付什么 ↓</span></summary><div class="visual-body"><h3>先准备这些材料</h3>${list(r.inputs)}<h3>工作路径</h3>${list(r.workflow,true)}<h3>交付给你</h3>${list(r.outputs)}<h3>可复制的任务书</h3><pre>${esc(r.prompt)}</pre><div class="actions"><button type="button" class="button secondary" data-copy-visual="${esc(r.id)}">复制任务书</button><a class="button secondary" href="guides/${esc(r.guide)}.html">阅读完整 Skill ↗</a><a href="skills/${esc(r.guide)}.md" download>下载 Markdown ↓</a></div><p class="copy-status" role="status"></p></div></details>`).join('')||'<p class="empty-visual">暂时没有匹配。试试“技术路线”“论文”“DID”，或清空筛选。</p>';
 }
 $('#visualSearch').addEventListener('input',render);$('#visualGroup').addEventListener('change',render);
 $('#clearVisual').addEventListener('click',()=>{$('#visualSearch').value='';$('#visualGroup').value='';render();$('#visualSearch').focus()});
 $('#visualResults').addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy-visual]');if(!button)return;
  const row=rows.find(r=>r.id===button.dataset.copyVisual),status=button.closest('.visual-body').querySelector('.copy-status');
  try{await navigator.clipboard.writeText(row.prompt);status.textContent='已复制，可粘贴到你的 AI 并附上材料。'}
  catch{status.textContent='当前浏览器无法自动复制，请选中上方任务书手动复制。'}
 });
 render();
}catch(error){$('#visualCount').textContent='技能目录暂未载入，请通过网站或本地 HTTP 服务打开后重试。'}
})();
