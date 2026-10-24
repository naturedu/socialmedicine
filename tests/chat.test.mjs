import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeReply,chooseIntent,metricSnapshot} from '../chat-core.mjs';
const json=async name=>JSON.parse(await readFile(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const data={methods:await json('studio-methods'),methodGuide:await json('method-guide'),schools:await json('research-schools'),datasets:await json('research-datasets'),library:await json('research-knowledge')};
test('method conversation preserves method context and filters requested code language',()=>{
 const first=makeReply('DID 和断点回归怎么选择？',{},data);assert.equal(first.status,'answered');assert.equal(first.sections.length,2);
 const second=makeReply('给我 R 代码示例',first.state,data);assert.ok(second.codes.length>=2);assert.ok(second.codes.every(c=>c.lang==='r'));assert.ok(second.codes.some(c=>c.heading.includes('2×2 DID')));
 const variables=makeReply('需要收集哪些变量？',first.state,data);assert.ok(variables.sections[0].items[0].includes('首次接受政策'));
 const different=makeReply('中山大学有哪些研究方向？',second.state,data);assert.equal(different.state.kind,'schools');assert.ok(different.sections.every(s=>s.heading.includes('中山大学')));
});
test('research advice does not turn cross-sectional data into causal evidence',()=>{
 const r=makeReply('我只有横断面数据，想评估政策因果效果',{},data);assert.match(r.title,/关联/);assert.ok(r.sections[0].items.some(s=>s.includes('不能识别')));
 const follow=makeReply('我有多期面板数据',r.state,data);assert.match(follow.title,/DID/);assert.ok(follow.sections[0].items.some(s=>s.includes('若无对照')));
});
test('unmatched questions produce no invented answer or citation',()=>{const r=makeReply('火星上的咖啡店今天营业吗？',{},data);assert.equal(r.status,'unmatched');assert.equal(r.sources.length,0);});
test('named school and project answers retain original sources and status',()=>{
 const r=makeReply('中山大学和南方医科大学有哪些方向？',{},data);assert.equal(r.sections.length,3);assert.ok(r.sources.every(s=>s.url.startsWith('https://')));
 const p=makeReply('找2025年教育部养老项目',{},data);assert.equal(p.status,'answered');assert.equal(p.sections?.length||0,0);assert.ok(p.sources.some(s=>s.url==='grants.html#moe'));assert.match(p.paragraphs[0],/不是全国全部/);
});
test('header uses missing-data markers and distinct download total',()=>{assert.deepEqual(metricSnapshot({totals:{visits:5,clicks:9},skillTotals:{downloads:2}}),{visits:5,clicks:9,downloads:null,chat:null,updatedAt:null});assert.equal(metricSnapshot({downloadTotals:{total:4}}).downloads,4);});
