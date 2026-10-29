import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {filterSkills,filterMethods,isSamePageAnchor,allowsUsageRecording,selectionKey,createTaskComposer,createInvocationRecorder} from '../skill-usage.mjs';
import {resolveSkillContext,buildSkillTask} from '../skill-task-core.mjs';
import {formatCount,SERVICE} from '../usage-client.mjs';

const root='https://naturedu.github.io/socialmedicine/';
const catalog=JSON.parse(await readFile(new URL('../data/usage-skill-catalog.json',import.meta.url),'utf8'));
const methods=JSON.parse(await readFile(new URL('../data/methods.json',import.meta.url),'utf8'));
const selection={skill:'socialmedicineskills',platform:'doubao',methodId:'A1',contextFile:'skills/references/clinical-methods.md'};

test('all public Skill and method names remain available with combined category and name filtering',()=>{
 assert.equal(filterSkills(catalog).length,Object.keys(catalog).length);assert.equal(filterMethods(methods).length,methods.length);
 const [id,info]=Object.entries(catalog).find(([,row])=>row.label.length>25);
 assert.ok(filterSkills(catalog,{query:info.label,category:info.category}).some(([key,row])=>key===id&&row.label===info.label));
 assert.equal(filterSkills(catalog,{query:info.label,category:'nonexistent'}).length,0);
 assert.ok(filterMethods(methods,'横断面研究').some(row=>row.id==='A1'));
 assert.ok(filterMethods(methods,'因果推断').every(row=>[row.id,row.name,row.role,row.primary_analysis].join(' ').includes('因果推断')));
});

test('secondary reference pages resolve to the complete main Skill with the exact public reference',()=>{
 assert.deepEqual(resolveSkillContext(root+'guides/references/clinical-methods.html',root,catalog),{id:'socialmedicineskills',contextFile:'skills/references/clinical-methods.md',contextLabel:'医学与卫管方法扩展'});
 assert.equal(resolveSkillContext('https://example.com/guides/references/clinical-methods.html',root,catalog),null);
 const current=root+'guides/references/clinical-methods.html';
 assert.equal(isSamePageAnchor('#method-1',current),true);assert.equal(isSamePageAnchor(current+'#method-2',current),true);
 assert.equal(isSamePageAnchor(root+'skills/references/clinical-methods.md',current),false);assert.equal(isSamePageAnchor(root+'guides/did-skill.html#details',current),false);
});

test('complete task composition reads only same-site Markdown and includes full reference and method context',async()=>{
 const requests=[];const main='# Full main body\n\n[related](did-skill.md)\n\n'+('完整主文。'.repeat(500));const reference='# Full reference\n\n[more](../did-skill.md)\n\n'+('完整参考。'.repeat(300));
 const composer=createTaskComposer({catalog,methods,root,fetchImpl:async(url,options)=>{requests.push({url,options});return {ok:true,text:async()=>url.endsWith('clinical-methods.md')?reference:main};}});
 const task=await composer.compose(selection,'豆包');
 assert.ok(task.includes('完整主文。'.repeat(500)));assert.ok(task.includes('完整参考。'.repeat(300)));assert.match(task,/横断面研究/);assert.match(task,/目标平台：豆包/);
 assert.ok(task.includes(root+'skills/did-skill.md'));assert.match(task,/来源：https:\/\/naturedu\.github\.io\/socialmedicine\/skills\/references\/clinical-methods.md/);
 assert.equal(requests.length,2);assert.ok(requests.every(row=>row.url.startsWith(root+'skills/')&&!row.options.method));
 await composer.compose(selection,'豆包');assert.equal(requests.length,2,'same document fetches are reused');
 await assert.rejects(()=>composer.compose({...selection,contextFile:'https://private.example/a.md'},'豆包'),/不在本站公开目录/);
 await assert.rejects(()=>composer.compose({...selection,methodId:'missing'},'豆包'),/重新选择/);
});

test('failed Markdown reads can retry and successful generation does not contact the statistics API',async()=>{
 const calls=[];let failed=true;
 const composer=createTaskComposer({catalog,root,fetchImpl:async url=>{calls.push(url);return failed?{ok:false}:{ok:true,text:async()=> '# Complete main Skill'};}});
 const item={skill:'did-skill'};await assert.rejects(()=>composer.compose(item,'未指定平台'),/正文暂不可读/);failed=false;
 assert.match(await composer.compose(item,'未指定平台'),/Complete main Skill/);assert.equal(calls.length,2);assert.ok(calls.every(url=>!url.includes('/api/')));
 const external=createTaskComposer({root,catalog:{bad:{file:'https://elsewhere.example/secret.md'}},fetchImpl:()=>assert.fail('must not fetch')});
 await assert.rejects(()=>external.compose({skill:'bad'},'未指定平台'),/不在本站公开目录/);
});

test('the local and do-not-track rules prevent every invocation POST',async()=>{
 for(const input of [{hostname:'localhost',protocol:'http:'},{hostname:'127.0.0.1',protocol:'http:'},{hostname:'[::1]',protocol:'http:'},{hostname:'',protocol:'file:'},{hostname:'naturedu.github.io',protocol:'https:',doNotTrack:'1'}]){
  assert.equal(allowsUsageRecording(input),false);const recorder=createInvocationRecorder({allowed:()=>allowsUsageRecording(input),fetchImpl:()=>assert.fail('must not POST')});assert.equal(await recorder.record({key:'same',...selection,page:'guide'}),'skipped');
 }
 assert.equal(allowsUsageRecording({hostname:'naturedu.github.io',protocol:'https:'}),true);
});

test('invocation records at most once per combination and sends only four public identifier fields',async()=>{
 const calls=[],states=[];let finish;
 const recorder=createInvocationRecorder({uuid:()=> 'test-uuid',fetchImpl:(url,options)=>{calls.push({url,options});return new Promise(resolve=>{finish=resolve;});},onStatus:(key,value)=>states.push(value)});
 const key=selectionKey(selection),payload={key,...selection,page:'guide',task:'PRIVATE BODY MUST NOT SEND',query:'PRIVATE SEARCH'};
 const first=recorder.record(payload),second=recorder.record(payload);assert.equal(first,second);assert.deepEqual(states,['pending']);assert.equal(calls.length,1);
 assert.deepEqual(JSON.parse(calls[0].options.body),{id:'test-uuid',skill:'socialmedicineskills',platform:'doubao',page:'guide'});
 finish({ok:true,json:async()=>({recorded:true,task:'server task ignored'})});assert.equal(await first,'recorded');assert.deepEqual(states,['pending','recorded']);
 assert.equal(await recorder.record(payload),'recorded');assert.equal(calls.length,1);
 assert.notEqual(selectionKey({...selection,platform:'chatgpt'}),key);assert.notEqual(selectionKey({...selection,contextFile:''}),key);assert.notEqual(selectionKey({...selection,methodId:''}),key);
});

test('HTTP 503, recorded:false and response errors are unconfirmed without duplicate retries',async()=>{
 for(const response of [{ok:false,status:503},{ok:true,json:async()=>({recorded:false})},{ok:true,json:async()=>({task:'legacy response without recorded status'})}]){
  let count=0;const states=[];const recorder=createInvocationRecorder({fetchImpl:async()=>{count++;return response;},uuid:()=> 'uuid',onStatus:(key,value)=>states.push(value),onRecorded:()=>assert.fail('must not claim success')});
  const payload={key:'same',...selection,page:'guide'};assert.equal(await recorder.record(payload),'unconfirmed');assert.equal(await recorder.record(payload),'unconfirmed');assert.equal(count,1);assert.deepEqual(states,['pending','unconfirmed']);
 }
 const recorder=createInvocationRecorder({fetchImpl:async()=>{throw Error('offline');},uuid:()=> 'uuid'});assert.equal(await recorder.record({key:'offline',...selection,page:'guide'}),'unconfirmed');
});

test('usage UI keeps the badge in document flow and full labels wrap on small screens',async()=>{
 const source=await readFile(new URL('../skill-usage.mjs',import.meta.url),'utf8'),css=await readFile(new URL('../skill-usage.css',import.meta.url),'utf8');
 assert.match(source,/header\.after\(corner\)/);assert.doesNotMatch(source,/slice\(0,14\)/);assert.match(source,/fetchUsageStats\(\{force\}\)/);assert.match(source,/void recorder\.record/);
 assert.match(css,/\.puxian-usage-corner\{position:static/);assert.match(css,/white-space:normal/);assert.doesNotMatch(css,/Georgia|position:fixed/);
 assert.match(source,/是否入库仍待统计服务确认/);assert.match(source,/data\/usage-platforms.json/);
});

test('complete dialog selects reference context and copies immediately while its one recording request is pending',async()=>{
 const walk=element=>[element,...element.children.flatMap(walk)];
 class Element{
  constructor(tag){this.tagName=tag;this.children=[];this.dataset={};this.attributes={};this.value='';this.text='';}
  set textContent(value){this.text=String(value);this.children=[];}
  get textContent(){return this.text+this.children.map(child=>child.textContent).join('');}
  setAttribute(name,value){this.attributes[name]=value;}
  hasAttribute(name){return Object.hasOwn(this.attributes,name)||(name.startsWith('data-')&&Object.hasOwn(this.dataset,name.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase())));}
  append(...items){for(const item of items){item.parentElement=this;this.children.push(item);}}
  prepend(item){item.parentElement=this;this.children.unshift(item);}
  after(item){item.parentElement=this.parentElement;this.parentElement.children.splice(this.parentElement.children.indexOf(this)+1,0,item);}
  replaceChildren(...items){this.children=[];this.append(...items);}
  querySelectorAll(selector){return walk(this).slice(1).filter(item=>selector==='a'||selector==='a[href]'?item.tagName==='a'&&!!item.href:selector==='[data-puxian-use]'?!!item.dataset.puxianUse:false);}
  closest(){return null;}
  addEventListener(){}
  showModal(){this.open=true;}
  close(){this.open=false;}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(item=>item!==this);}
  focus(){}select(){}
 }
 class Option extends Element{constructor(text,value){super('option');this.textContent=text;this.value=value;}}
 const head=new Element('head'),body=new Element('body'),header=new Element('header');body.append(header);
 const document={head,body,createElement:tag=>new Element(tag),querySelector:selector=>selector==='body>header'?header:null,querySelectorAll:selector=>body.querySelectorAll(selector),addEventListener(){}};
 const window={addEventListener(){},dispatchEvent(){},puxianUsagePage:'guide',puxianTrackUsage(){}};
 const platforms=JSON.parse(await readFile(new URL('../data/usage-platforms.json',import.meta.url),'utf8'));
 const posted=[],copied=[];let finishRecording;
 const fetchImpl=async(url,options={})=>{
  const path=new URL(url).pathname;
  if(path.endsWith('/api/skill-invoke')){posted.push(JSON.parse(options.body));return new Promise(resolve=>{finishRecording=resolve;});}
  for(const [suffix,value]of [['usage-skill-catalog.json',catalog],['usage-platforms.json',platforms],['methods.json',methods]])if(path.endsWith(suffix))return {ok:true,json:async()=>value};
  if(path.endsWith('.md'))return {ok:true,text:async()=>path.endsWith('clinical-methods.md')?'FULL REFERENCE BODY':'FULL MAIN BODY'};
  throw Error('Unexpected fetch '+url);
 };
 let source=await readFile(new URL('../skill-usage.mjs',import.meta.url),'utf8');
 source=source.replace(/^import[^\n]+\n/gm,'').replace("const ROOT=new URL('./',import.meta.url);",'const ROOT=new URL('+JSON.stringify(root)+');').replace(/export /g,'').replace("if(typeof document!=='undefined')void initSkillUsage();",'');
 const context={document,window,location:{hostname:'naturedu.github.io',protocol:'https:',href:root+'guides/references/clinical-methods.html'},navigator:{clipboard:{writeText:async text=>copied.push(text)}},fetch:fetchImpl,fetchUsageStats:async()=>{throw Error('503');},formatCount,SERVICE,resolveSkillContext,buildSkillTask,URL,AbortSignal,Element,HTMLAnchorElement:Element,Option,crypto:{randomUUID:()=> 'fixture-uuid'},CustomEvent:class{},Event:class{},MutationObserver:class{observe(){}},setTimeout:()=>1,clearTimeout(){},Blob};
 await vm.runInNewContext(source+'\ninitSkillUsage();',context);
 assert.equal(body.children[0],header);assert.equal(body.children[1].className,'puxian-usage-corner');
 const choose=walk(body).find(item=>item.tagName==='button'&&item.textContent==='选择并使用Skill');assert.equal(choose.disabled,false);choose.onclick();
 const dialog=walk(body).find(item=>item.tagName==='dialog');assert.equal(dialog.open,true);
 const skillSelect=walk(dialog).find(item=>item.attributes['aria-label']==='选择完整Skill');assert.equal(skillSelect.children.length,Object.keys(catalog).length);assert.equal(skillSelect.value,'socialmedicineskills');
 const reference=walk(dialog).find(item=>item.tagName==='input'&&item.type==='checkbox');assert.equal(reference.checked,true);
 const platformLabel=walk(dialog).find(item=>item.tagName==='label'&&item.children[0]?.textContent==='目标平台');const platform=platformLabel.children[1];assert.equal(platform.children.length,10);platform.value='doubao';platform.onchange();
 const button=text=>walk(dialog).find(item=>item.tagName==='button'&&item.textContent===text);
 const generate=button('生成完整任务书');generate.onclick();for(let i=0;i<3;i++)await new Promise(resolve=>setImmediate(resolve));
 const area=walk(dialog).find(item=>item.tagName==='textarea');assert.equal(area.hidden,false);assert.match(area.value,/FULL MAIN BODY/);assert.match(area.value,/FULL REFERENCE BODY/);assert.equal(generate.disabled,false);assert.equal(posted.length,1);
 button('复制完整任务书').onclick();for(let i=0;i<2;i++)await new Promise(resolve=>setImmediate(resolve));assert.equal(copied[0],area.value);assert.equal(posted.length,1,'copy while pending must reuse one recording request');
 finishRecording({ok:false,status:503});await new Promise(resolve=>setImmediate(resolve));assert.match(dialog.textContent,/计数未确认/);assert.match(dialog.textContent,/完整任务书已复制/);
});
