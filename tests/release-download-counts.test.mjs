import test from 'node:test';import assert from 'node:assert/strict';
import {readReleaseCounts,mergeLiveCounts} from '../release-download-counts.mjs';
test('live counters include only configured published release assets',async()=>{
 const get=async p=>p.includes('/assets?')?[{id:8,name:'skill.zip',state:'uploaded',download_count:4},{id:9,name:'unrelated.zip',state:'uploaded',download_count:900}]:[{id:1,tag_name:'v1',published_at:'2026-10-24',draft:false},{id:2,tag_name:'v2',published_at:'2026-10-24',prerelease:true}];
 const rows=await readReleaseCounts('example/repo',['skill.zip'],get);assert.equal(rows.length,1);assert.equal(rows[0].downloadCount,4);
 const merged=mergeLiveCounts({assets:[{id:7,name:'skill.zip',downloadCount:2}]},rows,['skill.zip']);assert.equal(merged.observedTotal,6);assert.equal(merged.availableTotal,4);
 assert.throws(()=>mergeLiveCounts({assets:[{id:8,name:'skill.zip',downloadCount:5}]},rows,['skill.zip']),/regressed/);
});
test('malformed and failed live responses do not create zero counts',async()=>{
 await assert.rejects(readReleaseCounts('example/repo',['skill.zip'],async()=>({error:'unavailable'})));
 await assert.rejects(readReleaseCounts('example/repo',['skill.zip'],async()=>{throw new Error('offline');}));
});
