import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {countValue,periodCounts,buildStatisticsReport,statisticsCsv,snapshotTime,initUsageStatistics} from '../usage-statistics.mjs';

const snapshot={
 today:'2026-10-29',updatedAt:'2026-10-29T03:00:00Z',totals:{visits:1234567,clicks:43210,started:'2026-10-28'},
 daily:[{day:'2026-10-28',visits:20,clicks:8},{day:'2026-10-29',visits:30,clicks:10}],
 downloadTotals:{total:321},skillTotals:{opens:16,downloads:8},
 usage:{totals:{opens:21,downloads:9,copies:7,platformOpens:6,tasks:5,reported:0},byPlatform:[{label:'豆包',opens:10,downloads:2,copies:4,platformOpens:3,tasks:2,reported:0}],byCategory:[],bySkill:[{label:'DID',opens:10,downloads:1,copies:1,platformOpens:2,tasks:3,reported:0}],sources:[{page:'methods',count:5}]},
 chatStarted:'2026-10-28',chatTotals:{questions:9,answered:4,clarifications:2,unmatched:1,errors:2,followups:3,helpful:2,unhelpful:0,exports:1},
 citationTotals:{copies:11,downloads:12,started:'2026-10-29'},pages:[{page:'methods',label:'方法库',count:12}],actions:[{action:'download',label:'下载',count:6}],
 clientMeta:{state:'live',sourceLabel:'公开统计服务',lastAttempt:'2026-10-29T03:00:00Z'}
};

test('missing, invalid and unsafe counts stay distinct from recorded zero',()=>{
 for(const value of [null,undefined,'','  ',false,[],{},-1,Infinity,NaN,1.2,'1.2','0x10','1e3',Number.MAX_SAFE_INTEGER+1])assert.equal(countValue(value),null,String(value));
 assert.equal(countValue(0),0);assert.equal(countValue('0'),0);assert.equal(countValue(' 1234567 '),1234567);
 assert.equal(snapshotTime(null),'未提供更新时间');assert.match(snapshotTime(snapshot.updatedAt),/北京时间/);
});

test('report retains every supported measure without treating targets or self-reports as executions',()=>{
 const report=buildStatisticsReport(snapshot);
 assert.deepEqual(report.overview.map(row=>row.value),[1234567,43210,321]);
 assert.deepEqual(report.skill.map(row=>row.value),[21,9,7,6,5,0]);
 assert.deepEqual(report.chat.map(row=>row.value),[9,4,2,1,2,3,2,0,1]);
 assert.deepEqual(report.citations.map(row=>row.value),[11,12]);
 assert.deepEqual(report.sources,[{label:'方法库',value:5}]);
 assert.deepEqual(report.dimensions[0].records[0].values,[10,2,4,3,2,0]);
 assert.match(report.dimensions[0].note,/不能据此认定平台已执行/);
 assert.match(report.skill[5].note,/主动登记/);
 assert.equal(report.state,'live');assert.equal(report.updatedAt,snapshot.updatedAt);
 assert.throws(()=>buildStatisticsReport({error:'database unavailable'}));
});

test('legacy snapshots retain known reads and downloads while new fields remain unavailable',()=>{
 const legacy={totals:{visits:10,clicks:0},skillTotals:{opens:4,downloads:0},skills:[{id:'did-skill',label:'DID',opens:4,downloads:0}]};
 const report=buildStatisticsReport(legacy);
 assert.deepEqual(report.skill.map(row=>row.value),[4,0,null,null,null,null]);
 assert.equal(report.overview[2].value,null);assert.equal(report.citations[0].value,null);
 assert.deepEqual(report.dimensions[2].records[0].values,[4,0,null,null,null,null]);
 assert.equal(report.dimensions[0].records,null);assert.equal(report.pages,null);
 assert.equal(buildStatisticsReport(snapshot).dimensions[1].records.length,0);
});

test('calendar periods exclude future records and never fill missing days or fields with zero',()=>{
 assert.deepEqual(periodCounts(snapshot,7),{visits:50,clicks:18,note:'2026-10-28 至 2026-10-29，2天记录'});
 const sparse={...snapshot,daily:[snapshot.daily[1],{day:'2026-10-30',visits:999,clicks:999}]};
 assert.equal(periodCounts(sparse,7).visits,null);assert.match(periodCounts(sparse,7).note,/1\/2天/);
 assert.equal(periodCounts(sparse,1).visits,30);
 assert.equal(periodCounts({...snapshot,daily:[snapshot.daily[0],{day:'2026-10-29',visits:30}]},7).clicks,null);
 assert.deepEqual(buildStatisticsReport(sparse).daily.map(row=>row.day),['2026-10-29']);
 assert.equal(periodCounts({...snapshot,today:'2026-02-30'},1).visits,null);
});

test('CSV preserves full numbers, all dimensions, source/time and unavailable-vs-zero semantics',()=>{
 const data={...snapshot,clientMeta:{...snapshot.clientMeta,state:'cached',sourceLabel:'历史快照'},pages:[{label:'=HYPERLINK("x")',count:0}],usage:{...snapshot.usage,totals:{...snapshot.usage.totals,tasks:null}}};
 const csv=statisticsCsv(data);
 assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/"1234567"/);assert.doesNotMatch(csv,/1\.2M/);
 for(const text of ['全部下载点击','任务书复制','目标平台打开','站内任务书生成','本人确认使用','科研问答','本站引用复制','按目标平台','按Skill类型','按具体Skill','任务书来源','每日记录'])assert.ok(csv.includes(text),text);
 assert.match(csv,/"站内任务书生成","次数","","未取得"/);
 assert.match(csv,/"本人确认使用","次数","0","已记录"/);
 assert.match(csv,/"外部模型实际执行","当前不可观测","执行次数","","未接入"/);
 assert.match(csv,/'=HYPERLINK\(""x""\)/);assert.match(csv,/2026-10-29T03:00:00Z/);assert.match(csv,/历史或离线快照/);assert.match(csv,/历史快照/);
});

class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.dataset={};this.classList={add:()=>{}};this.text='';this.replacements=0;}
 set textContent(value){this.text=String(value);this.children=[];}
 get textContent(){return this.text+this.children.map(child=>child.textContent).join('');}
 append(...children){this.children.push(...children);}
 replaceChildren(...children){this.text='';this.children=children;this.replacements++;}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('page handles unavailable data, forced retries, history metadata and duplicate shared updates',async()=>{
 const ids=Object.fromEntries(['usageContent','usageStatus','usageSource','usageExport','usageRefresh','usageSourceLink'].map(id=>[id,new Element()]));ids.usageExport.disabled=true;
 const listeners={},calls=[];let next=new Error('HTTP 503');
 const originalDocument=globalThis.document,originalWindow=globalThis.window;
 globalThis.document={getElementById:id=>ids[id],createElement:tag=>new Element(tag)};
 globalThis.window={addEventListener:(type,listener)=>{listeners[type]=listener;}};
 try{
  initUsageStatistics({read:async options=>{calls.push(options);if(next instanceof Error)throw next;return next;}});await tick();
  assert.deepEqual(calls,[{force:false}]);assert.equal(ids.usageStatus.dataset.state,'error');
  assert.match(ids.usageStatus.textContent,/统计服务暂时不可用/);assert.match(ids.usageContent.textContent,/未取得/);assert.equal(ids.usageExport.disabled,true);
  next=snapshot;ids.usageRefresh.onclick();await tick();assert.deepEqual(calls[1],{force:true});
  assert.equal(ids.usageStatus.dataset.state,'live');assert.equal(ids.usageExport.disabled,false);assert.match(ids.usageContent.textContent,/1,234,567/);
  const renders=ids.usageContent.replacements;
  listeners['puxian:usage-data']({detail:snapshot});assert.equal(ids.usageContent.replacements,renders);
  const cached={...snapshot,clientMeta:{state:'cached',sourceLabel:'上次成功读取的公开汇总',error:'HTTP 503'}};
  listeners['puxian:usage-data']({detail:cached});assert.equal(ids.usageContent.replacements,renders);
  assert.equal(ids.usageStatus.dataset.state,'historical');assert.match(ids.usageStatus.textContent,/不是本次实时次数/);assert.match(ids.usageStatus.textContent,/2026年10月29日/);assert.match(ids.usageSource.textContent,/上次成功读取/);
  listeners['puxian:usage-data']({detail:{error:'bad response'}});assert.equal(ids.usageContent.replacements,renders);
  next=new Error('HTTP 503');ids.usageRefresh.onclick();await tick();assert.match(ids.usageStatus.textContent,/保留上次历史快照/);assert.equal(ids.usageContent.replacements,renders);
 }finally{
  if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
  if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
 }
});

test('detail page supplies labelled mobile rows and accurately states server recording boundaries',async()=>{
 const html=await readFile(new URL('../usage-statistics.html',import.meta.url),'utf8');
 assert.match(html,/@media\(max-width:760px\)/);assert.match(html,/content:attr\(data-label\)/);assert.match(html,/table-layout:fixed/);
 assert.doesNotMatch(html,/min-width:\s*(?:6\d\d|7\d\d)px/);
 assert.match(html,/未记录的操作不自动补入统计/);assert.match(html,/显示“未接入”，不记作0/);
 assert.match(html,/下载完整统计CSV/);assert.match(html,/aria-live="polite"/);
});
