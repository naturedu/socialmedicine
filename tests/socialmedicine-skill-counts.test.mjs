import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {mergeLiveCounts} from '../release-download-counts.mjs';
import {socialmedicineSkillUsage} from '../usage-core.mjs';

const source=readFileSync(new URL('../socialmedicine-skill-counts.mjs',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
function setup({live=true,archive=true,usage=true}={}){
 const nodes=new Map(),events=new Map();
 for(const key of ['[data-socialmedicine-downloads]','[data-socialmedicine-opens]','[data-socialmedicine-clicks]',
  '[data-socialmedicine-package-status]','[data-socialmedicine-usage-status]','refreshSocialmedicineSkillCounts'])
  nodes.set(key,{textContent:'—',addEventListener(name,fn){events.set(key+':'+name,fn);}});
 let online=true;
 const context=vm.createContext({document:{querySelector:key=>nodes.get(key),querySelectorAll:key=>nodes.has(key)?[nodes.get(key)]:[],getElementById:key=>nodes.get(key),addEventListener(){}},
  window:{addEventListener(){}},Date,Number,AbortSignal,Promise,setTimeout,clearTimeout,mergeLiveCounts,socialmedicineSkillUsage,
  readReleaseCounts:async()=>{if(!live||!online)throw new Error('offline');return[{id:1,name:'socialmedicineskills.zip',downloadCount:12,available:true}];},
  fetch:async url=>({ok:online&&(url.startsWith('data/')?archive:usage),json:async()=>url.startsWith('data/')?
   {repository:'naturedu/socialmedicine',schemaVersion:1,updatedAt:'2026-10-24T09:00:00Z',assets:[{id:1,name:'socialmedicineskills.zip',downloadCount:4}],byPackage:{'socialmedicineskills.zip':4}}:
   {updatedAt:'2026-10-24T10:00:00Z',skills:[{id:'did-skill',opens:999,downloads:999},{id:'socialmedicineskills',opens:7,downloads:3}]}})});
 vm.runInContext(source,context);
 return{nodes,events,disconnect(){online=false;}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
test('package downloads and website usage keep distinct main-skill values',async()=>{
 const t=setup();await settle();
 assert.equal(t.nodes.get('[data-socialmedicine-downloads]').textContent,'12');
 assert.equal(t.nodes.get('[data-socialmedicine-opens]').textContent,'7');
 assert.equal(t.nodes.get('[data-socialmedicine-clicks]').textContent,'3');
 t.disconnect();await t.events.get('refreshSocialmedicineSkillCounts:click')();
 assert.equal(t.nodes.get('[data-socialmedicine-downloads]').textContent,'12');
 assert.equal(t.nodes.get('[data-socialmedicine-opens]').textContent,'7');
 assert.match(t.nodes.get('[data-socialmedicine-package-status]').textContent,/保留上次值/);
});
test('failed live reads label an archive and missing data remains unknown',async()=>{
 const cached=setup({live:false});await settle();
 assert.equal(cached.nodes.get('[data-socialmedicine-downloads]').textContent,'4');
 assert.match(cached.nodes.get('[data-socialmedicine-package-status]').textContent,/归档快照/);
 const missing=setup({live:false,archive:false,usage:false});await settle();
 for(const selector of ['[data-socialmedicine-downloads]','[data-socialmedicine-opens]','[data-socialmedicine-clicks]'])
  assert.equal(missing.nodes.get(selector).textContent,'—');
});
