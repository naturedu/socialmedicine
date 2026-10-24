import {readReleaseCounts,mergeLiveCounts} from './release-download-counts.mjs';
const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function table(root,headers,rows){root.replaceChildren();const t=node('table'),h=node('thead'),r=node('tr');headers.forEach(x=>r.append(node('th',x)));h.append(r);t.append(h);const b=node('tbody');for(const values of rows){const row=node('tr');values.forEach(x=>row.append(node('td',x)));b.append(row);}t.append(b);root.append(t);}
const status=document.getElementById('downloadStatus'),button=document.getElementById('refreshDownloads');
const names=['socialmedicineskills.zip','skill-download-stats.zip'];let busy=false,loaded=false,snapshot,lastDescription='';
async function refresh(){if(busy)return;busy=true;button.disabled=true;status.textContent='正在读取 GitHub 下载计数…';
 try{
  try{const r=await fetch('https://raw.githubusercontent.com/naturedu/socialmedicine/main/data/skill-downloads.json',{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error();const d=await r.json();if(d.schemaVersion!==1||!Number.isSafeInteger(d.observedTotal)||!Array.isArray(d.assets)||!Array.isArray(d.daily))throw new Error();snapshot=d;}catch{/* Live counts still work without an archive. */}
  let data,description;
  try{data=mergeLiveCounts(snapshot,await readReleaseCounts('naturedu/socialmedicine',names),names);description='本次读取 '+new Date().toLocaleString('zh-CN')+'。GitHub 当前可见附件 '+data.availableTotal+' 次，包含已归档附件的观测总数 '+data.observedTotal+' 次。';}catch{if(loaded)throw new Error();if(!snapshot)throw new Error();data=snapshot;description='实时计数读取失败；显示归档快照 '+snapshot.updatedAt+'，不是最新数据。';}
  const metrics=document.getElementById('downloadMetrics');metrics.replaceChildren();for(const[name,count]of Object.entries(data.byPackage)){const card=node('article');card.className='entry';card.append(node('span',name),node('strong',count.toLocaleString('zh-CN')),node('small','已观测附件累计下载次数'));metrics.append(card);}
  table(document.getElementById('downloadAssets'),['版本','安装包','GitHub 计数','附件状态'],data.assets.map(a=>[a.tag,a.name,a.downloadCount,a.available?'当前可下载':'已不可见；保留最后值']));
  table(document.getElementById('downloadHistory'),['归档日期（UTC）','归档观测总数','较上一归档增加'],(snapshot?.daily||[]).slice().reverse().map(d=>[d.day,d.observedTotal,d.increaseSincePreviousRecord===null?'首次基线':d.increaseSincePreviousRecord]));
  status.textContent=description;lastDescription=description;loaded=true;
 }catch{status.textContent=loaded?'本次读取失败；以下保留上次成功读取的数据。'+lastDescription:'尚未取得下载计数；不以 0 代替缺失数据。可查看发布包和原始记录。';}finally{busy=false;button.disabled=false;}}
button.addEventListener('click',refresh);void refresh();
