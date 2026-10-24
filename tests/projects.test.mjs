import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url),json=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
test('removed datasets and links are absent from the published funding paths',async()=>{
 for(const p of ['data/grants.json','data/grants.csv','data/gates-grants.csv'])await assert.rejects(access(new URL(p,root)));
 for(const p of ['index.html','research-studio.html','grants.html','assets/catalog.js','portal.js','data/sources.json'])assert.doesNotMatch(await readFile(new URL(p,root),'utf8'),/Gates Foundation|盖茨基金会|data\/grants\.(?:json|csv)/);
});
test('expanded schools retain verification boundaries and featured directory controls',async()=>{
 const schools=await json('data/research-schools.json');assert.ok(schools.length>=50);assert.equal(schools[0].id,'sysu-guangzhou');assert.equal(schools[1].id,'smu-health-management');assert.equal(new Set(schools.map(s=>s.id)).size,schools.length);
 for(const s of schools){assert.ok(s.officialUrl.startsWith('https://'));assert.ok(s.legacy||s.checked);assert.ok(s.admissionsNote);}
 const page=await readFile(new URL('index.html',root),'utf8');assert.match(page,/id="schoolDirectoryQuery"/);assert.match(page,/id="schoolDirectoryCount"/);
});
