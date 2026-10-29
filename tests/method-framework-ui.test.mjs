import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {MAIN_ANALYSIS_GROUPS,navigationGroups,orderedGroups} from '../method-guide.mjs';

const portal=await readFile(new URL('../portal.js',import.meta.url),'utf8');

// Exercise the existing DOM-driven list renderer without installing a browser or DOM package.
function catalogue(rows,search=''){
  const controls=new Map(),filters=[];
  const element=(dataset={})=>({dataset,value:'',textContent:'',disabled:false,className:'',listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},scrollIntoView(){},fire(type){this.listeners[type]?.({target:this});}});
  for(const id of ['results','toolbar','search','prev','next','count','pageNumber'])controls.set(id,element());
  const counters=['methods','code-library','tools'].map(resourceCount=>element({resourceCount}));
  let toolbar='';Object.defineProperty(controls.get('toolbar'),'innerHTML',{get:()=>toolbar,set:html=>{
    toolbar=html;filters.length=0;
    for(const match of html.matchAll(/<select data-filter="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)){
      const select=element({filter:match[1]});select.options=[...match[2].matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)].map(option=>({value:option[1],textContent:option[2]}));filters.push(select);
    }
  }});
  const document={body:{dataset:{page:'methods'}},querySelector(selector){return selector.startsWith('#')?controls.get(selector.slice(1)):filters.find(select=>selector===`[data-filter="${select.dataset.filter}"]`);},querySelectorAll(selector){return selector==='[data-filter]'?filters:selector==='[data-resource-count]'?counters:[];}};
  const data={methods:structuredClone(rows),'code-library':[{},{}],tools:[{}]};
  vm.runInNewContext(portal,{window:{SM:data,location:{search}},document,URLSearchParams,navigator:{clipboard:{writeText:async()=>{}}}});
  return {controls,filters,counters,data,select(key,value){const select=filters.find(s=>s.dataset.filter===key);select.value=value;select.fire('change');},search(value){const control=controls.get('search');control.value=value;control.fire('input');}};
}

const methods=Array.from({length:14},(_,index)=>({id:`M${index}`,name:`方法${index}`,category:index<12?'B':'G',analysis_group:index<12?'association':'support',role:index<12?'统计模型':index===12?'定性研究':'专家共识',source:'skills/example.md',content:'旧版说明\n\n**代码**\n```r\nsummary(x)\n```'}));
methods[0]={...methods[0],question:'哪些因素与结局相关？',data:['个体资料','独立样本'],report:'报告效应量与不确定性',pitfall:'<img src=x>不能把关联当作因果',analysis_tags:['association','predictive']};

test('the framework has exactly four primary routes and a separate support group',()=>{
  assert.deepEqual(MAIN_ANALYSIS_GROUPS,['descriptive','association','causal','predictive']);
  const groups=navigationGroups({groups:[{id:'causal',title:'因果推断',intro:'识别假设'}]});
  assert.deepEqual(groups.map(g=>g.id),[...MAIN_ANALYSIS_GROUPS,'support']);
  assert.equal(groups.find(g=>g.id==='causal').intro,'识别假设');
  const rows=[{id:'Q',group:'support',role:'组态分析'},{id:'D',group:'descriptive'},{id:'Z',group:'new-category'}];
  const sections=orderedGroups(rows,{groups:[]});
  assert.deepEqual(sections.map(g=>g.id),['descriptive','support','other']);
  assert.equal(sections.flatMap(g=>g.items).length,rows.length);
});

test('the catalogue retains pagination and updates counts from loaded collections',()=>{
  const page=catalogue(methods);
  assert.deepEqual(page.counters.map(c=>c.textContent),['14','2','1']);
  assert.equal(page.controls.get('pageNumber').textContent,'1 / 2');
  assert.equal((page.controls.get('results').innerHTML.match(/<article /g)||[]).length,12);
  page.controls.get('next').fire('click');
  assert.equal(page.controls.get('pageNumber').textContent,'2 / 2');
  assert.equal((page.controls.get('results').innerHTML.match(/<article /g)||[]).length,2);
  assert.equal(page.controls.get('next').disabled,true);
});

test('analysis route, role and original category combine without losing source and code links',()=>{
  const page=catalogue(methods);
  assert.deepEqual(page.filters.map(s=>s.dataset.filter),['analysis_group','role','category']);
  page.select('analysis_group','support');page.select('role','专家共识');page.select('category','G');
  const html=page.controls.get('results').innerHTML;
  assert.match(page.controls.get('count').textContent,/匹配 1 条/);
  assert.match(html,/方法13/);assert.match(html,/skills\/example\.md/);assert.match(html,/summary\(x\)/);
  page.search('不可能命中');assert.match(page.controls.get('results').innerHTML,/没有结果/);
  assert.equal(page.controls.get('prev').disabled,true);assert.equal(page.controls.get('next').disabled,true);
});

test('question/data/report/pitfall are searchable and escaped; legacy cards still render',()=>{
  const page=catalogue(methods);
  page.search('独立样本');
  const html=page.controls.get('results').innerHTML;
  for(const label of ['研究问题','数据要求','报告重点','常见误区'])assert.ok(html.includes(label));
  assert.match(html,/&lt;img src=x&gt;/);assert.doesNotMatch(html,/<img src=x>/);
  assert.match(html,/相关用途：相关性分析 · 预测分析/);
  page.search('方法1');assert.match(page.controls.get('results').innerHTML,/旧版说明/);
});

test('direct links can select a support method type and missing grouping remains visible',()=>{
  const page=catalogue(methods,'?analysis_group=support&role=定性研究');
  assert.match(page.controls.get('count').textContent,/匹配 1 条/);assert.match(page.controls.get('results').innerHTML,/方法12/);
  const legacy=catalogue([{id:'old',name:'旧条目',category:'A',content:'保留原说明',source:'skills/example.md'}]);
  assert.match(legacy.controls.get('results').innerHTML,/保留原说明/);
  assert.ok(legacy.filters[0].options.some(option=>option.value==='unclassified'));
});

test('clinical-method reading links do not promise code; legacy code links remain intact',async()=>{
  const clinical={id:'clinical',name:'方法说明条目',category:'A',analysis_group:'causal',role:'研究设计',source:'skills/references/clinical-methods.md',content:'方法要点，不附分析代码。'};
  const page=catalogue([clinical,methods[1]]);
  page.search('方法说明条目');
  let html=page.controls.get('results').innerHTML;
  assert.match(html,/href="guides\/references\/clinical-methods\.html"[^>]*>阅读方法说明/);
  assert.match(html,/<summary>展开方法要点<\/summary>/);
  assert.doesNotMatch(html,/完整方法与代码|展开方法说明与原有代码|href="skills\/references\/clinical-methods\.md"/);
  assert.match(await readFile(new URL('../guides/references/clinical-methods.html',import.meta.url),'utf8'),/<html/);
  page.search('方法1');html=page.controls.get('results').innerHTML;
  assert.match(html,/href="skills\/example\.md"[^>]*>完整方法与代码/);
  assert.match(html,/<summary>展开方法说明与原有代码<\/summary>/);
});

test('the actual catalogue renders all five routes across pages without dropping methods',async()=>{
  const actual=JSON.parse(await readFile(new URL('../data/methods.json',import.meta.url),'utf8'));
  const page=catalogue(actual),allSeen=[];
  assert.equal(page.counters[0].textContent,String(actual.length));
  for(const group of [...MAIN_ANALYSIS_GROUPS,'support']){
    page.select('analysis_group',group);
    const expected=actual.filter(method=>method.analysis_group===group).map(method=>method.id).sort(),seen=[];
    assert.ok(expected.length,group);
    do{
      const html=page.controls.get('results').innerHTML;
      seen.push(...[...html.matchAll(/data-method-id="([^"]+)"/g)].map(match=>match[1]));
      if(page.controls.get('next').disabled)break;
      page.controls.get('next').fire('click');
    }while(true);
    assert.deepEqual(seen.sort(),expected,group);allSeen.push(...seen);
  }
  assert.equal(new Set(allSeen).size,actual.length);
});
