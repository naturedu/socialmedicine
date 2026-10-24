import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {makeReply,chooseIntent} from '../chat-core.mjs';
import {detectJournals,journalMatches} from '../journal-profiles.mjs';
import {createEditingPrompt} from '../research-polishing.mjs';
import {search} from '../studio-core.mjs';
const read=async p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const json=async n=>JSON.parse(await read('data/'+n+'.json'));
const data={library:await json('research-knowledge'),methods:await json('studio-methods'),methodGuide:await json('method-guide'),journals:await json('studio-journals')};
test('merged records preserve every original public text and its locator',async()=>{
 const titles=new Set(),dois=new Set();
 for(const r of data.library){assert.ok(!titles.has(r.title));titles.add(r.title);if(r.doi){assert.ok(!dois.has(r.doi));dois.add(r.doi);}}
 for(const name of ['studio-library','library'])for(const original of await json(name)){
  const merged=data.library.find(r=>r.origins.some(o=>o.collection===name&&o.id===String(original.id)));
  assert.ok(merged,original.title);
  if(original.text){assert.ok(merged.text.includes(original.text));assert.ok(merged.segments.some(s=>s.text===original.text&&s.locator===original.locator));}
 }
 for(const [profile,count] of [['management',36],['nature_main',21],['science_main',31]])assert.equal(data.library.filter(r=>journalMatches(r.journal,profile)).length,count);
});
test('main journals stay separate from their family journals and unverified metrics',()=>{
 assert.deepEqual(detectJournals('Nature Health'),['nature_health']);assert.deepEqual(detectJournals('Science Advances'),[]);
 assert.deepEqual(detectJournals('n和s的论文'),['nature_main','science_main']);
 for(const name of ['Nature','Science']){
  const reply=makeReply('找'+name+'的论文？',{},data);assert.equal(reply.status,'answered');assert.ok(reply.sections.every(s=>s.items[0].startsWith(name+' ·')));
  const filtered=search(data.library,'',{journal:name,exactJournal:true,limit:100});assert.ok(filtered.every(r=>r.journal===name));
  assert.equal(makeReply(name+'的审稿周期与分区',{},data).status,'unmatched');
 }
 assert.equal(makeReply('找 Nature 和 Science 的健康政策论文',{},data).status,'answered');
});
test('writing actually changes with the journal and keeps factual boundaries',()=>{
 const management=createEditingPrompt('收入增加 3.5% [1]','管理世界');assert.match(management,/制度与管理问题/);assert.match(management,/3.5% \[1\]/);
 const nature=createEditingPrompt('Our estimate was 0.2.','Nature（主刊）');assert.match(nature,/跨学科/);assert.doesNotMatch(nature,/制度与管理问题/);
 const science=makeReply('按 Science 审读论文',{},data);assert.equal(science.state.kind,'writing');assert.ok(science.sections.some(s=>s.heading.includes('Science（主刊）')));
 assert.ok(science.paragraphs.some(p=>p.includes('没有调用')));
});
test('SP and implementation conversations return their methods, variables and language-specific code',()=>{
 for(const [question,id,variable] of [['模拟标准化病人怎么设计','standardized-patient-skill','扮演者'],['CFIR与RE-AIM怎么用','implementation-science-skill','分母']]){
  const first=makeReply(question,{},data);assert.equal(first.status,'answered');assert.ok(first.state.methodIds.includes(id));
  const vars=makeReply('需要收集哪些变量？',first.state,data);assert.ok(vars.sections.some(s=>s.items.join(' ').includes(variable)));
  for(const lang of ['R','Stata']){const next=makeReply('给我 '+lang+' 代码示例',first.state,data);assert.equal(next.codes.length,1);assert.equal(next.codes[0].lang,lang.toLowerCase());}
 }
 assert.equal(chooseIntent('用实施科学做博士毕业设计').kind,'goal');
});
test('new source, guide, dictionary and execution records resolve',async()=>{
 for(const m of data.methods.filter(m=>/standardized-patient|implementation-science/.test(m.id))){
  const guide=await read(m.url);assert.match(guide,/data-dictionary.csv/);assert.match(guide,/Stata(?:为|\s*)未执行/);
  for(const match of guide.matchAll(/href="([^"#]+)"/g))if(!/^https?:/.test(match[1]))await access(new URL('../'+m.url.replace(/[^/]+$/,'')+match[1],import.meta.url));
 }
 for(const row of (await json('sp-implementation-validation')).scripts){
  const text=(await read(row.script)).replace(/\r\n/g,'\n');assert.equal(createHash('sha256').update(text).digest('hex'),row.sha256);
  assert.equal(row.status,row.script.endsWith('.R')?'passed':'not_run');
 }
});
test('legacy catalogue uses the same methods and codes; school UI keeps teachers hidden',async()=>{
 const bundle=JSON.parse((await read('assets/catalog.js')).replace(/^window.SM = /,'').replace(/;\s*$/,''));
 for(const name of ['methods','code-library','tools'])assert.deepEqual(bundle[name],await json(name));
 const studio=await read('studio.mjs');assert.ok(studio.includes('skills|data|guides'));assert.doesNotMatch(studio,/<puxian-mentors/);
 assert.doesNotMatch(await read('research-resources.mjs'),/createElement\('puxian-mentors'\)/);
});
