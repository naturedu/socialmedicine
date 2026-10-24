(function(){
'use strict';
const D=window.SM||{}, page=document.body.dataset.page, $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,text)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`;
const tags=(...v)=>v.filter(Boolean).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
const detail=(title,body)=>`<details><summary>${title}</summary>${body}</details>`;
const dl=rows=>'<dl>'+rows.filter(x=>x[1]).map(([a,b])=>`<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join('')+'</dl>';
const md=text=>String(text).split(/```[^\n]*\n([\s\S]*?)```/g).map((v,i)=>i%2?'<pre>'+esc(v)+'</pre>':'<p>'+esc(v).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n\n/g,'</p><p>').replace(/\n/g,'<br>')+'</p>').join('');
let rows=[],filtered=[],number=1,size=12,filters=[];
const configs={
 library:{key:'library',filters:[['journal','期刊'],['scope','资料类型'],['year','年份']],class:'wide-grid',render:p=>`<article class="entry">${tags(p.journal,p.year,p.scope)}<h2>${esc(p.title)}</h2><p>${esc(p.authors)}</p><p class="meta">${esc(p.keywords||'主题词尚未补齐')}</p>${link(p.doi?'https://doi.org/'+p.doi:p.url,'文献来源')}${detail('引用与核验状态',`<p class="citation">${esc(p.citation)}</p>${dl([['文章类型',p.type],['来源',p.provenance],['核验',p.verification],['边界',p.screening_note]])}`)}</article>`},
 journals:{key:'journals',filters:[['language','语种'],['category','领域']],render:j=>`<article class="entry">${tags(j.language,j.category)}<h2>${esc(j.name)}</h2>${dl([['关注内容',j.focus],['研究与方法提示',j.methods]])}<p class="meta">${esc(j.issn?'ISSN '+j.issn:'ISSN 尚未核对')}</p>${link(j.url,'期刊／官方身份入口')}${detail('核对事项',`<p>${esc(j.note)}</p><p>${esc(j.submission_check||'核对当前栏目、文章类型、字数、数据共享、费用及作者指南。')}</p><p>${esc(j.scope_note)}</p>`)}</article>`},
 institutions:{key:'institutions',filters:[['region','地区']],render:i=>`<article class="entry">${tags(i.region)}<h2>${esc(i.name)}</h2>${dl([['方向入口',i.focus],['看研究',i.research_entry],['看培养',i.study_entry]])}${link(i.url,'官方机构入口')}${detail('比较与核验口径',`<p>${esc(i.comparison)}</p><p>${esc(i.status)}</p>`)}</article>`},
 figures:{key:'figures',filters:[['journal','期刊'],['kind','资料形态']],class:'figure-grid',render:f=>`<article class="entry"><a href="${esc(f.image)}" target="_blank" rel="noopener"><img class="figure-image" src="${esc(f.image)}" alt="${esc(f.title)}，${esc(f.locator)}" loading="lazy"></a><div style="margin-top:17px">${tags(f.journal,f.kind)}</div><h2>${esc(f.title)}</h2><p class="citation">${esc(f.citation)}</p><p>${esc(f.locator)}</p>${link(f.doi?'https://doi.org/'+f.doi:f.url,'原论文与图源')}${detail('处理记录与图片权利',dl([['处理',f.processing],['来源',f.provenance],['权利',f.rights],['SHA-256',f.sha256]]))}</article>`},
 methods:{key:'methods',filters:[['category','方法分类']],class:'wide-grid',render:m=>`<article class="entry">${tags(m.id,category[m.category]||m.category)}<h2>${esc(m.name)}</h2>${md(m.content.split('**代码**')[0])}${link(m.source,'完整方法与代码')}${detail('展开方法说明与原有代码',md(m.content))}</article>`},
 code:{key:'code-library',filters:[['language','语言'],['source','工具来源']],class:'wide-grid',render:c=>`<article class="entry">${tags(c.language)}<h2>${esc(c.title)}</h2><p class="meta">${esc(c.status)} · ${esc(c.source)}:${esc(c.line)}</p>${detail('展开代码',`<pre>${esc(c.code)}</pre><button class="secondary" data-copy="${esc(c.id)}">复制片段</button>`)}${link(c.source,'查看上下文')}</article>`},
 tools:{key:'tools',filters:[['category','分类']],render:t=>`<article class="entry">${tags(...t.tags)}<h2>${esc(t.name)}</h2><p>${esc(t.description)}</p>${link(t.url,'打开工具手册')}</article>`},
 sources:{key:'sources',filters:[['category','资源类型']],render:s=>`<article class="entry">${tags(s.category)}<h2>${esc(s.name)}</h2><p>${esc(s.description||s.focus||s.note)}</p>${link(s.url,'来源入口')}${s.note?'<p class="tiny">'+esc(s.note)+'</p>':''}</article>`},
 'insurance-timeline':{key:'insurance-timeline',filters:[['track','改革主线']],class:'timeline',size:30,render:p=>`<article class="entry"><div><time>${esc(p.date)}</time><div class="date-basis">${esc(p.date_basis)}</div></div><div>${tags(p.track,p.status)}<h2>${esc(p.title)}</h2><p>${esc(p.description)}</p>${dl([['文件号',p.document_number],['落地与生效',p.implementation]])}${link(p.url,'政策原文')}<p class="tiny">核验日期 ${esc(p.verified_on)}</p></div></article>`},
};
const category={A:'研究设计',B:'统计分析',C:'卫生经济评价',D:'因果推断',E:'数据科学',F:'理论框架',G:'定性与结构方程',H:'证据综合',I:'模拟与决策',J:'政策文本与AI评价'};
function initList(){
 const c=configs[page];if(!c)return;
 rows=D[c.key]||[];
 size=c.size||12;filters=c.filters;
 $('#results').className='grid '+(c.class||'');
 $('#toolbar').innerHTML='<label class="search">检索<input type="search" id="search" placeholder="输入名称、主题词、作者或项目号…"></label>'+filters.map(([k,label])=>`<label>${label}<select data-filter="${k}" aria-label="${label}"><option value="">全部${label}</option>${[...new Set(rows.map(x=>x[k]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b))).map(v=>`<option value="${esc(v)}">${esc(category[v]||v)}</option>`).join('')}</select></label>`).join('');
 $('#search').addEventListener('input',()=>{number=1;render()});
 document.querySelectorAll('[data-filter]').forEach(x=>x.addEventListener('change',()=>{number=1;render()}));
 $('#prev').addEventListener('click',()=>{number--;render();$('#count').scrollIntoView({block:'start'})});
 $('#next').addEventListener('click',()=>{number++;render();$('#count').scrollIntoView({block:'start'})});
 $('#results').addEventListener('click',async e=>{const b=e.target.closest('[data-copy]');if(!b)return;const code=rows.find(x=>x.id===b.dataset.copy)?.code;try{await navigator.clipboard.writeText(code);b.textContent='已复制'}catch{b.textContent='请在上方代码框手动复制'}});
 render();if(page==='library')charts();
}
function render(){
 const q=$('#search').value.trim().toLowerCase();filtered=rows.filter(x=>(!q||JSON.stringify(x).toLowerCase().includes(q))&&[...document.querySelectorAll('[data-filter]')].every(s=>!s.value||String(x[s.dataset.filter])===s.value));
 const max=Math.max(1,Math.ceil(filtered.length/size));number=Math.min(number,max);
 $('#count').textContent=`匹配 ${filtered.length} 条 / 本页资源共 ${rows.length} 条`;
 $('#results').innerHTML=filtered.length?filtered.slice((number-1)*size,number*size).map(configs[page].render).join(''):'<div class="empty">这组条件下没有结果。试试更短的主题词或清除筛选。</div>';
 $('#pageNumber').textContent=`${number} / ${max}`;$('#prev').disabled=number===1;$('#next').disabled=number===max;
}
function charts(){
 const box=$('#charts');if(!box)return;const counts={},scopes={};rows.forEach(x=>{counts[x.year]=(counts[x.year]||0)+1;scopes[x.scope]=(scopes[x.scope]||0)+1});const years=Object.keys(counts).sort(),max=Math.max(...Object.values(counts));
 box.innerHTML='<div class="chart-box"><h2>已有题录的年份分布</h2><div class="bars" role="img" aria-label="'+esc(years.map(y=>y+'年 '+counts[y]+'条').join('；'))+'">'+years.map(y=>`<div class="bar-unit"><b>${counts[y]}</b><i style="height:${Math.max(3,75*counts[y]/max)}px"></i><span>${esc(y)}</span></div>`).join('')+'</div></div><div class="chart-box"><h2>收录边界</h2>'+Object.entries(scopes).map(([k,v])=>`<div class="mini-row"><span>${esc(k)}</span><b>${v}</b></div>`).join('')+'<p class="tiny">仅反映已提供资料，不能据此判断整个学科的年度产出或热点升降。</p></div>';
}
function initMatcher(){
 if(page!=='journal-match')return;
 $('#matchForm').addEventListener('submit',e=>{e.preventDefault();const input={title:$('#matchTitle').value,abstract:$('#matchAbstract').value,language:$('#matchLanguage').value,type:$('#matchType').value};const out=JournalEngine.match(input,D.journals,D['journal-rules']);
  const box=$('#matchResults'),head=$('#matchSummary');
  if(out.error){head.textContent=out.error;box.innerHTML='';return}
  const themes=Object.entries(out.hits).filter(([,v])=>v.score).sort((a,b)=>b[1].score-a[1].score).map(([k])=>D['journal-rules'].labels[k]);
  const checklist=input.type==='系统综述 / Meta分析'?'核对是否接收主动投稿综述；说明检索日期、注册、偏倚评价与证据确定性。':input.type==='经济评价'?'核对评价视角、时间范围、比较方案、成本与效果来源、阈值和不确定性；参考 CHEERS。':input.type==='定性 / 混合方法'?'核对抽样策略、研究者反思、资料饱和/信息力、编码过程及整合方式。':'核对研究设计、识别假设、效应量与区间、伦理及数据可用性。';
  head.textContent=`识别主题：${themes.join(' · ')}。找到 ${out.results.length} 个初筛候选。${out.titleOnly?'目前仅有标题，缺少方法和结果，排序依据较少。':''}`;
  box.innerHTML=out.results.map((r,i)=>`<article class="entry"><span class="rank">${String(i+1).padStart(2,'0')}</span>${tags(r.journal.language,...r.topics.map(k=>D['journal-rules'].labels[k]))}<h3>${esc(r.journal.name)}</h3>${dl([['为什么进入候选',r.journal.focus],['命中的主题词',r.terms.join('、')],['识别到的方法线索',r.methods.length?r.methods.join('、'):'尚无明确线索，请补充方法。'],['这类稿件需补齐',checklist],['期刊特定核对',r.journal.submission_check]])}<p class="meta">主题匹配不代表创新性、质量或文章类型已符合编辑要求。</p>${link(r.journal.url,'查看范围与投稿要求')}</article>`).join('');
  $('#matchOutput').hidden=false;$('#matchOutput').scrollIntoView({block:'start',behavior:'smooth'});
 });
 $('#clearMatch').addEventListener('click',()=>{$('#matchForm').reset();$('#matchResults').innerHTML='';$('#matchSummary').textContent='填写标题或摘要后生成候选。';$('#matchOutput').hidden=false});
 $('#exampleMatch').addEventListener('click',()=>{$('#matchTitle').value='医保支付方式改革与住院费用：基于医院数据的政策评估';$('#matchAbstract').value='示例文本：关注 DRG 支付改革、医疗费用、服务利用及健康公平。拟使用双重差分和事件研究，核对平行趋势与改革时点。此示例没有研究结果，不对应任何私人课题。';$('#matchLanguage').value='中文';$('#matchType').value='原创研究';});
}
initList();initMatcher();
})();
