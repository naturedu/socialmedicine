import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {filterProjects,frequencies,cooccurrences,csvText,mechanicalPair} from '../nssfc-analysis-core.mjs';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8'),json=async p=>JSON.parse(await read(p));
test('approved-only records have unique identities and locatable official evidence',async()=>{
 const rows=await json('data/nssf-projects.json'),sources=await json('data/nssfc-source-files.json'),stats=await json('data/nssfc-analysis.json');
 assert.equal(rows.length,stats.projects);assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);assert.ok(rows.length>4000);
 assert.equal(rows.filter(r=>r.project_code).length,stats.withCode);assert.equal(rows.filter(r=>r.health_core).length,stats.healthProjects);
 for(const r of rows){assert.equal(r.approval_status,'approved');assert.equal(r.state,'正式立项名单');assert.doesNotMatch(r.status,/公示|待核/);assert.match(r.notice,/^https?:\/\//);assert.ok(r.locator);assert.ok(r.scope_groups.length);assert.ok(r.topics.length);const s=sources.find(x=>x.key===r.source_id);assert.ok(s);assert.equal(r.source.split('#')[0],s.url);assert.match(s.sha256,/^[a-f0-9]{64}$/);assert.match(s.source_level,/官网/);assert.doesNotMatch(r.title,/_x000D_/);}
 assert.ok(rows.some(r=>r.project_code==='20BGL271'&&r.title.includes('疾控')));
 assert.ok(!rows.some(r=>r.project_code==='23BJY246')); // generic market health is outside the declared field.
 assert.ok(!rows.some(r=>r.title==='推动平台经济创新和健康发展研究'));
 assert.ok(rows.some(r=>r.project_code==='24ASH013'&&r.health_core)); // genuine population health development remains.
});
test('coverage conserves records and national annual denominators without treating missing as zero',async()=>{
 const rows=await json('data/nssf-projects.json'),{coverage,batches}=await json('data/nssfc-coverage.json'),stats=await json('data/nssfc-analysis.json');
 const national=[3917,4289,4506,4627,4625,4642,4675,4790,5138,5254];
 for(let i=0;i<10;i++){const c=coverage.find(c=>c.year===2016+i);assert.equal(c.annualTotal,national[i]);assert.equal(c.selectedRows,rows.filter(r=>+r.date===c.year).length);}
 assert.equal(coverage.at(-1).annualTotal,null);assert.equal(stats.annual.at(-1).domainProjects,null);assert.ok(rows.filter(r=>r.date==='2026').every(r=>r.program==='重大专项'));
 assert.equal(batches.reduce((n,b)=>n+b.selectedRows,0),rows.length);assert.equal(batches.reduce((n,b)=>n+b.parsedRows,0),stats.parsedRows);
 for(const b of batches)if(b.expectedRows!==null)assert.equal(b.expectedRows,b.parsedRows);
 for(const x of stats.changes){assert.equal(x.beforeTotal,13758);assert.equal(x.afterTotal,15182);assert.ok(Math.abs(x.beforePer1000-x.before/x.beforeTotal*1000)<.006);assert.ok(Math.abs(x.afterPer1000-x.after/x.afterTotal*1000)<.006);}
 const audit=await json('data/nssfc-extraction-audit.json');assert.deepEqual(audit.conflicts,[]);assert.ok(audit.audits.every(a=>a.issues.length===0));
});
test('filters, institution full counting, document frequency and Jaccard handle overlap and empty results',()=>{
 const rows=[{approval_status:'approved',date:'2025',title:'数字养老',organization:'甲校',organization_normalized:'甲校',project_code:'25B001',project_type:'一般项目',scope_groups:['卫生健康'],topics:['养老'],keywords:['数字化','养老','养老']},{approval_status:'approved',date:'2024',title:'农村养老',organization:'乙校',organization_normalized:'乙校',project_code:'24C001',project_type:'青年项目',scope_groups:['卫生健康'],topics:['养老'],keywords:['农村','养老']},{approval_status:'publicity',date:'2025',title:'数字养老',keywords:['养老']}];
 assert.equal(filterProjects(rows).length,2);assert.equal(filterProjects(rows,{year:'2025',kind:'一般项目',query:'甲校 养老'}).length,1);assert.equal(filterProjects(rows,{query:'不存在'}).length,0);
 const valid=filterProjects(rows);assert.equal(frequencies(valid,'keywords').find(x=>x.name==='养老').count,2);assert.equal(frequencies(valid,'organization_normalized').reduce((n,x)=>n+x.count,0),2);
 const pair=cooccurrences(valid,1).find(x=>[x.a,x.b].includes('数字化'));assert.equal(pair.count,1);assert.equal(pair.jaccard,.5);assert.ok(mechanicalPair('数字化','数字政府'));
 assert.ok(csvText(valid).startsWith('\uFEFF'));assert.ok(csvText([{title:'=1+1'}]).includes("'=1+1"));
});
test('maintainer contact information is absent from all published root pages',async()=>{
 const files=await readdir(root);for(const f of files.filter(f=>f.endsWith('.html')))assert.doesNotMatch(await read(f),/contact_click|署名与联系方式|对我的帮助|主理人介绍/);
 const page=await read('nssfc-projects.html');assert.match(page,/官网与来源/);assert.match(page,/2026/);assert.match(await read('index.html'),/nssfc-projects\.html/);
});
