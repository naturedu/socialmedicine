import {usageCsv} from './usage-core.mjs?v=20261029complete1';
import {fetchUsageStats,formatCount} from './usage-client.mjs?v=20261029complete1';
const root=document.getElementById('usageDashboard');
const node=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const number=formatCount;
const known=value=>number(value)!=='未取得';
const time=value=>new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
const chatLabels={questions:'提问',answered:'已回答',clarifications:'需要补充信息',unmatched:'未匹配资料',errors:'回答失败',followups:'追问',helpful:'有帮助',unhelpful:'还没解决',exports:'导出对话'};
function displaySummary(data){
 const visits=data.totals?.visits,clicks=data.totals?.clicks;
 const recent=days=>{
  if(!Array.isArray(data.daily)||!/^\d{4}-\d{2}-\d{2}$/.test(data.today||'')||!Number.isFinite(Date.parse(data.today)))return{visits:null,clicks:null};
  const since=new Date(Date.parse(data.today+'T00:00:00Z')-(days-1)*86400000).toISOString().slice(0,10);
  const rows=data.daily.filter(row=>row.day>=since&&row.day<=data.today);
  return Object.fromEntries(['visits','clicks'].map(key=>[key,rows.length&&rows.every(row=>known(row[key]))?rows.reduce((total,row)=>total+Number(row[key]),0):null]));
 };
 return{visits,clicks,opens:data.skillTotals?.opens??data.usage?.totals?.opens,downloads:data.skillTotals?.downloads??data.usage?.totals?.downloads,
  today:recent(1),week:recent(7),month:recent(30),perHundred:known(visits)&&known(clicks)&&Number(visits)>0?Number(clicks)/Number(visits)*100:null};
}
function completeCsv(data){
 const counts=[data.totals?.visits,data.totals?.clicks,data.skillTotals?.opens,data.skillTotals?.downloads,
  ...(data.daily||[]).flatMap(row=>[row.visits,row.clicks]),...(data.pages||[]).map(row=>row.count),
  ...(data.actions||[]).map(row=>row.count),...(data.skills||[]).flatMap(row=>[row.opens,row.downloads])];
 if(data.downloadTotals)counts.push(data.downloadTotals.total);
 if(data.chatTotals)counts.push(...Object.keys(chatLabels).map(key=>data.chatTotals[key]));
 if(!counts.every(known))return null;
 try{return usageCsv(data);}catch{return null;}
}
function table(headers,rows){const wrap=node('div',undefined,'table-scroll'),t=node('table',undefined,'summary-table'),head=node('thead'),tr=node('tr');headers.forEach(h=>tr.append(node('th',h)));head.append(tr);const body=node('tbody');for(const row of rows){const r=node('tr');row.forEach(value=>r.append(node('td',String(value))));body.append(r);}t.append(head,body);wrap.append(t);return wrap;}
function save(name,text,mime){const u=URL.createObjectURL(new Blob([text],{type:mime})),a=node('a');a.href=u;a.download=name;a.click();window.puxianTrack?.('file_download');setTimeout(()=>URL.revokeObjectURL(u),1000);}
if(root){
 const actions=node('div',undefined,'actions'),refresh=node('button','刷新统计','secondary'),csv=node('button','下载统计 CSV','secondary'),json=node('button','下载原始 JSON','text-button'),status=node('p','打开此页时读取最新公开统计。','micro'),content=node('div');
 refresh.type=csv.type=json.type='button';csv.disabled=json.disabled=true;status.setAttribute('role','status');actions.append(refresh,csv,json);root.append(actions,status,content);let snapshot,csvText=null,busy=false,loaded=false,timer;
 async function load({force=false}={}){if(busy)return;loadInventory();busy=true;refresh.disabled=true;status.textContent='正在读取公开统计…';
  try{const data=await fetchUsageStats({force}),s=displaySummary(data);snapshot=data;loaded=true;content.replaceChildren();
   const metrics=node('div',undefined,'usage-metrics');for(const [label,value]of [['累计页面访问',s.visits],['已记录按钮点击',s.clicks],['Skill 打开',s.opens],['Skill 下载点击',s.downloads]]){const card=node('article',undefined,'surface');card.append(node('span',label,'micro'),node('strong',number(value)));metrics.append(card);}content.append(metrics);
   content.append(node('h3','全部下载与科研对话'));
   content.append(table(['记录项目','累计次数'],[['全部下载点击',data.downloadTotals?number(data.downloadTotals.total):'未接入'],...Object.entries(chatLabels).map(([key,label])=>[label,data.chatTotals?number(data.chatTotals[key]):'未接入'])]));
   content.append(node('p','问答统计自 2026-10-24 启用。已回答表示已整理站内资料，不表示答案已通过专家核验；不保存问题和回答原文。下载包括已记录的单份 Skill、整包和其他文件下载点击，不代表下载完成。','note'));
   content.append(table(['可用统计范围','页面访问','已记录点击'],[['今天',number(s.today.visits),number(s.today.clicks)],['近 7 天',number(s.week.visits),number(s.week.clicks)],['近 30 天',number(s.month.visits),number(s.month.clicks)]]));
   content.append(node('p',`每百次页面访问对应 ${s.perHundred===null?'—':s.perHundred.toFixed(1)} 次已记录操作。该比值可能超过 100，不是按按钮曝光计算的点击率，也不是访客转化率。`,'note'));
   content.append(node('h3','累计页面访问分布'),table(['页面','访问次数','访问占比'],(data.pages||[]).map(p=>[p.label||p.page,number(p.count),known(p.count)&&known(s.visits)&&Number(s.visits)>0?(Number(p.count)/Number(s.visits)*100).toFixed(1)+'%':'—'])));
   content.append(node('h3','累计功能点击'));if(data.actions?.length)content.append(table(['功能','点击次数'],data.actions.map(a=>[a.label||a.action,number(a.count)])));else content.append(node('p','暂未记录到预设功能的点击，不能据此认定用户没有操作。','note'));
   content.append(node('h3','Skill 打开与下载点击'),table(['Skill','打开','下载点击'],(data.skills||[]).map(k=>[k.label||k.id,number(k.opens),number(k.downloads)])));
   content.append(node('p',known(s.visits)&&Number(s.visits)<100?'当前样本较少，不据此排列科研内容的需求优先级。可继续观察研究计划导出、资料夹使用和 Skill 打开下载。':'对照不同日期的访问与操作记录观察变化，不能仅用点击数量判断资料质量。','note'));
   csvText=completeCsv(data);csv.disabled=csvText===null;json.disabled=false;
   status.textContent=`统计起点：${data.totals?.started||'尚无记录'}；${data.clientMeta?.state==='cached'?'统计服务暂不可读，显示历史快照':'更新'}：${time(data.updatedAt)}（北京时间）${data.clientMeta?.state==='cached'?'；不是最新数据':''}。${csvText===null?'部分字段尚未取得，CSV暂不可导出；JSON保留实际返回字段。':''}`;
  }catch{status.textContent=snapshot?`本次刷新失败，保留 ${time(snapshot.updatedAt)}（北京时间）的快照；不是最新数据。`:'统计暂时无法读取；未用 0 替代缺失数据。请稍后点击刷新或查看独立统计页。';}
  finally{busy=false;refresh.disabled=false;}
 }
 refresh.onclick=()=>load({force:true});csv.onclick=()=>{if(snapshot&&csvText!==null)save('普贤-访问与Skill统计-'+snapshot.today+'.csv',csvText,'text/csv;charset=utf-8');};json.onclick=()=>{if(snapshot)save('普贤-统计原始快照-'+snapshot.today+'.json',JSON.stringify(snapshot,null,2),'application/json');};
 document.addEventListener('click',e=>{const b=e.composedPath().find(x=>x instanceof Element&&x.getAttribute('data-tab')==='usage');if(b&&!loaded)load();});window.addEventListener('hashchange',()=>{if(location.hash==='#usage'&&!loaded)load();});if(location.hash==='#usage')load();
 window.addEventListener('puxian:tracked',()=>{if(!loaded)return;clearTimeout(timer);timer=setTimeout(()=>load(),1800);});
}
async function loadInventory(){
 const inventory=document.getElementById('resourceInventory');if(!inventory||inventory.dataset.loading)return;inventory.dataset.loading='true';
 const defs=[['studio-methods','方法工作台文档','份'],['code-library','原站代码片段','段'],['studio-classics','经典导读','篇'],['research-datasets','数据源深度指南','条'],['research-theses','博士论文题录','条'],['research-schools','院系方向档案','个'],['research-conferences','国际会议与系列','个'],['institutions','扩展院校机构目录','条'],['journals','扩展期刊目录','条'],['research-careers','官方招聘与职业入口','条'],['figures','论文图表条目','条']];
 const rows=await Promise.all(defs.map(async([file,label,unit])=>{try{const r=await fetch(new URL('./data/'+file+'.json',import.meta.url));if(!r.ok)throw new Error();const data=await r.json();if(!Array.isArray(data))throw new Error();return[label,data.length,unit];}catch{return[label,'未能读取',unit];}}));inventory.append(table(['资源类别','当前数量','单位'],rows),node('p','不同目录存在交叉，同一研究可能有题录、片段和代码记录，因此不相加成“独立资源总数”。数量不代表全文可用、逐项代码验证或当年招生状态。','micro'));
}
