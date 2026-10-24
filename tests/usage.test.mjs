import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeUsage,usageCsv,socialmedicineSkillUsage} from '../usage-core.mjs';
const snapshot={today:'2026-10-23',updatedAt:'2026-10-23T04:48:06Z',totals:{visits:7,clicks:0,started:'2026-10-23'},daily:[{day:'2026-10-15',visits:0,clicks:0},{day:'2026-10-23',visits:7,clicks:0}],skillTotals:{opens:0,downloads:0},pages:[{page:'home',label:'首页',count:4}],skills:[{id:'did-skill',label:'DID',opens:0,downloads:0}],actions:[]};
test('summary distinguishes an undefined denominator and allows repeated clicks per visit',()=>{
 assert.equal(summarizeUsage(snapshot).perHundred,0);
 assert.equal(summarizeUsage({...snapshot,totals:{...snapshot.totals,visits:0}}).perHundred,null);
 assert.equal(summarizeUsage({...snapshot,totals:{...snapshot.totals,clicks:14}}).perHundred,200);
 assert.throws(()=>summarizeUsage({...snapshot,totals:{visits:null,clicks:0}}));
});
test('rolling windows use calendar days and exclude future records',()=>{
 const s=summarizeUsage({...snapshot,daily:[...snapshot.daily,{day:'2026-10-17',visits:3,clicks:2},{day:'2026-10-16',visits:6,clicks:3},{day:'2026-10-24',visits:100,clicks:10}]});
 assert.equal(s.today.visits,7);assert.equal(s.week.visits,10);assert.equal(s.month.visits,16);
});
test('CSV preserves Unicode, neutralizes spreadsheet formulas and excludes pre-collection history',()=>{
 const csv=usageCsv({...snapshot,pages:[{label:'=HYPERLINK("x")',count:4}]});
 assert.ok(csv.startsWith('\ufeff'));assert.match(csv,/'=HYPERLINK/);assert.match(csv,/Skill下载点击/);assert.doesNotMatch(csv,/2026-10-15/);assert.match(csv,/下载点击不等于下载完成/);
});

test('the main social medicine skill is counted separately and absence is not zero',()=>{
 const data={...snapshot,skills:[{id:'did-skill',opens:100,downloads:90},{id:'socialmedicineskills',label:'社医卫管方法总手册',opens:7,downloads:3}]};
 assert.deepEqual(socialmedicineSkillUsage(data),{opens:7,downloadClicks:3});
 assert.deepEqual(socialmedicineSkillUsage(snapshot),{opens:null,downloadClicks:null});
 assert.deepEqual(socialmedicineSkillUsage({skills:[{id:'socialmedicineskills',opens:0,downloads:0}]}),{opens:0,downloadClicks:0});
 assert.throws(()=>socialmedicineSkillUsage({skills:[{id:'socialmedicineskills',opens:null,downloads:1}]}));
 assert.match(usageCsv(data),/社会医学主技能/);
});
