import {frequencies,cooccurrences} from './nssfc-analysis-core.mjs';
import {filterNsfc,nsfcCsv} from './nsfc-health-core.mjs';
const $=id=>document.getElementById(id),esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let rows=[],selected=[],stats,sources,organization='',page=1;const size=20;
function table(id,headers,body){$(id).innerHTML='<table><thead><tr>'+headers.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+body.map(r=>'<tr>'+r.map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';}
function bars(id,list,key){const max=list[0]?.count||1;$(id).innerHTML=list.map(x=>`<button class="bar" data-${key}="${esc(x.name)}"><span class="bar-label">${esc(x.name)}</span><span class="bar-track"><span class="bar-fill" style="display:block;width:${100*x.count/max}%"></span></span><span class="bar-number">${x.count}</span></button>`).join('')||'<p class="empty">当前筛选没有项目。</p>';}
function list(){
 const pages=Math.max(1,Math.ceil(selected.length/size));page=Math.min(page,pages);
 $('projectRows').innerHTML=selected.slice((page-1)*size,page*size).map(r=>`<article class="project"><div class="project-year">${esc(r.date)}<small>${esc(r.project_type)}</small></div><div><h3>${esc(r.title)}</h3><p class="project-meta">${esc(r.organization)} · ${esc(r.discipline)}</p><div class="tags">${r.topics.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><p class="project-meta">${esc(r.verification)}</p>${r.category_note?`<p class="project-meta category-note">${esc(r.category_note)}</p>`:''}<div class="source-links"><button class="text-button" data-copy="${esc(r.id)}">复制题名</button><a href="https://kd.nsfc.cn/" target="_blank" rel="noopener noreferrer">官网复核 ↗</a></div><details><summary>汇编来源</summary><p>${esc(r.source_refs.join('；'))}</p></details></div></article>`).join('')||'<p class="empty">未找到项目，请缩短关键词或重置筛选。</p>';
 $('pageStatus').textContent=`${page} / ${pages} 页 · ${selected.length} 项`;$('prev').disabled=page===1;$('next').disabled=page===pages;
}
function render(){
 selected=filterNsfc(rows,{query:$('query').value,year:$('year').value,topic:$('topic').value,economic:$('economic').value,organization});page=1;
 const orgs=frequencies(selected,'organization'),themes=frequencies(selected,'topics'),words=frequencies(selected,'keywords');
 $('metrics').innerHTML=[[selected.length,'当前相关项目'],[orgs.length,'原层级机构'],[new Set(selected.map(r=>r.date)).size,'有结果的年份'],[selected.filter(r=>r.economics_policy).length,'含经济 / 政策 / 治理词']].map(([n,s])=>`<div class="metric"><strong>${n.toLocaleString('zh-CN')}</strong><span>${s}</span></div>`).join('');
 $('filterStatus').textContent=`当前 ${selected.length} 项${organization?'；机构：'+organization:''}。全部为脱敏汇编记录；尚未逐项官方核验。`;
 bars('orgBars',orgs.slice(0,15),'org');bars('topicBars',themes,'topic');
 $('keywordList').innerHTML=words.slice(0,30).map(x=>`<button class="keyword" data-word="${esc(x.name)}">${esc(x.name)}<small>${x.count}</small></button>`).join('');
 $('pairList').innerHTML=cooccurrences(selected,2).slice(0,15).map(x=>`<div class="pair"><span>${esc(x.a)} × ${esc(x.b)}</span><span>${x.count} 项 · J=${x.jaccard.toFixed(3)}</span></div>`).join('')||'<p class="muted">当前筛选下没有至少共现2次的词对。</p>';
 const years=Array.from({length:16},(_,i)=>2010+i),topicNames=themes.map(x=>x.name);
 $('heatmap').innerHTML='<table class="heatmap"><thead><tr><th>题名主题</th>'+years.map(y=>'<th>'+y+'</th>').join('')+'</tr></thead><tbody>'+topicNames.map(t=>'<tr><th>'+esc(t)+'</th>'+years.map(y=>{const n=selected.filter(r=>+r.date===y&&r.topics.includes(t)).length;return `<td style="background:rgba(46,102,86,${Math.min(.45,n/100)})">${n}</td>`;}).join('')+'</tr>').join('')+'</tbody></table>';
 list();
}
function overview(){
 const leading=stats.topics.slice(0,3);$('insights').innerHTML=leading.map(x=>`<p><strong>${esc(x.name)}</strong>：全库 ${x.count} 项题名命中。</p>`).join('')+`<p>五份清单共 ${stats.inputRows.toLocaleString()} 条可用记录，合并 ${stats.duplicateRows} 条重复记录，排除 ${stats.conflictingRowsExcluded} 条冲突记录。筛入 ${stats.projects} 项。</p>`;
 table('changes',['主题','前期项数 / 分母','前期占比','后期项数 / 分母','后期占比','差值（百分点）'],stats.changes.map(x=>[x.topic,x.before+' / '+x.beforeDenominator,x.beforePercent+'%',x.after+' / '+x.afterDenominator,x.afterPercent+'%',(x.differencePoints>0?'+':'')+x.differencePoints]));
 table('coverageTable',['年份','去重汇编条目','健康相关条目','覆盖说明'],[['1991—2009','未提供','未提供','缺口不记零'],...stats.annual.filter(x=>x.year>=2010).map(x=>[x.year,x.compilationRecords,x.healthRecords,x.coverage])]);
 $('limitations').innerHTML=stats.limitations.map(x=>'<p>'+esc(x)+'</p>').join('');
 $('sourceList').innerHTML=sources.map(x=>`<details class="source-item"><summary>${esc(x.id)} · ${esc(x.filename)}</summary><p>${esc(x.provenance)}</p><p class="hash">SHA-256：${esc(x.sha256)}</p>${x.sheets.map(s=>`<p>${esc(s.name)}：可用 ${s.usableRows} 条${s.excludedUncertainFunder?'，资金来源不确定排除 '+s.excludedUncertainFunder+' 条':''}</p>`).join('')}${x.skippedSheets.map(s=>'<p>'+esc(s.name)+'：'+esc(s.reason)+'</p>').join('')}</details>`).join('');
}
for(const id of ['query','year','topic','economic'])$(id).addEventListener(id==='query'?'input':'change',render);
$('reset').addEventListener('click',()=>{for(const id of ['query','year','topic','economic'])$(id).value='';organization='';render();});
$('prev').addEventListener('click',()=>{page--;list();});$('next').addEventListener('click',()=>{page++;list();});
$('exportFiltered').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([nsfcCsv(selected)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='国自然经管健康_脱敏筛选.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-org],[data-topic],[data-word],[data-copy]');if(!b)return;if(b.dataset.org){organization=b.dataset.org;render();}if(b.dataset.topic){$('topic').value=b.dataset.topic;render();}if(b.dataset.word){$('query').value=b.dataset.word;render();}if(b.dataset.copy){try{await navigator.clipboard.writeText(rows.find(r=>r.id===b.dataset.copy).title);b.textContent='已复制';}catch{b.textContent='请选中题名复制';}}});
try{[rows,stats,sources]=await Promise.all(['nsfc-health-projects','nsfc-health-analysis','nsfc-health-sources'].map(async f=>{const r=await fetch('data/'+f+'.json');if(!r.ok)throw new Error(f);return r.json();}));
 for(const y of [...new Set(rows.map(r=>r.date))].sort().reverse())$('year').add(new Option(y,y));for(const x of stats.topics)$('topic').add(new Option(x.name,x.name));overview();render();
}catch{$('metrics').textContent='数据读取失败，请刷新页面或下载脱敏CSV。';}
