import {filterProjects,frequencies,cooccurrences,csvText} from './nssfc-analysis-core.mjs';
const $=id=>document.getElementById(id),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>n.toLocaleString('zh-CN'),percent=n=>Number(n).toFixed(3);
const link=(url,label)=>/^https?:\/\//.test(url||'')?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`:'';
let data,filtered=[],page=1,orgFilter='',view='overview';const pageSize=25;
const controls=['query','year','kind','scope','topic'];
const state=()=>Object.fromEntries([...controls.map(k=>[k,$(k).value]),['organization',orgFilter]]);
function setView(next,scroll=false){
 if(!['overview','projects','hotspots','coverage'].includes(next))next='overview';view=next;
 for(const b of document.querySelectorAll('[data-view]')){const active=b.dataset.view===next;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;$(b.dataset.view).hidden=!active;}
 if(scroll)document.querySelector('.tabs').scrollIntoView({behavior:'smooth',block:'start'});
 history.replaceState(null,'','#'+next);
}
function bars(host,items,key){
 const max=items[0]?.count||1;
 $(host).innerHTML=items.length?items.map(x=>`<button class="bar" type="button" data-${key}="${esc(x.name)}" aria-label="查看${esc(x.name)}的 ${x.count} 个项目"><span class="bar-label">${esc(x.name)}</span><span class="bar-track"><span class="bar-fill" style="display:block;width:${100*x.count/max}%"></span></span><span class="bar-number">${number(x.count)}</span></button>`).join(''):'<p class="empty">当前筛选没有项目。</p>';
}
function projectList(){
 const max=Math.max(1,Math.ceil(filtered.length/pageSize));page=Math.min(page,max);
 $('projectRows').innerHTML=filtered.slice((page-1)*pageSize,page*pageSize).map(r=>`<article class="project"><div class="project-year">${r.date}<small>${esc(r.project_type)}</small></div><div><h3>${esc(r.title)}</h3><p class="project-meta">${esc(r.organization)} · ${esc(r.project_code||'原名单未列批准号')} ${r.category?' · 官方学科：'+esc(r.category):''}</p><div class="tags">${r.topics.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div><div class="source-links">${link(r.notice,'官网公告 / 存档')}${link(r.source,'名单附件 / 定位')}</div><details><summary>核对来源与公开元数据</summary><p>${esc(r.locator)} · ${esc(r.source_id)} · ${esc(r.source_level)}</p><p>当年状态：正式立项；公开负责人 / 首席专家：${esc(r.principal||'原名单未列')}。</p>${r.official_notice&&r.official_notice!==r.notice?`<p>${link(r.official_notice,'主管部门原公告（旧址可能失效）')}</p>`:''}<p>受控关键词：${esc(r.keywords.join('、')||'无单独受控词命中')}。主题由本站依题名标注，不是官方分类。</p></details></div></article>`).join('')||'<p class="empty">未找到符合条件的正式项目。可缩短关键词或重置筛选。</p>';
 $('pageStatus').textContent=`第 ${page} / ${max} 页 · ${number(filtered.length)} 项`;$('prev').disabled=page<=1;$('next').disabled=page>=max;
}
function update(){
 filtered=filterProjects(data.rows,state());page=1;
 const orgs=frequencies(filtered,'organization_normalized'),themes=frequencies(filtered,'topics'),words=frequencies(filtered,'keywords');
 const batches=new Set(filtered.map(r=>r.source_id+'|'+r.date));
 $('metrics').innerHTML=[[number(filtered.length),'当前正式立项项目'],[number(filtered.filter(r=>r.health_core).length),'其中卫生健康题名'],[number(orgs.length),'机构名称 · 保留原层级'],[number(batches.size),'涉及年度批次']].map(([n,s])=>`<div class="metric"><strong>${n}</strong><span>${s}</span></div>`).join('');
 const st=state(),yearCoverage=data.coverage.coverage.find(c=>String(c.year)===st.year),program=['重点项目','一般项目','青年项目'].includes(st.kind)?'年度项目':st.kind;
 const gap=yearCoverage&&(yearCoverage.annualTotal===null||program&&yearCoverage.missing.includes(program));
 $('filterStatus').textContent=`当前 ${number(filtered.length)} 项 / 全库 ${number(data.rows.length)} 项。${orgFilter?'限定机构：'+orgFilter+'；点击重置恢复。':'点击图中机构或主题可进一步筛选。'} 主题允许交叉命中。${gap?' 本年部分系列尚未取得完整正式名单；没有检索结果不等于零立项，请查看来源覆盖。':''}`;
 bars('orgBars',orgs.slice(0,15),'org');bars('themeBars',themes.slice(0,15),'topic');
 $('keywords').innerHTML=words.slice(0,44).map(x=>`<button type="button" class="keyword" data-word="${esc(x.name)}">${esc(x.name)}<small>${number(x.count)}</small></button>`).join('')||'<p>当前筛选没有受控关键词。</p>';
 const pairs=cooccurrences(filtered,filtered.length>100?5:2);
 $('cooccurrence').innerHTML=pairs.slice(0,14).map(x=>`<div class="pair"><span>${esc(x.a)} × ${esc(x.b)}</span><span>${number(x.count)} 项 · J ${percent(x.jaccard)}</span></div>`).join('')||'<p class="empty">当前筛选下，尚无达到展示频次的关键词对。</p>';
 const biggest=themes[0],pair=pairs[0],digital=pairs.find(x=>[x.a,x.b].includes('数字化'));
 $('synthesis').innerHTML=[biggest?`<span>题名中最常命中的主题</span><strong>${esc(biggest.name)}</strong><p>${number(biggest.count)} 个项目。主题频次允许交叉，不等同于独立研究方向总数。</p>`:'没有可汇总的主题。',pair?`<span>高频关键词交汇</span><strong>${esc(pair.a)} × ${esc(pair.b)}</strong><p>${number(pair.count)} 个同题共现项目。可回到明细比较对象、场景与研究问题。</p>`:'当前筛选没有达到阈值的关键词对。',digital?`<span>数字化相关交汇</span><strong>${esc(digital.a)} × ${esc(digital.b)}</strong><p>${number(digital.count)} 个项目。题名关联提示可继续阅读的交叉问题，不能据此判断研究成效。</p>`:'数字化相关共现尚未达到展示频次。'].map(x=>`<div class="insight">${x}</div>`).join('');
 projectList();
}
function renderFixed(){
 const {analysis:a,coverage:c,sources:s}=data;
 $('cohortNote').textContent=`2018—2020：${number(a.cohort.beforeTotal)} 项全学科立项；2023—2025：${number(a.cohort.afterTotal)} 项。两期均只含重点、一般、青年项目。`;
 $('changeRows').innerHTML=a.changes.map(x=>`<tr><td>${esc(x.topic)}</td><td>${x.beforePer1000.toFixed(2)} <small>（${x.before} 项）</small></td><td>${x.afterPer1000.toFixed(2)} <small>（${x.after} 项）</small></td><td class="${x.differencePer1000>=0?'up':'down'}">${x.differencePer1000>=0?'+':''}${x.differencePer1000.toFixed(2)}</td></tr>`).join('');
 const topicNames=a.topics.filter(x=>!x.name.includes('综合')).map(x=>x.name),allRates=a.annual.flatMap(x=>Object.values(x.topics).map(n=>x.nationalTotal?1000*n/x.nationalTotal:0)),max=Math.max(...allRates,1);
 $('heatmap').innerHTML=`<table class="heatmap"><caption>列为年份，行为本站题名主题；单元格悬停可查看全学科分母和每千项频次。</caption><thead><tr><th>主题 / 年份</th>${a.annual.map(x=>`<th>${x.year}</th>`).join('')}</tr></thead><tbody>${topicNames.map(t=>`<tr><th scope="row">${esc(t)}</th>${a.annual.map(x=>{const n=x.topics[t]||0,rate=x.nationalTotal?1000*n/x.nationalTotal:null;return rate===null?'<td title="未取得可核实的正式年度名单">—</td>':`<td style="background:rgba(103,145,89,${.06+.6*rate/max})" title="${x.year}：${n} 项 / 全学科 ${x.nationalTotal} 项；每千项 ${rate.toFixed(2)}">${n}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`;
 const cell=(row,program)=>{const found=row.batches.filter(x=>x.program===program);return found.length?number(found.reduce((n,x)=>n+x.parsedRows,0)):'—';};
 $('coverageRows').innerHTML=c.coverage.map(x=>`<tr><th scope="row">${x.year}</th><td>${x.annualTotal?number(x.annualTotal):'—'}</td><td>${cell(x,'西部项目')}</td><td>${cell(x,'重大项目')}</td><td>${cell(x,'后期资助')}</td><td>${cell(x,'重大专项')}</td><td>${number(x.selectedRows)}</td></tr>`).join('');
 $('limitations').innerHTML=c.limitations.map(x=>`<p>${esc(x)}</p>`).join('');
 $('sourceLedger').innerHTML=s.map(x=>{const bs=c.batches.filter(b=>b.source_id===x.key);return `<details class="source-item"><summary>${esc(bs.map(b=>b.year).join('、'))} · ${esc(x.program)}</summary><p>${esc(x.source_level)} · ${number(bs.reduce((n,b)=>n+b.parsedRows,0))} 条全学科元数据 · ${number(bs.reduce((n,b)=>n+b.selectedRows,0))} 项领域命中</p><p>${link(x.notice,'官网公告 / 存档')}${link(x.url,'名单附件')}${x.official_notice&&x.official_notice!==x.notice?link(x.official_notice,'主管部门原公告'):''}</p>${x.official_notice_status?`<p>${esc(x.official_notice_status)}</p>`:''}<p>${bs.map(b=>`${b.year} 年：解析 ${number(b.parsedRows)} 条，题名略 ${b.redactedRows} 条，领域 ${b.selectedRows} 项`).join('<br>')}</p><p class="hash">${esc(x.key)}<br>SHA-256 ${esc(x.sha256)}</p></details>`;}).join('');
}
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>setView(button.dataset.view));
document.querySelector('.tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=[...document.querySelectorAll('[data-view]')],current=tabs.findIndex(x=>x.getAttribute('aria-selected')==='true'),i=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[i].focus();setView(tabs[i].dataset.view);});
$('coverageJump').addEventListener('click',e=>{e.preventDefault();setView('coverage',true);});
let timer;for(const id of controls)$(id).addEventListener(id==='query'?'input':'change',()=>{clearTimeout(timer);timer=setTimeout(update,id==='query'?160:0);});
$('reset').onclick=()=>{for(const id of controls)$(id).value='';orgFilter='';update();};
$('orgBars').onclick=e=>{const b=e.target.closest('[data-org]');if(b){orgFilter=b.dataset.org;update();setView('projects',true);}};
$('themeBars').onclick=e=>{const b=e.target.closest('[data-topic]');if(b){$('topic').value=b.dataset.topic;update();setView('projects',true);}};
$('keywords').onclick=e=>{const b=e.target.closest('[data-word]');if(b){$('query').value=b.dataset.word;update();setView('projects',true);}};
$('prev').onclick=()=>{page--;projectList();};$('next').onclick=()=>{page++;projectList();};
$('exportFiltered').onclick=()=>{const current=filterProjects(data.rows,state()),url=URL.createObjectURL(new Blob([csvText(current)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='国社科_正式立项_筛选结果.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
try{
 const files=['nssf-projects','nssfc-analysis','nssfc-coverage','nssfc-source-files'];
 const [rows,analysis,coverage,sources]=await Promise.all(files.map(async name=>{const r=await fetch(`data/${name}.json`);if(!r.ok)throw new Error(name);return r.json();}));
 data={rows,analysis,coverage,sources};
 $('year').insertAdjacentHTML('beforeend',Array.from({length:11},(_,i)=>2026-i).map(y=>`<option>${y}</option>`).join(''));
 $('topic').insertAdjacentHTML('beforeend',analysis.topics.map(x=>`<option>${esc(x.name)}</option>`).join(''));
 renderFixed();update();setView(location.hash.slice(1)||'overview');
}catch(error){$('metrics').innerHTML='<p role="alert">数据暂未载入，请刷新。可直接下载上方 CSV 和分析报告。</p>';for(const id of controls)$(id).disabled=true;for(const id of ['reset','exportFiltered','prev','next'])$(id).disabled=true;}
