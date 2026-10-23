import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {buildPlan,search,matchSchools,writingAudit} from '../studio-core.mjs';
import {inferGoal,buildGoal,goalText} from '../studio-goals.mjs';
const root=new URL('../',import.meta.url);
const json=async name=>JSON.parse(await readFile(new URL('data/'+name+'.json',root),'utf8'));

test('causal designs do not upgrade cross-sectional or unknown data to DID',()=>{
 for(const data of ['cross','unknown','cohort']){
  const p=buildPlan({question:'医保支付政策改变了服务利用吗？',goal:'causal',data,journal:'jama'},[]);
  assert.match(p.design,/关联分析/);assert.equal(p.evidence.length,0);
 }
 const p=buildPlan({question:'医保政策改变基层就医了吗',goal:'causal',data:'panel'},[]);
 assert.match(p.design,/DID/);assert.ok(p.assumptions.some(s=>s.includes('不能直接采用 DID')));
});
test('search filters sources and returns no fabricated matches',()=>{
 const rows=[{id:'a',title:'Medicare insurance policy',text:'cost',journal:'JAMA Health Forum'},{id:'b',title:'医保政策',text:'数据',journal:'本地PDF'}];
 assert.equal(search(rows,'医保',{journal:'JAMA'})[0].id,'a');
 assert.equal(search(rows,'zebraxyz').length,0);
 assert.deepEqual(search(rows,'',{journal:'本地PDF'}).map(x=>x.id),['b']);
});
test('admissions matching respects route without ranking-based probabilities',async()=>{
 const schools=await json('research-schools');
 const input={interest:'卫生经济 医保',major:'公共卫生',route:'内地',methods:'R'};
 const found=matchSchools(schools,input);assert.ok(found.length);
 assert.ok(found.every(m=>m.route==='内地'));
 assert.deepEqual(matchSchools(schools,{...input,rank:1}),matchSchools(schools,{...input,rank:90}));
});
test('goal routing separates dissertation, admission and methods, with explicit override',()=>{
 assert.equal(inferGoal('博士毕业设计中使用机器学习'),'thesis');
 assert.equal(inferGoal('我想申请博士'),'phd');
 assert.equal(inferGoal('我想学 microsimulation'),'method');
 assert.equal(inferGoal('保研面试准备'),'admission');
 assert.equal(inferGoal('帮我做一次工作坊'),'custom');
 const p=buildGoal({target:'申请博士',type:'method',weeks:2},[]);
 assert.equal(p.id,'method');assert.ok(p.phases.every(s=>!s.schedule.includes('第 0')));
 assert.match(goalText(p),/不编造文献/);assert.match(goalText(p),/尚未提供/);
});
test('writing audit preserves uncertainty and checks causal language',()=>{
 assert.ok(writingAudit('Our results prove that the policy causes a significant reduction.').some(s=>s.includes('因果')));
 assert.ok(writingAudit('A significant reduction was observed.').some(s=>s.includes('区间')));
});
test('public record IDs and method skill links are valid',async()=>{
 const library=await json('studio-library');
 assert.equal(new Set(library.map(r=>r.id)).size,library.length);
 for(const r of library){assert.ok(r.title);assert.equal(typeof r.text,'string');}
 for(const m of await json('research-schools'))assert.equal(m.mentors,undefined);
 for(const m of await json('studio-methods')){await access(new URL(m.url,root));assert.ok(m.codes.length);}
 const j=await json('studio-journals');assert.equal(j.length,3);assert.match(j.find(x=>x.id==='jama').review,/43/);
});
test('homepage labels and built-in asset links resolve',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8');
 assert.equal(html,await readFile(new URL('research-studio.html',root),'utf8'));
 assert.ok(html.includes('id="learningForm"'));assert.ok(html.includes('id="journalMetrics"'));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const [,href]of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!/^[a-z][a-z0-9+.-]*:/i.test(href))await access(new URL(href.split('#')[0],root));
});
