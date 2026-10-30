import {searchPublicInfo} from './cdrip-catalogue.mjs';
const q=document.querySelector('#public-query'),results=document.querySelector('#public-results'),count=document.querySelector('#search-status');
function render(){
 const items=searchPublicInfo(q.value);results.replaceChildren();
 count.textContent=q.value.trim()?`找到 ${items.length} 项公开介绍。`:'可检索数据库简介、引用、地图与申请方式。';
 for(const item of items){const a=document.createElement('a');a.className='search-result';a.href=item.href;const h=document.createElement('h3');h.textContent=item.title+' ↗';const p=document.createElement('p');p.textContent=item.description;a.append(h,p);results.append(a);}
 if(!items.length){const p=document.createElement('p');p.className='empty';p.textContent='未找到匹配的公开介绍。试试“引用”“地图”或“杜思娴”。具体政策条目请申请数据库后检索。';results.append(p);}
}
q.addEventListener('input',render);
document.querySelector('#public-search').addEventListener('submit',e=>{e.preventDefault();render();results.scrollIntoView({behavior:'smooth',block:'nearest'});});
document.querySelectorAll('[data-query]').forEach(b=>b.addEventListener('click',()=>{q.value=b.dataset.query;render();q.focus();}));
document.querySelectorAll('[data-copy]').forEach(b=>b.addEventListener('click',async()=>{
 const el=document.getElementById(b.dataset.copy),status=document.getElementById('copy-status');
 try{await navigator.clipboard.writeText(el.textContent.trim());status.textContent='已复制，可粘贴到论文或文献管理器。';}
 catch{const selection=getSelection(),range=document.createRange();range.selectNodeContents(el);selection.removeAllRanges();selection.addRange(range);status.textContent='自动复制不可用，已选中文本，请手动复制。';}
}));
render();
