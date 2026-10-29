import test from 'node:test';
import assert from 'node:assert/strict';
import {createStatsClient,formatCount,validStats} from '../usage-client.mjs';
const snapshot={updatedAt:'2026-10-29T10:00:00Z',totals:{visits:12345,clicks:0}};
test('counts preserve exact integers and unknown does not become zero',()=>{
 assert.equal(formatCount(1234567),'1,234,567');assert.equal(formatCount(0),'0');
 for(const n of [null,undefined,'',' ',[],NaN,-1,true,1.5])assert.equal(formatCount(n),'未取得');
 assert.ok(validStats(snapshot));assert.equal(validStats({...snapshot,updatedAt:'bad'}),false);
});
test('a failed refresh keeps a labelled timestamped previous success',async()=>{
 let fail=false,calls=0;const map=new Map(),storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const client=createStatsClient({storage,fetchImpl:async()=>{calls++;return fail?{ok:false,status:503}:{ok:true,json:async()=>snapshot};}});
 const live=await client.read();assert.equal(live.clientMeta.state,'live');
 fail=true;const cached=await client.read({force:true});assert.equal(cached.clientMeta.state,'cached');assert.equal(cached.updatedAt,snapshot.updatedAt);assert.equal(cached.totals.visits,12345);assert.equal(cached.clientMeta.error,'HTTP 503');assert.equal(calls,2);
});
test('concurrent page widgets share one request; no fake fallback on first failure',async()=>{
 let calls=0;const client=createStatsClient({fetchImpl:async()=>{calls++;return {ok:false,status:503};}});
 const results=await Promise.allSettled([client.read(),client.read()]);assert.equal(calls,1);assert.ok(results.every(r=>r.status==='rejected'));
 await assert.rejects(client.read(),/当前次数尚未取得/);assert.equal(calls,1);
});
test('a first-time visitor can see a real dated archive after a service failure',async()=>{
 let calls=0;
 const client=createStatsClient({archiveUrl:'https://example.org/snapshot.json',fetchImpl:async url=>{calls++;return url.endsWith('snapshot.json')?{ok:true,json:async()=>snapshot}:{ok:false,status:503};}});
 const data=await client.read();assert.equal(data.clientMeta.state,'archive');assert.equal(data.updatedAt,snapshot.updatedAt);assert.equal(data.totals.visits,12345);assert.match(data.clientMeta.sourceLabel,/历史快照/);assert.equal(calls,2);
 await client.read();assert.equal(calls,2);
});
