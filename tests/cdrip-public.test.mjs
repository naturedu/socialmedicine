import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {makeReply,chooseIntent} from '../chat-core.mjs';
import {CDRIP,searchPublicInfo} from '../cdrip-catalogue.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('database discovery returns the verified citation and contact without loading policy data',()=>{
 for(const q of ['CDRIP2026','政策文本数据库','如何引用 DRG/DIP 数据库','中国 DRGs 政策文本数据库']){
  const r=makeReply(q);
  assert.equal(r.state.kind,'cdrip');assert.equal(r.status,'answered');
  const text=JSON.stringify(r);assert.match(text,/杜思娴/);assert.match(text,/dusixian@hust.edu.cn/);assert.match(text,/18217878646/);assert.match(text,/23720911/);assert.doesNotMatch(text,/23720861/);
  assert.ok(r.sources.some(s=>s.url==='cdrip2026.html'));
 }
});
test('citation follow-ups retain context while unrelated research still routes normally',()=>{
 const prev=makeReply('CDRIP2026').state;
 assert.equal(chooseIntent('怎么引用？',prev).kind,'cdrip');
 assert.notEqual(chooseIntent('CHARLS 数据库怎么申请',prev).kind,'cdrip');
 assert.notEqual(chooseIntent('我有医院面板数据，想用 DID 评估 DRG 政策效果').kind,'cdrip');
});
test('public search finds citations and authors, with a real empty state for policy numbers',()=>{
 assert.ok(searchPublicInfo('引用').some(x=>x.href==='#citation'));
 assert.ok(searchPublicInfo('杜思娴').some(x=>x.href==='#contact'));
 assert.ok(searchPublicInfo('地图').some(x=>x.href==='#map'));
 assert.equal(searchPublicInfo('医保发〔2025〕18号').length,0);
});
test('HTML, structured metadata and downloadable citations use one identity',async()=>{
 const html=await read('cdrip2026.html');
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)<\/script>/)[1]);
 assert.equal(schema.identifier,CDRIP.url);assert.equal(schema.creator.email,CDRIP.email);
 assert.equal(schema.creator.telephone,'+86-'+CDRIP.telephone);
 assert.match(html,/试点城市分布/);assert.match(html,/已核验部分/);
 for(const filename of ['citation.bib','citation.ris','CITATION.cff']){
  const text=await read('assets/cdrip2026/'+filename);assert.ok(text.includes(CDRIP.doi));assert.ok(!text.includes('23720861'));
 }
 assert.equal((await read('assets/cdrip2026/citation.ris')).match(/^TY  -/gm).length,1);
});
test('public assets have no raw database export and catalogues expose only one project record',async()=>{
 assert.deepEqual((await readdir(new URL('../assets/cdrip2026/',import.meta.url))).sort(),['CITATION.cff','citation.bib','citation.ris','pilot-cities.png'].sort());
 const rows=JSON.parse(await read('data/cdrip-public.json'));assert.equal(rows.length,1);
 assert.equal(rows[0].id,'cdrip2026');
 for(const file of ['cdrip2026.html','cdrip2026.mjs','cdrip-catalogue.mjs','data/cdrip-public.json']){
  const s=await read(file);assert.doesNotMatch(s,/const\s+DATA\s*=|"doc_id"|"document_number"|"verify_note"|23720861|\.xlsx|交付包V8_1030\.zip/);
 }
 for(const file of ['index.html','research-studio.html'])assert.match(await read(file),/href="cdrip2026.html"/);
 const index=JSON.parse(await read('data/material-index.json'));assert.ok(index.records.some(x=>x.url==='cdrip2026.html'));
});
