import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {sourceRows} from '../method-authorities.mjs';
const data=JSON.parse(await readFile(new URL('../data/method-authorities.json',import.meta.url)));
const methods=JSON.parse(await readFile(new URL('../data/methods.json',import.meta.url)));
test('all methods resolve to named primary or official source records',()=>{
 assert.equal(Object.keys(data.methods).length,methods.length);
 for(const m of methods){const ids=data.methods[m.id];assert.ok(ids?.length,m.id);const rows=sourceRows(data,m.id);assert.equal(rows.length,ids.length,m.id);for(const s of rows){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.type&&s.title&&s.verificationScope&&s.checkedDate);}}
});
test('method source routes remain specific to the method',()=>{
 assert.ok(sourceRows(data,'D9').some(s=>s.url.endsWith('10.1093/aje/kwv254')));
 assert.ok(sourceRows(data,'D15').some(s=>s.url.endsWith('10.1016/j.jeconom.2020.12.001')));
 assert.ok(sourceRows(data,'H3').some(s=>s.url.includes('chapter-11')));
 assert.ok(sourceRows(data,'B10').some(s=>s.url.endsWith('mvpca.pdf')));
 assert.ok(sourceRows(data,'dce-design-assistant-skill').some(s=>s.id==='dce'));
 assert.deepEqual(sourceRows(data,'unknown'),[]);
});
