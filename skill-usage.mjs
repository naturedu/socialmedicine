const SERVICE='https://puxian-visit-statistics.greycarp257.chatgpt.site';
const ROOT=new URL('./',import.meta.url),local=['localhost','127.0.0.1'].includes(location.hostname);
const PLATFORMS={unspecified:'未指定平台',doubao:'豆包',chatgpt:'ChatGPT / GPT',codex:'Codex',claude:'Claude',other:'其他平台'};
const URLS={doubao:'https://www.doubao.com/',chatgpt:'https://chatgpt.com/',codex:'https://chatgpt.com/codex',claude:'https://claude.ai/'};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const css=node('link');css.rel='stylesheet';css.href=new URL('skill-usage.css',ROOT);document.head.append(css);
const corner=node('section',undefined,'puxian-usage-corner');corner.setAttribute('aria-label','访问点击与Skill调用统计');
const title=node('a','访问 · 点击 · 调用','usage-corner-title');title.href=new URL('usage-statistics.html',ROOT);corner.append(title);
const counters=node('a',undefined,'usage-corner-numbers');counters.href=title.href;counters.setAttribute('aria-label','查看分类和平台统计');
const counterValues={};for(const [key,label]of [['visits','访问PV'],['clicks','点击'],['tasks','调用¹']]){const span=node('span'),v=node('strong','—');counterValues[key]=v;span.append(v,node('small',label));counters.append(span);}
corner.append(counters,node('a','按类型 / 豆包 / GPT ↗','usage-corner-more'));corner.lastChild.href=title.href;
for(const a of corner.querySelectorAll('a'))a.dataset.puxianEvent='stats_open';
const badgeStatus=node('small',local?'本地预览不写线上计数':'读取中…','usage-corner-status');corner.append(badgeStatus);
const rail=document.querySelector('.rail');if(rail)rail.querySelector('.brand')?.after(corner);else{const header=document.querySelector('body>header');if(header)header.prepend(corner);else document.body.prepend(corner);}
let catalog={},lastData=null,busy=false;
async function refresh(){if(busy)return;busy=true;try{const r=await fetch(SERVICE+'/api/stats',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error();const d=await r.json();
 if(d.totals?.visits==null||d.totals?.clicks==null||!Number.isFinite(Number(d.totals.visits))||!Number.isFinite(Number(d.totals.clicks)))throw new Error();lastData=d;counterValues.visits.textContent=Number(d.totals.visits).toLocaleString('zh-CN');counterValues.clicks.textContent=Number(d.totals.clicks).toLocaleString('zh-CN');counterValues.tasks.textContent=d.usage?Number(d.usage.totals.tasks).toLocaleString('zh-CN'):'—';
 badgeStatus.textContent=(local?'线上汇总 · 本地不计数 · ':'')+'¹调用=任务书生成';badgeStatus.title='更新于 '+new Date(d.updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})+'；访问不是独立人数。';
 window.dispatchEvent(new CustomEvent('puxian:usage-data',{detail:d}));
 }catch{badgeStatus.textContent=lastData?'读取失败，保留上次快照':'统计暂不可用，未以0代替';}finally{busy=false;}}
void refresh();let timer;window.addEventListener('puxian:tracked',()=>{clearTimeout(timer);timer=setTimeout(refresh,1400);});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
try{const r=await fetch(new URL('data/usage-skill-catalog.json',ROOT));if(r.ok)catalog=await r.json();}catch{}
function identify(a){try{const u=new URL(a.href),root=ROOT.pathname;const m=new RegExp('^'+root.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?:skills|guides)/([a-z0-9-]+)\\.(?:md|html)$').exec(u.pathname);
 if(u.origin===ROOT.origin&&m&&catalog[m[1]])return m[1];
 if(u.origin==='https://github.com'&&/^\/naturedu\/socialmedicine\/releases\/(?:latest\/download|download\/[^/]+)\/socialmedicineskills\.zip$/.test(u.pathname))return 'socialmedicineskills';
 }catch{}return null;}
function track(skill,kind,platform){if(local)return;window.puxianTrackUsage?.(skill,kind,platform);}
let dialog=null;
function openSkill(id,href){
 if(!catalog[id])return;if(dialog){dialog.close();dialog.remove();}
 const info=catalog[id];const state={id,platform:'unspecified',task:null,requests:new Map(),download:href||new URL(info.file,ROOT).href,reported:false};
 dialog=node('dialog',undefined,'puxian-skill-dialog');const header=node('div',undefined,'usage-dialog-head'),close=node('button','关闭 ×');close.type='button';close.onclick=()=>dialog.close();header.append(node('h2','使用 '+info.label),close);dialog.append(header);
 const intro=node('p','先选择要使用的平台；网站只记录所选平台与操作类型，不读取账号、对话或文件内容。','usage-note');dialog.append(intro);
 const label=node('label','目标平台 '),select=node('select');select.setAttribute('aria-label','目标平台');for(const [value,text]of Object.entries(PLATFORMS)){const option=node('option',text);option.value=value;select.append(option);}label.append(select);dialog.append(label);
 const status=node('p',local?'本地预览：可下载和复制，操作不计入线上统计。':'下载、复制和本人确认分别计数。','usage-note');status.setAttribute('role','status');dialog.append(status);
 const area=node('textarea');area.rows=12;area.readOnly=true;area.hidden=true;area.setAttribute('aria-label','Skill完整任务书');
 const actions=node('div',undefined,'usage-dialog-actions');const button=(text,fn)=>{const b=node('button',text);b.type='button';b.onclick=fn;actions.append(b);return b;};
 const download=button('下载 Skill',()=>{track(id,'download',state.platform);const a=node('a');a.href=state.download;a.download=id+'.md';a.dataset.puxianIgnore='true';document.body.append(a);a.click();a.remove();status.textContent='已发起下载，记录为下载点击；是否完成由浏览器决定。';});
 async function ensureTask(){
  const key=state.platform;if(state.requests.has(key))return state.requests.get(key);
  const promise=(async()=>{let task;
   if(local){const r=await fetch(new URL(info.file,ROOT));if(!r.ok)throw new Error('本地Skill文件暂不可读');task='请使用以下Skill协助我。目标平台：'+PLATFORMS[key]+'。\n我会补充研究问题、数据版本及交付物；请先核对适用条件，不补造结果。\n\n'+await r.text()+'\n\n来源：'+new URL(info.file,'https://naturedu.github.io/socialmedicine/').href;}
   else{const body=JSON.stringify({id:crypto.randomUUID(),skill:id,platform:key,page:window.puxianUsagePage||'guide'});const attempt=()=>fetch(SERVICE+'/api/skill-invoke',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},body});let r;try{r=await attempt();if(r.status>=500)r=await attempt();}catch{r=await attempt();}if(!r.ok)throw new Error('任务书生成暂不可用，请稍后重试');const data=await r.json();task=data.task;window.dispatchEvent(new Event('puxian:tracked'));}
   if(state.platform===key){state.task=task;area.value=task;area.hidden=false;}return task;
  })();state.requests.set(key,promise);try{return await promise;}catch(e){state.requests.delete(key);throw e;}
 }
 const generate=button('生成完整任务书',async()=>{generate.disabled=true;select.disabled=true;status.textContent='正在生成…';try{await ensureTask();status.textContent=local?'本地演示任务书已生成，不计入线上调用。':'任务书已生成，计入站内调用；外部平台尚未执行。';}catch(e){status.textContent=e.message;}finally{generate.disabled=false;select.disabled=false;}});
 const copy=button('复制到所选平台使用',async()=>{copy.disabled=true;select.disabled=true;try{const task=await ensureTask();try{await navigator.clipboard.writeText(task);track(id,'copy',state.platform);status.textContent='任务书已复制，可粘贴至 '+PLATFORMS[state.platform]+'。这不表示平台已执行。';}catch{area.hidden=false;area.focus();area.select();status.textContent='请在文本框内手动复制；尚未记为复制成功。';}}catch(e){status.textContent=e.message;}finally{copy.disabled=false;select.disabled=false;}});
 area.addEventListener('copy',()=>track(id,'copy',state.platform));
 const open=button('打开目标平台',()=>{const url=URLS[state.platform];if(url){window.open(url,'_blank','noopener');track(id,'platform',state.platform);status.textContent='已打开平台入口，不会自动上传任务书或文件。';}});open.disabled=true;
 dialog.append(actions,area);const confirmLabel=node('label',undefined,'usage-confirm'),confirm=node('input');confirm.type='checkbox';confirmLabel.append(confirm,node('span','我确认已在所选平台实际使用此 Skill（自报）'));dialog.append(confirmLabel);
 const report=node('button','登记“本人确认使用”');report.type='button';report.disabled=true;confirm.onchange=()=>{report.disabled=!confirm.checked||state.platform==='unspecified'||state.reported;};report.onclick=()=>{if(!confirm.checked||state.platform==='unspecified'||state.reported)return;track(id,'reported',state.platform);state.reported=true;report.disabled=true;status.textContent=local?'本地演示，不写入线上自报记录。':'已登记为本人确认使用；与平台自动验证的执行记录分开。';};dialog.append(report);
 select.onchange=()=>{state.platform=select.value;state.task=null;state.reported=false;confirm.checked=false;report.disabled=true;area.hidden=true;open.disabled=!URLS[select.value];status.textContent=local?'本地预览不写线上计数。':'目标平台：'+PLATFORMS[select.value]+'；不自动代表已使用。';};
 dialog.append(node('p','当前不能读取豆包/GPT内部执行、真实姓名或离线使用。服务器任务书生成、目标平台操作、本人确认使用分别统计。','usage-note'));document.body.append(dialog);dialog.showModal();
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
}
window.addEventListener('click',event=>{
 const path=event.composedPath();if(path.some(x=>x instanceof Element&&x.hasAttribute('data-puxian-ignore')))return;
 const b=path.find(x=>x instanceof Element&&x.hasAttribute('data-puxian-use'));
 if(b){event.preventDefault();event.stopImmediatePropagation();openSkill(b.getAttribute('data-puxian-use'));return;}
 const a=path.find(x=>x instanceof HTMLAnchorElement);if(!a||event.ctrlKey||event.metaKey||a.closest('.puxian-skill-dialog'))return;
 const id=identify(a);if(id&&(a.hasAttribute('download')||a.pathname.endsWith('.md')||a.pathname.endsWith('.zip'))){event.preventDefault();event.stopImmediatePropagation();openSkill(id,a.href);}
},{capture:true});
function decorate(){
 for(const a of document.querySelectorAll('a[href]')){if(a.closest('.puxian-skill-dialog')||a.dataset.usageDecorated)continue;const id=identify(a);if(!id)continue;a.dataset.usageDecorated='true';const parent=a.closest('.actions')||a.parentElement;if(parent.querySelector(`[data-puxian-use="${id}"]`))continue;const b=node('button','豆包 / GPT 使用','usage-skill-button');b.type='button';b.dataset.puxianUse=id;parent.append(b);}
 const m=/\/guides\/([a-z0-9-]+)\.html$/.exec(location.pathname);if(m&&catalog[m[1]]&&!document.querySelector('header [data-puxian-use]')){const b=node('button','使用此 Skill','usage-skill-button');b.type='button';b.dataset.puxianUse=m[1];document.querySelector('body>header')?.append(b);}
}
decorate();let decorateTimer;new MutationObserver(()=>{clearTimeout(decorateTimer);decorateTimer=setTimeout(decorate,100);}).observe(document.body,{childList:true,subtree:true});
