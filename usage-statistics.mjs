import {SERVICE, fetchUsageStats, formatCount} from './usage-client.mjs?v=20261029complete1';

const METRICS=[['opens','阅读入口点击'],['downloads','Skill下载点击'],['copies','任务书复制'],['platformOpens','目标平台打开'],['tasks','站内任务书生成'],['reported','本人确认使用']];
const CHAT=[['questions','提问'],['answered','已整理回答'],['clarifications','需补充信息'],['unmatched','未匹配资料'],['errors','回答失败'],['followups','追问'],['helpful','反馈：有帮助'],['unhelpful','反馈：还没解决'],['exports','导出对话']];
const rows=value=>Array.isArray(value)?value.filter(row=>row&&typeof row==='object'):null;
export function countValue(value){
 if(typeof value!=='number'&&(typeof value!=='string'||!/^\d+$/.test(value.trim())))return null;
 const number=Number(value);return Number.isSafeInteger(number)&&number>=0?number:null;
}
const choose=(first,second)=>countValue(first)??countValue(second);
const dateOnly=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value?value:null;
export function snapshotTime(value){
 if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))return '未提供更新时间';
 return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',dateStyle:'medium',timeStyle:'medium',hour12:false}).format(new Date(value))+'（北京时间）';
}

export function periodCounts(data,days){
 const today=dateOnly(data.today),daily=rows(data.daily);if(!today||!daily)return {visits:null,clicks:null,note:'每日记录尚未取得'};
 const start=dateOnly(data.totals?.started),lower=new Date(Date.parse(today+'T00:00:00Z')-(days-1)*86400000).toISOString().slice(0,10);
 const first=start&&start>lower?start:lower,expected=[];
 for(let time=Date.parse(first+'T00:00:00Z');time<=Date.parse(today+'T00:00:00Z');time+=86400000)expected.push(new Date(time).toISOString().slice(0,10));
 if(!expected.length)return {visits:null,clicks:null,note:'本区间没有可用的统计日期'};
 const map=new Map(daily.filter(row=>dateOnly(row.day)).map(row=>[row.day,row]));
 const sums={};for(const field of ['visits','clicks']){const values=expected.map(day=>countValue(map.get(day)?.[field]));sums[field]=values.every(value=>value!==null)?values.reduce((a,b)=>a+b,0):null;}
 const available=expected.filter(day=>map.has(day)).length;
 return {...sums,note:available===expected.length&&sums.visits!==null&&sums.clicks!==null?`${first} 至 ${today}，${expected.length}天记录`:`记录不完整：已提供${available}/${expected.length}天；缺失字段不补0`};
}

export function buildStatisticsReport(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||!['totals','usage','skillTotals','chatTotals','citationTotals'].some(key=>data[key]&&typeof data[key]==='object'))throw new Error('统计数据格式不完整');
 const usage=data.usage&&typeof data.usage==='object'?data.usage:null;
 const overview=[
  {label:'页面访问PV',value:countValue(data.totals?.visits),note:'包括刷新次数，不是独立人数'},
  {label:'预设操作点击',value:countValue(data.totals?.clicks),note:'包含部分下载和阅读点击，不重复相加'},
  {label:'全部下载点击',value:countValue(data.downloadTotals?.total),note:'网页记录的下载操作，不代表下载完成'}
 ];
 const skill=METRICS.map(([field,label])=>({label,value:field==='opens'||field==='downloads'?choose(usage?.totals?.[field],data.skillTotals?.[field]):countValue(usage?.totals?.[field]),note:field==='tasks'?'已记录的任务书生成，不等于模型执行':field==='reported'?'使用者主动登记，未经平台自动验证':field==='platformOpens'?'仅记录所选平台入口被打开':field==='downloads'?'Skill下载操作，是全部下载的部分子类':''}));
 const dimensions=[['按目标平台','byPlatform','豆包、ChatGPT/GPT等是操作时选择的目标平台；不能据此认定平台已执行。'],['按Skill类型','byCategory','按资料类型汇总，同一份统计的不同分组不能再相加。'],['按具体Skill','bySkill','缺失的历史字段显示“未取得”，不从阅读或下载次数推算使用次数。']].map(([title,key,note])=>{
  let records=rows(usage?.[key]);if(key==='bySkill'&&!records)records=rows(data.skills);
  return {title,key,note,records:records?.map(row=>({label:row.label||row.id||row.platform||row.category||'未命名条目',values:METRICS.map(([field])=>countValue(row[field]))}))??null};
 });
 const pages=rows(data.pages),pageLabel=id=>pages?.find(page=>page.page===id)?.label||id||'未指定页面';
 return {
  overview,skill,dimensions,periods:[['今天',1],['近7天',7],['近30天',30]].map(([label,days])=>({label,...periodCounts(data,days)})),
  chat:CHAT.map(([field,label])=>({label,value:countValue(data.chatTotals?.[field])})),chatStarted:dateOnly(data.chatStarted),
  citations:[{label:'本站引用复制',value:countValue(data.citationTotals?.copies)},{label:'引用文件下载点击',value:countValue(data.citationTotals?.downloads)}],citationStarted:dateOnly(data.citationTotals?.started),
  pages:pages?.map(row=>({label:row.label||row.page||'未指定页面',value:countValue(row.count)}))??null,
  actions:rows(data.actions)?.map(row=>({label:row.label||row.action||'未命名操作',value:countValue(row.count)}))??null,
  sources:rows(usage?.sources)?.map(row=>({label:pageLabel(row.page),value:countValue(row.count)}))??null,
  daily:rows(data.daily)?.filter(row=>dateOnly(row.day)&&(!dateOnly(data.totals?.started)||row.day>=data.totals.started)&&(!dateOnly(data.today)||row.day<=data.today)).sort((a,b)=>b.day.localeCompare(a.day)).map(row=>({day:row.day,visits:countValue(row.visits),clicks:countValue(row.clicks)}))??null,
  started:dateOnly(data.totals?.started),today:dateOnly(data.today),updatedAt:data.updatedAt||null,
  state:data.clientMeta?.state||'unknown',sourceLabel:data.clientMeta?.sourceLabel||'公开统计服务',lastAttempt:data.clientMeta?.lastAttempt||null,error:data.clientMeta?.error||null
 };
}

function csvCell(value){let text=String(value??'');if(typeof value==='string'&&/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function statisticsCsv(data){
 const report=buildStatisticsReport(data),range=`${report.started||'起点未提供'} 至 ${report.today||'日期未提供'}`;
 const output=[['维度','名称','指标','数量','状态','统计范围','快照更新时间','来源']];
 const add=(dimension,label,metric,value,scope=range,status=value===null?'未取得':'已记录')=>output.push([dimension,label,metric,value??'',status,scope,report.updatedAt||'',report.sourceLabel]);
 for(const metric of report.overview)add('全站累计',metric.label,'次数',metric.value);
 for(const metric of report.skill)add('Skill累计',metric.label,'次数',metric.value);
 for(const metric of report.chat)add('科研问答',metric.label,'次数',metric.value,`${report.chatStarted||'起点未提供'} 至 ${report.today||'日期未提供'}`);
 for(const metric of report.citations)add('引用操作',metric.label,'次数',metric.value,`${report.citationStarted||'起点未提供'} 至 ${report.today||'日期未提供'}`);
 for(const period of report.periods){add('访问时段',period.label,'页面访问PV',period.visits,period.note);add('访问时段',period.label,'预设操作点击',period.clicks,period.note);}
 for(const dimension of report.dimensions){if(dimension.records===null)add(dimension.title,'该维度尚未取得','',null);else if(!dimension.records.length)add(dimension.title,'本次快照无明细记录','',null,range,'无明细');else for(const row of dimension.records)METRICS.forEach(([,label],index)=>add(dimension.title,row.label,label,row.values[index]));}
 for(const [key,title,metric] of [['pages','页面分布','页面访问PV'],['actions','功能分布','预设操作点击'],['sources','任务书来源','任务书生成']]){
  if(report[key]===null)add(title,'明细尚未取得','',null);else if(!report[key].length)add(title,'本次快照无明细记录','',null,range,'无明细');else for(const row of report[key])add(title,row.label,metric,row.value);
 }
 if(report.daily===null)add('每日记录','明细尚未取得','',null);else if(!report.daily.length)add('每日记录','本次快照无明细记录','',null,range,'无明细');
 for(const row of report.daily||[]){add('每日记录',row.day,'页面访问PV',row.visits,row.day);add('每日记录',row.day,'预设操作点击',row.clicks,row.day);}
 add('外部模型实际执行','当前不可观测','执行次数',null,range,'未接入');
 output.push(['口径','访问不是独立人数；平台是所选目标；确认使用为自报；下载点击不等于完成；各类和子类不能重复相加。','','','','',report.updatedAt||'',report.sourceLabel]);
 output.push(['快照状态',report.state==='live'?'在线读取':'历史或离线快照','','','','',report.updatedAt||'',report.sourceLabel]);
 return '\uFEFF'+output.map(row=>row.map(csvCell).join(',')).join('\r\n');
}

const node=(tag,text,cls)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(cls)element.className=cls;return element;};
function section(id,title,note){const element=node('section',undefined,'surface');element.id=id;element.append(node('h2',title));if(note)element.append(node('p',note,'stats-note'));return element;}
function metricCards(items){const grid=node('div',undefined,'stats-metrics');for(const item of items){const card=node('article',undefined,'stats-metric');card.append(node('span',item.label),node('strong',formatCount(item.value)));if(item.value===null)card.classList.add('stats-missing');if(item.note)card.append(node('small',item.note));grid.append(card);}return grid;}
function table(headers,values,caption){
 const wrap=node('div',undefined,'usage-data-table'),table=node('table');if(headers.length>4)wrap.classList.add('stats-wide-table');
 const cap=node('caption',caption,'stats-sr-only'),thead=node('thead'),heading=node('tr');headers.forEach(text=>{const cell=node('th',text);cell.scope='col';heading.append(cell);});thead.append(heading);
 const tbody=node('tbody');for(const row of values){const tr=node('tr');row.forEach((value,index)=>{const cell=node(index===0?'th':'td',String(value));if(index===0)cell.scope='row';cell.dataset.label=headers[index];tr.append(cell);});tbody.append(tr);}table.append(cap,thead,tbody);wrap.append(table);return wrap;
}
function appendTableOrMessage(target,headers,records,caption){
 if(records===null)target.append(node('p','这项明细尚未取得；未以0代替。','stats-empty'));
 else if(!records.length)target.append(node('p','本次快照尚无这项明细记录。','stats-empty'));
 else target.append(table(headers,records,caption));
}
function statusText(report){
 const stamp='快照更新：'+snapshotTime(report.updatedAt);
 if(report.state==='live')return '已读取公开统计。'+stamp;
 const kind=report.state==='archive'?'归档历史快照':report.state==='cached'?'最近保存的历史快照':'统计快照';
 return `当前显示${kind}，不是本次实时次数。${stamp}。统计服务暂时不可用时，可重试；资料阅读和任务书仍可使用。`;
}

export function initUsageStatistics({read=fetchUsageStats}={}){
 const $=id=>document.getElementById(id),content=$('usageContent'),status=$('usageStatus');if(!content||!status)return;
 let snapshot=null,signature='',busy=false;
 function render(data){
  const report=buildStatisticsReport(data),nextSignature=JSON.stringify({...data,clientMeta:undefined});snapshot=data;
  if(nextSignature!==signature){
   signature=nextSignature;content.replaceChildren();
   const overview=section('usage-overview','访问与下载','以下是累计网页事件。点击包含部分阅读、下载等子类，不能把不同卡片相加作为总使用量。');overview.append(metricCards(report.overview),table(['时段','访问PV','预设点击','记录范围'],report.periods.map(row=>[row.label,formatCount(row.visits),formatCount(row.clicks),row.note]),'近期访问与操作'));content.append(overview);
   const skill=section('usage-skill','Skill使用环节','阅读、下载、复制、打开平台、生成任务书和本人确认分别记录。');skill.append(metricCards(report.skill),node('p','外部模型实际执行：未接入。所选平台与本人确认使用，不等于平台自动验证的执行记录。','usage-report-warning'));content.append(skill);
   const chat=section('usage-chat','科研问答与引用操作','问答记录的是站内资料编排和使用反馈；“已整理回答”不等于专家核验通过。');
   chat.append(table(['问答环节','记录次数'],report.chat.map(row=>[row.label,formatCount(row.value)]),'科研问答各环节'),node('p','问答统计起点：'+(report.chatStarted||'未提供'),'stats-note'),table(['引用操作','记录次数'],report.citations.map(row=>[row.label,formatCount(row.value)]),'本站引用操作'),node('p','引用统计起点：'+(report.citationStarted||'未提供')+'。这些是复制和下载操作，不是论文实际引用次数。','stats-note'));content.append(chat);
   const breakdown=section('usage-breakdown','使用分组明细','同一批使用记录可按平台、类型和Skill查看，这些分组不能重复相加。');
   for(const dimension of report.dimensions){const block=node('div',undefined,'stats-dimension');block.append(node('h3',dimension.title),node('p',dimension.note,'stats-note'));appendTableOrMessage(block,['名称',...METRICS.map(([,label])=>label)],dimension.records?.map(row=>[row.label,...row.values.map(value=>formatCount(value))])??null,dimension.title);breakdown.append(block);}content.append(breakdown);
   const distribution=section('usage-pages','来源与每日记录','来源页面说明从哪里进入或生成任务书，不能识别真实姓名、账号或独立访客。');
   for(const [key,title,label] of [['sources','任务书生成来源','已生成任务书'],['pages','页面访问分布','页面访问PV'],['actions','预设功能点击','点击次数']]){distribution.append(node('h3',title));appendTableOrMessage(distribution,['页面或功能',label],report[key]?.map(row=>[row.label,formatCount(row.value)])??null,title);}
   const daily=node('details');daily.append(node('summary','查看每日访问与点击记录'+(report.daily?'（'+report.daily.length+'天）':'')));appendTableOrMessage(daily,['日期','页面访问PV','预设点击'],report.daily?.map(row=>[row.day,formatCount(row.visits),formatCount(row.clicks)])??null,'每日访问与点击');distribution.append(daily);content.append(distribution);
  }
  const live=report.state==='live';status.textContent=statusText(report);status.dataset.state=live?'live':'historical';
  $('usageSource').textContent='数据来源：'+report.sourceLabel+'；统计起点：'+(report.started||'未提供')+'；服务统计日期：'+(report.today||'未提供')+'。';
  $('usageExport').disabled=false;
 }
 async function load(force=false){
  if(busy)return;busy=true;$('usageRefresh').disabled=true;status.textContent='正在读取公开统计…';status.dataset.state='loading';
  try{render(await read({force}));}
  catch{
   status.textContent='统计服务暂时不可用，当前次数尚未取得；可重试，资料阅读和任务书仍可使用。'+(snapshot?' 下方保留上次历史快照，更新于'+snapshotTime(snapshot.updatedAt)+'。':'');status.dataset.state='error';
   if(!snapshot){content.replaceChildren();const empty=section('usage-overview','当前统计尚未取得','未取得与0次不同。服务恢复后会显示原始统计，不根据下载或平台选择补造使用次数。');empty.append(metricCards(['页面访问PV','预设操作点击','全部下载点击','站内任务书生成','本人确认使用'].map(label=>({label,value:null}))));content.append(empty);$('usageSource').textContent='数据来源：公开统计服务；尚未成功读取快照。';}
  }finally{busy=false;$('usageRefresh').disabled=false;}
 }
 window.addEventListener('puxian:usage-data',event=>{try{render(event.detail);}catch{/* A malformed shared update cannot erase the last successful snapshot. */}});
 $('usageRefresh').onclick=()=>void load(true);
 $('usageExport').onclick=()=>{if(!snapshot)return;const anchor=node('a');anchor.href=URL.createObjectURL(new Blob([statisticsCsv(snapshot)],{type:'text/csv;charset=utf-8'}));anchor.download='普贤-完整使用统计-'+(dateOnly(snapshot.today)||'历史快照')+'.csv';anchor.dataset.puxianIgnore='true';anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1000);};
 const source=$('usageSourceLink');if(source)source.href=SERVICE;
 void load();
}
if(typeof document!=='undefined')initUsageStatistics();
