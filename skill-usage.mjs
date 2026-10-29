import {SERVICE,fetchUsageStats,formatCount} from './usage-client.mjs?v=20261029complete1';
import {resolveSkillContext,buildSkillTask} from './skill-task-core.mjs?v=20261029complete1';

const ROOT=new URL('./',import.meta.url);
const CATEGORIES={general:'综合与研究流程',method:'研究方法',database:'数据库',policy:'政策研究',writing:'学术写作',figure:'科研绘图',slides:'幻灯片与汇报'};
export function filterSkills(catalog,{query='',category=''}={}){
 const q=query.trim().toLowerCase();
 return Object.entries(catalog).filter(([id,info])=>(!category||info.category===category)&&(!q||[id,info.label,CATEGORIES[info.category]||info.category].join(' ').toLowerCase().includes(q)));
}
export function filterMethods(methods,query=''){
 const q=query.trim().toLowerCase();return methods.filter(method=>!q||[method.id,method.name,method.role,method.primary_analysis].join(' ').toLowerCase().includes(q));
}
export function isSamePageAnchor(href,currentHref){
 try{const url=new URL(href,currentHref),current=new URL(currentHref);return !!url.hash&&url.origin===current.origin&&url.pathname===current.pathname;}catch{return false;}
}
export function allowsUsageRecording({hostname,protocol,doNotTrack}={}){
 return /^https?:$/.test(protocol||'')&&!['localhost','127.0.0.1','::1','[::1]'].includes(hostname)&&!!hostname&&!['1','yes'].includes(String(doNotTrack).toLowerCase());
}
export const selectionKey=selection=>JSON.stringify([selection.skill,selection.platform,selection.methodId||'',selection.contextFile||'']);

// Only public, catalogued Markdown is fetched. Search text is never part of a task or telemetry.
export function createTaskComposer({catalog,methods=[],root=ROOT,fetchImpl=fetch}={}){
 const base=new URL(root),documents=new Map();
 async function readMarkdown(file){
  const url=new URL(file,base);if(url.origin!==base.origin||!url.pathname.startsWith(base.pathname)||!url.pathname.endsWith('.md'))throw new Error('Skill正文地址不在本站公开目录内。');
  if(!documents.has(url.href))documents.set(url.href,(async()=>{const response=await fetchImpl(url.href,{credentials:'omit',signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('公开Skill正文暂不可读，请重试。');const text=await response.text();if(!text.trim()||/^\s*<!doctype\s+html/i.test(text))throw new Error('未取得有效的Skill正文，请重试。');return text;})());
  try{return await documents.get(url.href);}catch(error){documents.delete(url.href);throw error;}
 }
 async function compose(selection,platformLabel){
  const info=catalog[selection.skill];if(!info)throw new Error('请先选择一个Skill。');
  const method=selection.methodId?methods.find(row=>row.id===selection.methodId):undefined;
  if(selection.methodId&&!method)throw new Error('所选方法尚未取得，请重新选择。');
  const reference=selection.contextFile?resolveSkillContext(selection.contextFile,base,catalog):null;
  if(selection.contextFile&&reference?.contextFile!==selection.contextFile)throw new Error('参考正文不在本站公开目录内。');
  const [mainText,contextText]=await Promise.all([readMarkdown(info.file),selection.contextFile?readMarkdown(selection.contextFile):undefined]);
  return buildSkillTask({info,platformLabel,mainText,contextText,contextFile:reference?.contextFile,contextLabel:reference?.contextLabel,method,siteRoot:base.href});
 }
 return {compose,readSkill:async id=>{if(!catalog[id])throw new Error('请先选择一个Skill。');return readMarkdown(catalog[id].file);}};
}

// A completed task stays usable even when recording fails. No task body is sent here.
export function createInvocationRecorder({fetchImpl=fetch,allowed=()=>true,uuid=()=>crypto.randomUUID(),onStatus=()=>{},onRecorded=()=>{}}={}){
 const requests=new Map();
 function record({key,skill,platform,page}){
  if(requests.has(key))return requests.get(key);
  const request=(async()=>{
   if(!allowed()){onStatus(key,'skipped');return 'skipped';}
   onStatus(key,'pending');
   try{
    const response=await fetchImpl(SERVICE+'/api/skill-invoke',{method:'POST',credentials:'omit',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(8000),body:JSON.stringify({id:uuid(),skill,platform,page})});
    const data=response.ok?await response.json():null;
    if(data?.recorded===true){onStatus(key,'recorded');onRecorded();return 'recorded';}
   }catch{/* Reporting cannot invalidate a locally composed task. */}
   onStatus(key,'unconfirmed');return 'unconfirmed';
  })();requests.set(key,request);return request;
 }
 return {record};
}

export async function initSkillUsage(){
 if(window.__puxianSkillUI)return;window.__puxianSkillUI=true;
 const node=(tag,text,cls)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(cls)element.className=cls;return element;};
 const allowed=()=>allowsUsageRecording({hostname:location.hostname,protocol:location.protocol,doNotTrack:navigator.doNotTrack||window.doNotTrack});
 const local=!/^https?:$/.test(location.protocol)||['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);
 const noRecording=()=>local?'本地预览不写线上计数。':'浏览器已启用不跟踪，本次操作不写线上计数。';
 const css=node('link');css.rel='stylesheet';css.href=new URL('skill-usage.css?v=20261029complete1',ROOT).href;document.head.append(css);
 const corner=node('section',undefined,'puxian-usage-corner');corner.setAttribute('aria-label','访问与任务书生成统计');
 const title=node('a','访问 · 点击 · 任务书生成','usage-corner-title');title.href=new URL('usage-statistics.html',ROOT).href;corner.append(title);
 const counters=node('a',undefined,'usage-corner-numbers');counters.href=title.href;counters.setAttribute('aria-label','查看全部使用统计');
 const counterValues={};for(const [key,label]of [['visits','访问PV'],['clicks','操作点击'],['tasks','任务书生成']]){const cell=node('span'),value=node('strong','暂缺');counterValues[key]=value;cell.append(value,node('small',label));counters.append(cell);}corner.append(counters);
 const badgeStatus=node('p','正在读取公开统计…','usage-corner-status');badgeStatus.setAttribute('role','status');badgeStatus.setAttribute('aria-live','polite');corner.append(badgeStatus);
 const cornerActions=node('div',undefined,'usage-corner-actions'),retry=node('button','重试统计'),all=node('a','全部统计 ↗'),choose=node('button','选择并使用Skill');retry.type=choose.type='button';choose.disabled=true;all.href=title.href;cornerActions.append(retry,all,choose);corner.append(cornerActions);
 for(const anchor of corner.querySelectorAll('a'))anchor.dataset.puxianEvent='stats_open';
 const rail=document.querySelector('.rail');if(rail){const brand=rail.querySelector('.brand');if(brand)brand.after(corner);else rail.prepend(corner);}else{const header=document.querySelector('body>header');if(header)header.after(corner);else document.body.prepend(corner);}
 let refreshing=false,lastData=null;
 async function refresh(force=false){
  if(refreshing)return;refreshing=true;retry.disabled=true;
  try{
   const data=await fetchUsageStats({force});lastData=data;
   for(const [key,value]of [['visits',data.totals?.visits],['clicks',data.totals?.clicks],['tasks',data.usage?.totals?.tasks]]){const count=formatCount(value);counterValues[key].textContent=count==='未取得'?'暂缺':count;}
   const stamp=Number.isFinite(Date.parse(data.updatedAt))?new Date(data.updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false})+'（北京时间）':'时间未提供';
   const historic=data.clientMeta?.state!=='live';badgeStatus.textContent=(historic?'历史快照 · '+stamp+'；统计服务暂不可用，阅读和任务书可用。':'更新：'+stamp+'；访问PV不是人数。')+(!allowed()?' '+noRecording():'');badgeStatus.dataset.state=historic?'historical':'live';
   window.dispatchEvent(new CustomEvent('puxian:usage-data',{detail:data}));
  }catch{
   badgeStatus.textContent='统计服务暂不可用，阅读和任务书可用。'+(lastData?' 当前保留上次历史快照。':'当前次数暂缺。')+(!allowed()?' '+noRecording():'');badgeStatus.dataset.state='error';
  }finally{refreshing=false;retry.disabled=false;}
 }
 retry.onclick=()=>void refresh(true);void refresh();
 let refreshTimer;window.addEventListener('puxian:tracked',()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>void refresh(),1400);});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
 async function json(file){const response=await fetch(new URL(file,ROOT),{credentials:'omit'});if(!response.ok)throw new Error('目录暂不可读');return response.json();}
 let catalog,platforms,methods=[];
 try{[catalog,platforms]=await Promise.all([json('data/usage-skill-catalog.json'),json('data/usage-platforms.json')]);if(!Object.keys(catalog).length||!Object.keys(platforms).length)throw new Error('目录为空');}catch{choose.textContent='Skill目录暂不可读，请刷新页面';return;}
 let methodsAvailable=true;try{methods=await json('data/methods.json');if(!Array.isArray(methods))throw new Error();}catch{methods=[];methodsAvailable=false;}
 const composer=createTaskComposer({catalog,methods,root:ROOT}),currentContext=resolveSkillContext(location.href,ROOT,catalog);
 choose.disabled=false;choose.onclick=()=>openSkill(currentContext||{id:catalog.socialmedicineskills?'socialmedicineskills':Object.keys(catalog)[0]});
 const track=(skill,kind,platform)=>{if(!allowed())return 'skipped';if(typeof window.puxianTrackUsage!=='function')return 'unavailable';window.puxianTrackUsage(skill,kind,platform);return 'queued';};
 const save=(text,filename)=>{const anchor=node('a');anchor.href=URL.createObjectURL(new Blob([text],{type:'text/markdown;charset=utf-8'}));anchor.download=filename;anchor.dataset.puxianIgnore='true';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);};
 let dialog=null;
 function openSkill(context){
  if(!catalog[context.id])return;if(dialog){dialog.close();dialog.remove();}
  const state={skill:context.id,platform:platforms.unspecified?'unspecified':Object.keys(platforms)[0],methodId:'',contextFile:context.contextFile||'',tasks:new Map(),reported:new Set(),recordStatus:new Map(),busy:false};
  dialog=node('dialog',undefined,'puxian-skill-dialog');dialog.dataset.puxianIgnore='true';dialog.setAttribute('aria-label','选择Skill并生成完整任务书');
  const head=node('div',undefined,'usage-dialog-head'),close=node('button','关闭 ×');close.type='button';close.onclick=()=>dialog.close();head.append(node('h2','选择Skill，生成完整任务书'),close);dialog.append(head,node('p','选择公开Skill和目标平台，按需附加方法上下文。任务书在本页整理，复制后由您自行粘贴使用；不会自动发给外部模型。','usage-note'));
  const field=(labelText,control)=>{const label=node('label',undefined,'usage-field');label.append(node('span',labelText),control);return label;};
  const skillSearch=node('input');skillSearch.type='search';skillSearch.placeholder='搜索完整名称、英文简称或关键词';
  const category=node('select');category.append(new Option('全部Skill类型',''));for(const key of [...new Set(Object.values(catalog).map(info=>info.category))])category.append(new Option(CATEGORIES[key]||key,key));
  const skillSelect=node('select');skillSelect.setAttribute('aria-label','选择完整Skill');const skillCount=node('small',undefined,'usage-note');
  const grid=node('div',undefined,'usage-picker-grid');grid.append(field('搜索Skill',skillSearch),field('Skill类型',category));dialog.append(grid,field('完整Skill名称',skillSelect),skillCount);
  const chosen=node('p',undefined,'usage-selected');chosen.setAttribute('aria-live','polite');dialog.append(chosen);
  const methodBox=node('details',undefined,'usage-method-options');methodBox.append(node('summary','附加方法上下文（可选，共'+methods.length+'种）'));
  const methodSearch=node('input');methodSearch.type='search';methodSearch.placeholder='搜索方法名称、编号或分析类型';const methodSelect=node('select');methodSelect.setAttribute('aria-label','选择方法上下文');
  const methodChosen=node('p',undefined,'usage-note');methodBox.append(field('搜索方法',methodSearch),field('方法完整名称',methodSelect),methodChosen);if(!methodsAvailable)methodBox.append(node('p','方法目录暂不可读，仍可生成完整主Skill任务书。','usage-note'));dialog.append(methodBox);
  let referenceCheck=null;if(context.contextFile){referenceCheck=node('input');referenceCheck.type='checkbox';referenceCheck.checked=true;const label=node('label',undefined,'usage-confirm');label.append(referenceCheck,node('span','附本页完整参考正文：'+(context.contextLabel||context.contextFile)));dialog.append(label);}
  const platform=node('select');for(const [id,info]of Object.entries(platforms))platform.append(new Option(info.label,id));platform.value=state.platform;dialog.append(field('目标平台',platform));
  const status=node('p','选择完成后，生成或复制完整任务书。','usage-task-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');const recordStatus=node('p',allowed()?'生成与计数分开：统计服务不可用时，任务书仍可复制和下载。':noRecording(),'usage-note');recordStatus.setAttribute('aria-live','polite');dialog.append(status,recordStatus);
  const area=node('textarea');area.rows=12;area.readOnly=true;area.hidden=true;area.setAttribute('aria-label','完整任务书正文');
  const actions=node('div',undefined,'usage-dialog-actions');const action=(text,handler)=>{const button=node('button',text);button.type='button';button.onclick=handler;actions.append(button);return button;};
  const controls=[skillSearch,category,skillSelect,methodSearch,methodSelect,platform,...(referenceCheck?[referenceCheck]:[])];
  const selected=()=>({skill:state.skill,platform:state.platform,methodId:state.methodId,contextFile:referenceCheck?.checked?context.contextFile:''});
  const showRecording=()=>{const value=state.recordStatus.get(selectionKey(selected()));recordStatus.textContent=!allowed()?noRecording():value==='recorded'?'本次任务书生成已由统计服务确认计入；不表示外部平台已经执行。':value==='pending'?'任务书已就绪，计数确认中；可立即复制或下载。':value==='unconfirmed'?'任务书已就绪，计数未确认；复制、下载与平台入口均可使用。':'任务书生成、目标平台操作、本人确认使用分别记录；计数成功与否不影响任务书。';};
  const recorder=createInvocationRecorder({allowed,onStatus:(key,value)=>{state.recordStatus.set(key,value);if(key===selectionKey(selected()))showRecording();},onRecorded:()=>window.dispatchEvent(new Event('puxian:tracked'))});
  async function ensureTask(){
   const selection=selected(),key=selectionKey(selection);if(!catalog[selection.skill])throw new Error('当前筛选没有Skill，请调整关键词或类型。');
   if(!state.tasks.has(key))state.tasks.set(key,composer.compose(selection,platforms[selection.platform].label));
   let task;try{task=await state.tasks.get(key);}catch(error){state.tasks.delete(key);throw error;}
   area.value=task;area.hidden=false;
   void recorder.record({key,skill:selection.skill,platform:selection.platform,page:window.puxianUsagePage||'guide'});return task;
  }
  async function run(work){if(state.busy)return;state.busy=true;for(const control of controls)control.disabled=true;updateButtons();try{await work();}catch(error){status.textContent=error.message||'正文暂不可读，请重试。';}finally{state.busy=false;for(const control of controls)control.disabled=false;updateButtons();}}
  const generate=action('生成完整任务书',()=>void run(async()=>{status.textContent='正在读取所选公开正文…';await ensureTask();status.textContent='完整任务书已生成，可复制或下载；尚未发送到目标平台。';}));
  const copy=action('复制完整任务书',()=>void run(async()=>{const task=await ensureTask();try{await navigator.clipboard.writeText(task);track(state.skill,'copy',state.platform);status.textContent='完整任务书已复制，请自行粘贴到'+platforms[state.platform].label+'。';}catch{area.hidden=false;area.focus();area.select();status.textContent='浏览器未允许自动复制，请在下方已选中的正文中手动复制。';}}));
  const taskDownload=action('下载完整任务书',()=>void run(async()=>{const task=await ensureTask();save(task,state.skill+'-完整任务书.md');if(allowed())window.puxianTrack?.('file_download');status.textContent='已发起完整任务书下载；实际保存位置由浏览器决定。';}));
  const rawDownload=action('下载Skill原文',()=>void run(async()=>{save(await composer.readSkill(state.skill),state.skill+'.md');track(state.skill,'download',state.platform);status.textContent='已发起所选主Skill原文下载；不代表已经在平台使用。';}));
  const open=action('打开目标平台',()=>{const url=platforms[state.platform]?.url;if(!url)return;window.open(url,'_blank','noopener');track(state.skill,'platform',state.platform);status.textContent='已打开'+platforms[state.platform].label+'入口，不会自动发送任务书或文件。';});
  dialog.append(actions,area);area.addEventListener('copy',()=>track(state.skill,'copy',state.platform));
  const confirm=node('input');confirm.type='checkbox';const confirmLabel=node('label',undefined,'usage-confirm');confirmLabel.append(confirm,node('span','我确认已在所选平台实际使用此Skill（本人自报）'));const report=node('button','提交本人确认使用');report.type='button';dialog.append(confirmLabel,report);
  function updateButtons(){const hasSkill=!!catalog[state.skill];for(const button of [generate,copy,taskDownload,rawDownload])button.disabled=state.busy||!hasSkill;open.disabled=state.busy||!platforms[state.platform]?.url;report.disabled=state.busy||!hasSkill||!confirm.checked||state.platform==='unspecified'||state.reported.has(selectionKey(selected()));}
  function changed(){area.hidden=true;confirm.checked=false;chosen.textContent='当前Skill：'+(catalog[state.skill]?.label||'没有匹配项，请调整筛选');methodChosen.textContent=state.methodId?'附加方法：'+(methods.find(method=>method.id===state.methodId)?.name||'未取得'):'不附加方法上下文。';status.textContent='选择已更新，生成或复制时会使用当前组合的完整正文。';showRecording();updateButtons();}
  function renderSkills(){const matches=filterSkills(catalog,{query:skillSearch.value,category:category.value});skillSelect.replaceChildren(...matches.map(([id,info])=>new Option(info.label,id)));if(!matches.some(([id])=>id===state.skill))state.skill=matches[0]?.[0]||'';skillSelect.value=state.skill;skillCount.textContent='当前'+matches.length+' / '+Object.keys(catalog).length+'个Skill；下方完整显示所选名称。';changed();}
  function renderMethods(){const matches=filterMethods(methods,methodSearch.value);methodSelect.replaceChildren(new Option('不附加方法上下文',''),...matches.map(method=>new Option(method.id+' · '+method.name,method.id)));if(!matches.some(method=>method.id===state.methodId))state.methodId='';methodSelect.value=state.methodId;changed();}
  skillSearch.oninput=category.onchange=renderSkills;skillSelect.onchange=()=>{state.skill=skillSelect.value;changed();};methodSearch.oninput=renderMethods;methodSelect.onchange=()=>{state.methodId=methodSelect.value;changed();};platform.onchange=()=>{state.platform=platform.value;changed();};if(referenceCheck)referenceCheck.onchange=changed;
  confirm.onchange=updateButtons;report.onclick=()=>{const key=selectionKey(selected());if(!confirm.checked||state.platform==='unspecified'||state.reported.has(key))return;const outcome=track(state.skill,'reported',state.platform);if(outcome==='queued'){state.reported.add(key);status.textContent='本人确认使用请求已提交发送队列，是否入库仍待统计服务确认。';}else status.textContent=outcome==='skipped'?noRecording():'发送队列暂不可用，本人确认使用尚未提交。';updateButtons();};
  dialog.append(node('p','只向统计服务发送公开Skill编号、所选平台和页面标识；不发送搜索词、任务书正文、账号或文件。目标平台内部执行仍未接入自动统计。','usage-note'));renderSkills();renderMethods();document.body.append(dialog);dialog.showModal();dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 }
 function identify(anchor){return resolveSkillContext(anchor.href,ROOT,catalog);}
 window.addEventListener('click',event=>{
  const path=event.composedPath();if(path.some(item=>item instanceof Element&&item.hasAttribute('data-puxian-ignore')))return;
  const button=path.find(item=>item instanceof Element&&item.hasAttribute('data-puxian-use'));
  if(button){event.preventDefault();event.stopImmediatePropagation();openSkill({id:button.dataset.puxianUse,contextFile:button.dataset.puxianContext,contextLabel:button.dataset.puxianContextLabel});return;}
  const anchor=path.find(item=>item instanceof HTMLAnchorElement);if(!anchor||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const context=identify(anchor);if(context&&(anchor.hasAttribute('download')||anchor.pathname.endsWith('.md'))){event.preventDefault();event.stopImmediatePropagation();openSkill(context);}
 },{capture:true});
 function decorate(){
  for(const anchor of document.querySelectorAll('a[href]')){
   if(anchor.closest('.puxian-skill-dialog,nav,aside,[role="navigation"],.toc,.table-of-contents')||anchor.dataset.usageDecorated||isSamePageAnchor(anchor.href,location.href))continue;const context=identify(anchor);if(!context)continue;anchor.dataset.usageDecorated='true';const parent=anchor.closest('.actions')||anchor.parentElement;
   if([...parent.querySelectorAll('[data-puxian-use]')].some(button=>button.dataset.puxianUse===context.id&&(button.dataset.puxianContext||'')===(context.contextFile||'')))continue;
   const button=node('button','使用 '+catalog[context.id].label,'usage-skill-button');button.type='button';button.dataset.puxianUse=context.id;if(context.contextFile){button.dataset.puxianContext=context.contextFile;button.dataset.puxianContextLabel=context.contextLabel;}parent.append(button);
  }
 }
 decorate();let decorateTimer;new MutationObserver(()=>{clearTimeout(decorateTimer);decorateTimer=setTimeout(decorate,100);}).observe(document.body,{childList:true,subtree:true});
}
if(typeof document!=='undefined')void initSkillUsage();
