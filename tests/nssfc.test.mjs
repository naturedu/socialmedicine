import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {filterProjects,frequencies,cooccurrences,csvText,mechanicalPair} from '../nssfc-analysis-core.mjs';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8'),json=async p=>JSON.parse(await read(p));
test('filters, institution full counting, document frequency and Jaccard handle overlap and empty results',()=>{
 const rows=[{approval_status:'approved',date:'2025',title:'数字养老',organization:'甲校',organization_normalized:'甲校',project_code:'25B001',project_type:'一般项目',scope_groups:['卫生健康'],topics:['养老'],keywords:['数字化','养老','养老']},{approval_status:'approved',date:'2024',title:'农村养老',organization:'乙校',organization_normalized:'乙校',project_code:'24C001',project_type:'青年项目',scope_groups:['卫生健康'],topics:['养老'],keywords:['农村','养老']},{approval_status:'publicity',date:'2025',title:'数字养老',keywords:['养老']}];
 assert.equal(filterProjects(rows).length,2);assert.equal(filterProjects(rows,{year:'2025',kind:'一般项目',query:'甲校 养老'}).length,1);assert.equal(filterProjects(rows,{query:'不存在'}).length,0);
 const valid=filterProjects(rows);assert.equal(frequencies(valid,'keywords').find(x=>x.name==='养老').count,2);assert.equal(frequencies(valid,'organization_normalized').reduce((n,x)=>n+x.count,0),2);
 const pair=cooccurrences(valid,1).find(x=>[x.a,x.b].includes('数字化'));assert.equal(pair.count,1);assert.equal(pair.jaccard,.5);assert.ok(mechanicalPair('数字化','数字政府'));
 assert.ok(csvText(valid).startsWith('\uFEFF'));assert.ok(csvText([{title:'=1+1'}]).includes("'=1+1"));
});
test('maintainer contact information is absent from all published root pages',async()=>{
 const files=await readdir(root);for(const f of files.filter(f=>f.endsWith('.html')))assert.doesNotMatch(await read(f),/contact_click|署名与联系方式|对我的帮助|主理人介绍/);
 const page=await read('nssfc-projects.html');assert.match(page,/全国哲学社会科学工作办公室/);assert.match(page,/2026/);assert.match(await read('index.html'),/nssfc-projects\.html/);
});
