import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {filterRecords,summarizeRecords,safeURL,csvCell} from '../topic-analysis.mjs';
import {chooseIntent,makeReply} from '../chat-core.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const publicTopics=read('public-topic-records'),publicAnalysis=read('public-topic-analysis'),records=publicTopics.records;
test('collection filters preserve disjoint main and related journals and single-paper identity',()=>{
 const main=filterRecords(records,{collection:'cns',subset:'主刊'}),related=filterRecords(records,{collection:'cns',subset:'相关期刊'});
 assert.equal(main.length,55);assert.equal(related.length,10);assert.ok(main.every(r=>['Nature','Science','Cell'].includes(r.journal)));
 assert.equal(filterRecords(records,{collection:'cns',query:'10.1016/j.cell.2020.01.021'}).length,1);
 assert.equal(filterRecords(records,{collection:'gates',subset:'中国相关健康政策管理（2016—2025）'}).length,192);
});
test('book reviews remain searchable while excluded from topic denominators',()=>{
 const rows=filterRecords(records,{collection:'management'}),s=summarizeRecords(rows);
 assert.equal(s.total,36);assert.equal(s.analyzed,29);assert.equal(s.excluded,7);assert.equal(s.topics.reduce((a,b)=>a+b.count,0),29);
 assert.equal(filterRecords(records,{collection:'management',subset:'书评线索'}).length,7);
 assert.equal(summarizeRecords([]).topics.length,0);
});
test('public exports and source links reject formula and script injection',()=>{
 assert.equal(safeURL('javascript:alert(1)'),null);assert.equal(safeURL('https://doi.org/10.1234/test'),'https://doi.org/10.1234/test');
 assert.equal(csvCell('=IMPORTXML("x")'),'"\'=IMPORTXML(""x"")"');
});
test('chat routes these public collections to grounded analysis without hijacking writing',()=>{
 assert.equal(chooseIntent('盖茨基金有哪些主题？').kind,'publicTopics');assert.equal(chooseIntent('管理世界文章帮我润色').kind,'writing');
 for(const q of ['盖茨基金有哪些主题？','CNS的主题','管理世界研究主题']){
  const r=makeReply(q,{}, {publicTopics,publicAnalysis});assert.equal(r.status,'answered');assert.ok(r.sources[0].url=== 'gates-grants.html'||r.sources[0].url.startsWith('topic-analysis.html#'));assert.ok(r.sections[1].items.length);
 }
 assert.equal(makeReply('盖茨基金有哪些主题？',{},{}).status,'clarify');
});
