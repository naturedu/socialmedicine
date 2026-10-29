import {makeReply,OUTCOMES,metricSnapshot,chooseIntent} from './chat-core.mjs?v=20261029research1';
const root=document.getElementById('researchChat');
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const safeUrl=value=>{if(typeof value!=='string'||!value.trim())return null;try{const u=new URL(value,location.href);return ['http:','https:'].includes(u.protocol)?u.href:null;}catch{return null;}};
const cache=new Map();
async function read(name){if(!cache.has(name))cache.set(name,fetch(new URL('./data/'+name+'.json?v=20261029research1',import.meta.url),{signal:AbortSignal.timeout(15000)}).then(r=>{if(!r.ok)throw new Error('资料暂不可用');return r.json();}).catch(e=>{cache.delete(name);throw e;}));return cache.get(name);}
async function contextFor(q,state){
 const kind=chooseIntent(q,state).kind, data={};
 const paths={publicTopics:[['publicTopics','public-topic-records'],['publicAnalysis','public-topic-analysis']],methods:[['methods','studio-methods'],['methodGuide','method-guide']],schools:[['schools','research-schools']],datasets:[['datasets','research-datasets']],journals:[['journals','studio-journals']],classics:[['classics','studio-classics']],grants:[],goal:[],design:[['datasets','research-datasets']],writing:[],search:[['library','research-knowledge']]};
 await Promise.all((paths[kind]||[]).map(async([key,path])=>{data[key]=await read(path);}));return data;
}
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
const replyText=r=>[r.title,...r.paragraphs,...(r.sections||[]).flatMap(s=>[s.heading,...s.items]),...(r.codes||[]).map(c=>c.heading+'\n'+c.code),r.question||'',...(r.sources||[]).map(s=>s.title+' '+s.url)].join('\n\n');
export async function initChat(){
 if(!root)return;
 let state={},busy=false,turns=[],generation=0;
 const log=root.querySelector('#chatMessages'),form=root.querySelector('#chatForm'),input=root.querySelector('#chatInput'),send=root.querySelector('#chatSend'),status=root.querySelector('#chatStatus'),intro=root.querySelector('#chatIntro'),save=root.querySelector('#rememberChat');
 const storageKey='puxian-chat-v1';
 function persist(){if(save.checked){try{localStorage.setItem(storageKey,JSON.stringify({turns:turns.slice(-20),state}));}catch{status.textContent='本机存储不可用，对话仍可继续。';}}}
 save.addEventListener('change',()=>{if(save.checked)persist();else{try{localStorage.removeItem(storageKey);}catch{}}});
 async function copy(value){try{await navigator.clipboard.writeText(value);status.textContent='已复制。';}catch{status.textContent='无法自动复制，请选中文本手动复制。';}}
 function track(id){window.puxianTrackChat?.(id);}
 function addUser(q){const row=node('article',undefined,'chat-message chat-user');row.append(node('span','你','chat-who'),node('p',q));log.append(row);intro.hidden=true;}
 function addReply(reply,restored=false){
  const row=node('article',undefined,'chat-message chat-assistant');row.append(node('span','普贤 · 站内资料问答','chat-who'),node('h3',reply.title));
  reply.paragraphs.forEach(p=>row.append(node('p',p)));
  for(const [i,section] of (reply.sections||[]).entries()){const container=reply.detailed?node('details',undefined,'research-analysis-section'):row;if(reply.detailed){container.open=i<2;container.append(node('summary',section.heading));row.append(container);}else container.append(node('h4',section.heading));const list=node('ul');for(const text of section.items||[])list.append(node('li',text));container.append(list);}
  for(const c of reply.codes||[]){const details=node('details',undefined,'chat-code');details.append(node('summary',`${c.lang.toUpperCase()} · ${c.heading}`));const pre=node('pre'),code=node('code',c.code);pre.append(code);details.append(pre);const copyCode=node('button','复制代码','chat-text-action');copyCode.type='button';copyCode.onclick=()=>copy(c.code);details.append(copyCode);row.append(details);}
  if(reply.question)row.append(node('p',reply.question,'chat-question'));
  if(reply.sources?.length){const list=node('div',undefined,'chat-sources');list.append(node('span','资料与出处','chat-source-label'));for(const s of reply.sources){const url=safeUrl(s.url);if(!url)continue;const a=node('a',s.title);a.href=url;a.title=s.note||s.title;if(new URL(url).origin!==location.origin){a.target='_blank';a.rel='noopener';}list.append(a);}row.append(list);}
  const actions=node('div',undefined,'chat-answer-actions'),copyBtn=node('button','复制回答'),helpful=node('button','有帮助'),notHelpful=node('button','还没解决');
  copyBtn.onclick=()=>copy(replyText(reply));if(reply.detailed){const task=node('button','复制完整研究任务书');task.type='button';task.onclick=()=>copy('请按以下研究问题和方案初稿继续完成详实分析。先核对信息缺口与原始证据，比较方法成立条件，不编造文献、数据、结果或创新性。输出修订方案、变量表、执行步骤、诊断、图表计划及待核事项。\n\n'+replyText(reply));actions.append(task);}for(const [b,event]of [[helpful,'chat_helpful'],[notHelpful,'chat_unhelpful']]){b.type='button';b.disabled=restored;b.onclick=()=>{track(event);helpful.disabled=notHelpful.disabled=true;b.setAttribute('aria-pressed','true');b.textContent='谢谢反馈';};}actions.append(copyBtn,helpful,notHelpful);row.append(actions);
  if(reply.suggestions?.length){const follow=node('div',undefined,'chat-followups');for(const q of reply.suggestions){const b=node('button',q);b.type='button';b.onclick=()=>{if(!busy){input.value=q;form.requestSubmit();}};follow.append(b);}row.append(follow);}
  log.append(row);
 }
 function clear(){generation++;state={};turns=[];log.replaceChildren();intro.hidden=false;busy=false;send.disabled=false;input.value='';status.textContent='已开始新对话。';try{localStorage.removeItem(storageKey);}catch{}input.focus();}
 root.querySelector('#newChat').onclick=clear;
 root.addEventListener('click',e=>{const a=e.target.closest?.('a');if(a?.getAttribute('href')===new URL('#learn',location.href).href&&a.textContent==='完整阶段路线'){e.preventDefault();const route=document.querySelector('.route-fallback');if(route){route.open=true;route.scrollIntoView({behavior:'smooth',block:'start'});}}});
 root.querySelector('#exportChat').onclick=()=>{if(!turns.length){status.textContent='还没有可导出的对话。';return;}download('普贤-科研问答.txt',turns.map(t=>'问：'+t.q+'\n\n答：'+replyText(t.reply)).join('\n\n————\n\n'));track('chat_export');window.puxianTrack?.('file_download');};
 root.querySelectorAll('[data-chat-prompt]').forEach(b=>b.onclick=()=>{input.value=b.dataset.chatPrompt;form.requestSubmit();});
 form.addEventListener('submit',async e=>{
  e.preventDefault();let q=input.value.trim();if(busy||!q)return;const fields=[...root.querySelectorAll('[data-research-field]')].filter(x=>x.value.trim());if(fields.length)q+='\n'+fields.map(x=>x.dataset.researchField+'：'+x.value.trim()).join('；')+'；请生成详细研究方案';if(q.length>2000){status.textContent='请将单次问题缩短到 2,000 字以内。';return;}
  const thisGeneration=generation;busy=true;send.disabled=true;track('chat_question');if(turns.length)track('chat_followup');addUser(q);input.value='';status.textContent='正在查找站内资料…';
  try{const data=await contextFor(q,state);if(generation!==thisGeneration)return;const reply=makeReply(q,state,data);state=reply.state;addReply(reply);turns.push({q,reply});persist();track(OUTCOMES[reply.status]);status.textContent=reply.status==='answered'?'已整理回答。可以继续追问。':reply.status==='clarify'?'需要补充信息，可以继续回答。':'未找到足够依据，可以换个问法。';}
  catch{if(generation!==thisGeneration)return;const reply={status:'error',title:'资料暂时没有载入。',paragraphs:['这次没有生成回答。请检查网络后重新发送；你的问题没有上传到模型。'],suggestions:[q],sources:[]};addReply(reply);turns.push({q,reply});persist();track('chat_error');status.textContent='回答失败，可点下方原问题重试。';}
  finally{if(generation===thisGeneration){busy=false;send.disabled=false;input.focus();log.lastElementChild?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}}
 });
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}});
 try{const stored=JSON.parse(localStorage.getItem(storageKey)||'null');if(stored&&Array.isArray(stored.turns)){const valid=stored.turns.slice(-20).filter(t=>typeof t.q==='string'&&t.reply&&typeof t.reply.title==='string'&&Array.isArray(t.reply.paragraphs));if(valid.length){save.checked=true;turns=valid;state=stored.state||{};for(const t of turns){addUser(t.q);addReply(t.reply,true);}status.textContent='已恢复本机对话；历史记录不会重复计入统计。';}}}catch{try{localStorage.removeItem(storageKey);}catch{}}
}
initChat();

const metrics=document.getElementById('headerMetrics'),activity=document.getElementById('chatActivity');let loading=false,lastSuccessful=null,refreshTimer;
async function refreshMetrics(){
 if(!metrics||loading)return;loading=true;
 try{const r=await fetch('https://puxian-visit-statistics.greycarp257.chatgpt.site/api/stats',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error();const raw=await r.json(),m=metricSnapshot(raw);lastSuccessful=m;
  for(const key of ['visits','clicks','downloads'])metrics.querySelector(`[data-metric="${key}"]`).textContent=m[key]===null?'—':m[key].toLocaleString('zh-CN');
  const date=new Date(m.updatedAt);metrics.title=`全站累计 · ${date.toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})} 更新。访问不是独立人数；下载为点击次数。`;
  metrics.dataset.state='ready';
  if(activity){activity.replaceChildren();const c=m.chat;if(c){for(const [label,key]of [['提问','questions'],['已回答','answered'],['需补充','clarifications'],['未匹配','unmatched'],['失败','errors'],['追问','followups'],['有帮助','helpful']])activity.append(node('span',`${label} ${Number(c[key]||0).toLocaleString('zh-CN')}`));activity.append(node('small','匿名汇总，非独立人数；功能自 2026-10-24 启用。'));}else activity.append(node('span','互动统计正在接入；未用 0 代替缺失数据。'));}
 }catch{metrics.dataset.state='stale';metrics.title=lastSuccessful?'刷新失败，保留上次快照。':'统计暂不可用；点击查看统计页。';if(activity&&!lastSuccessful)activity.textContent='统计暂不可用；仍可继续问答。';}finally{loading=false;}
}
refreshMetrics();document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshMetrics();});window.addEventListener('puxian:tracked',()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(refreshMetrics,1800);});
document.getElementById('refreshChatStats')?.addEventListener('click',refreshMetrics);
