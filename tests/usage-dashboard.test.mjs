import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {formatCount} from '../usage-client.mjs';
import {usageCsv} from '../usage-core.mjs';

const rawSource=readFileSync(new URL('../usage-dashboard.mjs',import.meta.url),'utf8');
const source=rawSource.replace(/^import .*;\r?\n/gm,'').replaceAll('import.meta.url',JSON.stringify('https://naturedu.github.io/socialmedicine/usage-dashboard.mjs'));
class Element{
 constructor(tag){this.tag=tag;this.textContent='';this.children=[];this.attributes={};}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
 setAttribute(key,value){this.attributes[key]=value;}
 getAttribute(key){return this.attributes[key];}
}
const all=node=>[node,...node.children.flatMap(all)];
const text=node=>all(node).map(x=>x.textContent).filter(Boolean).join('\n');
function setup(initial){
 const root=new Element('root'),events=new Map(),calls=[],timers=new Map();let current=initial;
 const context=vm.createContext({
  document:{getElementById:id=>id==='usageDashboard'?root:null,createElement:tag=>new Element(tag),addEventListener(name,fn){events.set('document:'+name,fn);}},
  window:{addEventListener(name,fn){events.set(name,fn);}},location:{hash:'#usage'},Element,
  formatCount,usageCsv,Date,Number,Intl,Object,Array,URL,Blob,Promise,
  setTimeout:fn=>{const id=Symbol();timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),
  fetchUsageStats:async options=>{calls.push(options);if(current instanceof Error)throw current;return current;},
 });
 vm.runInContext(source,context);
 return{root,calls,events,timers,setData(value){current=value;},find(label){return all(root).find(x=>x.textContent===label);},status(){return all(root).find(x=>x.attributes.role==='status').textContent;}};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const complete={updatedAt:'2026-10-29T10:00:00Z',today:'2026-10-29',totals:{visits:12,clicks:0,started:'2026-10-29'},skillTotals:{opens:7,downloads:3},daily:[{day:'2026-10-29',visits:12,clicks:0}],skills:[{id:'socialmedicineskills',opens:7,downloads:3}],pages:[{page:'home',count:12}],actions:[]};

test('widgets import the same versioned shared client, without their own stats endpoint',()=>{
 const other=readFileSync(new URL('../socialmedicine-skill-counts.mjs',import.meta.url),'utf8');
 for(const source of [rawSource,other]){
  assert.match(source,/from '\.\/usage-client\.mjs\?v=20261029complete1'/);
  assert.ok(!source.includes('/api/stats'));
 }
});

test('dashboard retains a timestamped cached snapshot and force refreshes only on request',async()=>{
 const t=setup(complete);await settle();
 assert.equal(t.calls.length,1);assert.equal(t.calls[0].force,false);
 assert.equal(t.find('下载统计 CSV').disabled,false);
 t.setData({...complete,clientMeta:{state:'cached'}});
 await t.find('刷新统计').onclick();
 assert.equal(t.calls.at(-1).force,true);assert.match(t.status(),/历史快照.*2026.*不是最新数据/);
 assert.equal(t.find('下载原始 JSON').disabled,false);
 t.setData(new Error('offline'));await t.find('刷新统计').onclick();
 assert.match(t.status(),/保留 2026.*快照/);assert.ok(text(t.root).includes('12'));
});

test('partial data shows known totals while missing fields never turn into zero or NaN',async()=>{
 const t=setup({updatedAt:complete.updatedAt,totals:{visits:12,clicks:0},downloadTotals:{},chatTotals:{questions:0},pages:[{page:'home'}],skills:[{id:'socialmedicineskills'}]});
 await settle();const output=text(t.root);
 assert.ok(output.includes('12'));assert.ok(output.includes('未取得'));
 assert.ok(!output.includes('NaN'));assert.ok(!output.includes('undefined'));assert.ok(!output.includes('null'));
 assert.equal(t.find('下载统计 CSV').disabled,true);assert.equal(t.find('下载原始 JSON').disabled,false);
 assert.match(t.status(),/部分字段尚未取得/);
});

test('tracked events remain debounced and use the shared non-forced request path',async()=>{
 const t=setup(complete);await settle();
 for(let i=0;i<4;i++)t.events.get('puxian:tracked')();
 assert.equal(t.timers.size,1);
 for(const callback of t.timers.values())await callback();
 assert.equal(t.calls.length,2);assert.equal(t.calls[1].force,false);
});
