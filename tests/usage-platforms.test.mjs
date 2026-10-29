import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catalog=JSON.parse(read('data/usage-skill-catalog.json'));
const platforms=JSON.parse(read('data/usage-platforms.json'));

test('one finite platform configuration includes labels and launch destinations',()=>{
 assert.deepEqual(Object.keys(platforms),['unspecified','doubao','chatgpt','codex','claude','deepseek','gemini','qwen','kimi','other']);
 assert.equal(platforms.unspecified.url,null);assert.equal(platforms.other.url,null);
 for(const [id,value]of Object.entries(platforms)){
  assert.ok(value.label.length);
  if(!['unspecified','other'].includes(id))assert.equal(new URL(value.url).protocol,'https:');
 }
});

test('public catalog contains current labels and only existing public document paths',()=>{
 assert.equal(Object.keys(catalog).length,66);
 assert.equal(catalog['research-public-posts-skill'].category,'writing');
 assert.equal(catalog['method-map'].label,'方法框架：四类分析主线与定性支撑');
 for(const info of Object.values(catalog)){
  assert.ok(read(info.file).length);assert.ok(read(info.guide).length);
  assert.ok(!Object.hasOwn(info,'instructions'));
 }
});

test('tracker whitelists exactly match the generated catalog and platform configuration',()=>{
 const tracker=read('tracker.js');
 const ids=JSON.parse(tracker.match(/const skillIds=new Set\((\[[^\n]+\])\);/)[1]);
 const platformIds=JSON.parse(tracker.match(/const platforms=new Set\((\[[^\n]+\])\);/)[1]);
 assert.deepEqual(ids,Object.keys(catalog));assert.deepEqual(platformIds,Object.keys(platforms));
});
