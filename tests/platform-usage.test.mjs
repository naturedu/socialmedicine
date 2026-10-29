import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const R=new URL('../',import.meta.url),read=path=>readFile(new URL(path,R),'utf8');
test('public platform catalogue resolves to existing skills and excludes full text',async()=>{
 const c=JSON.parse(await read('data/usage-skill-catalog.json'));
 assert.ok(c['charls-database-skill']);assert.ok(c['long-term-care-policy-skill']);
 for(const s of Object.values(c)){assert.equal(s.instructions,undefined);await access(new URL(s.file,R));await access(new URL(s.guide,R));}
});
test('platform options share a public catalogue and expose no execution or private-account fields',async()=>{
 const platforms=JSON.parse(await read('data/usage-platforms.json'));
 for(const id of ['unspecified','doubao','chatgpt','codex','claude','deepseek','gemini','qwen','kimi','other'])assert.ok(platforms[id],id);
 for(const info of Object.values(platforms)){assert.deepEqual(Object.keys(info).sort(),['label','url']);assert.ok(info.label);if(info.url)assert.equal(new URL(info.url).protocol,'https:');}
 const html=await read('usage-statistics.html');assert.match(html,/当前不可观测/);assert.match(html,/显示“未接入”，不记作0/);
});
