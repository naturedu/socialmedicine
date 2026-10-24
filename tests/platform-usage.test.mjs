import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
const R=new URL('../',import.meta.url),read=path=>readFile(new URL(path,R),'utf8');
test('public platform catalogue resolves to existing skills and excludes full text',async()=>{
 const c=JSON.parse(await read('data/usage-skill-catalog.json'));
 assert.ok(c['charls-database-skill']);assert.ok(c['long-term-care-policy-skill']);
 for(const s of Object.values(c)){assert.equal(s.instructions,undefined);await access(new URL(s.file,R));await access(new URL(s.guide,R));}
});
test('platform UI keeps confirmed use separate and does not count local demonstrations',async()=>{
 const s=await read('skill-usage.mjs');
 assert.match(s,/doubao:'豆包'/);assert.match(s,/chatgpt:'ChatGPT \/ GPT'/);
 assert.match(s,/if\(local\)return;window.puxianTrackUsage/);
 assert.match(s,/state\.reported/);assert.match(s,/kind/);
 assert.match(s,/data-puxian-ignore/);assert.match(s,/服务器任务书生成、目标平台操作、本人确认使用分别统计/);
 const html=await read('usage-statistics.html');assert.match(html,/当前不可观测/);assert.match(html,/显示“未接入”，不记作0/);
});
