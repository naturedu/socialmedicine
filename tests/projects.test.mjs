import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url),json=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
test('project records preserve years, provenance, public notice state and stable identities',async()=>{
 const rows=await json('data/health-projects.json');assert.ok(rows.length>3000);assert.equal(new Set(rows.map(r=>r.funder+'|'+r.id)).size,rows.length);
 for(const r of rows){assert.ok(+r.date>=2016&&+r.date<=2025);assert.ok(['国社科','教育部'].includes(r.funder));assert.ok(r.title.length>5);assert.match(r.source,/^https?:\/\//);assert.ok(r.locator);if(r.project_code)assert.ok(r.project_code.startsWith(r.date.slice(2)));if(r.status.includes('公示'))assert.equal(r.state,'公示／最终状态待核');}
 assert.equal((await json('data/nssf-projects.json')).length+(await json('data/moe-projects.json')).length,rows.length);
 const coverage=(await json('data/project-coverage.json')).coverage;assert.equal(coverage.length,20);for(const c of coverage)assert.equal(c.selectedRows,rows.filter(r=>r.date==c.year&&r.funder===c.provider).length);
 assert.match(coverage.find(c=>c.year===2016&&c.provider==='国社科').note,/仅上海/);
 assert.match(coverage.find(c=>c.year===2022&&c.provider==='国社科').note,/仅青年/);
});
test('removed datasets and links are absent from the published funding paths',async()=>{
 for(const p of ['data/grants.json','data/grants.csv','data/gates-grants.csv'])await assert.rejects(access(new URL(p,root)));
 for(const p of ['index.html','research-studio.html','grants.html','assets/grants.js','assets/catalog.js','portal.js','data/sources.json'])assert.doesNotMatch(await readFile(new URL(p,root),'utf8'),/Gates Foundation|盖茨基金会|data\/grants\.(?:json|csv)/);
});
test('expanded schools retain verification boundaries and featured directory controls',async()=>{
 const schools=await json('data/research-schools.json');assert.ok(schools.length>=50);assert.equal(schools[0].id,'sysu-guangzhou');assert.equal(schools[1].id,'smu-health-management');assert.equal(new Set(schools.map(s=>s.id)).size,schools.length);
 for(const s of schools){assert.ok(s.officialUrl.startsWith('https://'));assert.ok(s.legacy||s.checked);assert.ok(s.admissionsNote);}
 const page=await readFile(new URL('index.html',root),'utf8');assert.match(page,/id="schoolDirectoryQuery"/);assert.match(page,/id="schoolDirectoryCount"/);
});
