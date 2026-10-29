import {readReleaseCounts,mergeLiveCounts} from './release-download-counts.mjs';
import {fetchUsageStats,formatCount} from './usage-client.mjs?v=20261029complete1';

const packageName='socialmedicineskills.zip';
const format=formatCount;
const date=value=>new Date(value).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
const packageStatus=document.querySelector('[data-socialmedicine-package-status]');
const usageStatus=document.querySelector('[data-socialmedicine-usage-status]');
const refresh=document.getElementById('refreshSocialmedicineSkillCounts');
let packageBusy=false,usageBusy=false,lastPackage=null,lastUsage=null,timer;

function render(selector,value,title){
 for(const node of document.querySelectorAll(selector)){
  node.textContent=format(value);if(title)node.title=title;
 }
}
function packageCount(data){
 const value=data?.byPackage?.[packageName];
 if(!Number.isSafeInteger(value)||value<0)throw new Error('Package counter unavailable');
 return value;
}
async function readPackages(){
 if(packageBusy)return;packageBusy=true;
 if(packageStatus)packageStatus.textContent='正在读取安装包下载数…';
 let archive;
 try{
  try{
   const r=await fetch('data/skill-downloads.json',{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw new Error();const data=await r.json();
   if(data.repository!=='naturedu/socialmedicine'||data.schemaVersion!==1||!Array.isArray(data.assets)||!Number.isFinite(Date.parse(data.updatedAt)))throw new Error();
   packageCount(data);archive=data;
  }catch{/* A live GitHub response can still supply the counter. */}
  let count,description;
  try{
   const current=await readReleaseCounts('naturedu/socialmedicine',[packageName]);
   if(!current.length&&!archive?.assets.some(x=>x.name===packageName))throw new Error();
   count=packageCount(mergeLiveCounts(archive,current,[packageName]));
   description=`GitHub Release 附件累计下载；${date(Date.now())} 读取。`;
  }catch{
   if(lastPackage)throw new Error();
   if(!archive)throw new Error();count=packageCount(archive);
   description=`GitHub 暂不可读；显示 ${date(archive.updatedAt)} 的归档快照。`;
  }
  lastPackage={count,description};render('[data-socialmedicine-downloads]',count,description);
  if(packageStatus)packageStatus.textContent=description;
 }catch{
  const description=lastPackage?`本次刷新失败，保留上次值。${lastPackage.description}`:'安装包计数暂不可用，未以 0 代替。';
  if(packageStatus)packageStatus.textContent=description;
  for(const node of document.querySelectorAll('[data-socialmedicine-downloads]'))node.title=description;
 }finally{packageBusy=false;}
}
async function readUsage({force=false}={}){
 if(usageBusy)return;usageBusy=true;
 try{
  const raw=await fetchUsageStats({force});
  if(!Number.isFinite(Date.parse(raw.updatedAt)))throw new Error();
  const row=raw.usage?.bySkill?.find(x=>x.id==='socialmedicineskills')||raw.skills?.find(x=>x.id==='socialmedicineskills');
  const data={opens:row?.opens,downloadClicks:row?.downloads};
  const description=raw.clientMeta?.state==='cached'
   ?`统计服务暂不可读；网页打开与下载点击显示 ${date(raw.updatedAt)} 的历史快照，不是最新数据。`
   :`网页打开与下载点击；${date(raw.updatedAt)} 更新。`;
  lastUsage={...data,description};render('[data-socialmedicine-opens]',data.opens,description);
  render('[data-socialmedicine-clicks]',data.downloadClicks,description);
  if(usageStatus)usageStatus.textContent=description;
 }catch{
  if(usageStatus)usageStatus.textContent=lastUsage?`本次刷新失败，保留上次值。${lastUsage.description}`:'网页使用计数暂不可用，未以 0 代替。';
 }finally{usageBusy=false;}
}
async function refreshAll({force=false}={}){
 if(refresh)refresh.disabled=true;
 try{await Promise.allSettled([readPackages(),readUsage({force})]);}
 finally{if(refresh)refresh.disabled=false;}
}
if(document.querySelector('[data-socialmedicine-downloads]')){
 void refreshAll();refresh?.addEventListener('click',()=>refreshAll({force:true}));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshAll();});
 window.addEventListener('puxian:tracked',()=>{clearTimeout(timer);timer=setTimeout(()=>readUsage(),1800);});
}
