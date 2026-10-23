/* Deterministic, local title/abstract triage. No requests and no storage. */
(function(root){
 'use strict';
 function contains(text,term){
  if(/^[a-z0-9-]{2,5}$/i.test(term))return new RegExp('(^|[^a-z0-9])'+term+'([^a-z0-9]|$)','i').test(text);
  return text.toLowerCase().includes(term.toLowerCase());
 }
 function match(input,journals,rules){
  const title=(input.title||'').trim(),abstract=(input.abstract||'').trim();
  if(!title&&!abstract)return {error:'请填写标题或摘要，再开始匹配。',results:[]};
  const hits={},methodHits={};
  for(const [key,rule] of Object.entries(rules.topics)){
   const terms=rule.terms.filter(t=>contains(title,t)||contains(abstract,t));
   hits[key]={terms,score:Math.min(8,terms.reduce((n,t)=>n+(contains(title,t)?3:1),0))};
   methodHits[key]=rule.methods.filter(t=>contains(title+' '+abstract,t));
  }
  // Health economics, drug policy, insurance, services or social determinants anchor the domain.
  const domain=/健康|卫生|医疗|医保|药物|药品|医药|医改|医院|养老|照护|长护|接种|疫苗|health|medical|medicine|hospital|patient|pharmaco|vaccine|vaccination|immunization|care|qaly|icer/i.test(title+' '+abstract);
  if(!domain||!Object.values(hits).some(h=>h.score))return {error:'尚未识别到社医卫管的明确主题。请补充研究对象、卫生管理问题、方法与主要结果；当前不强行推荐期刊。',results:[],hits};
  const results=journals.filter(j=>(j.match_topics||[]).length&&(!input.language||input.language==='全部'||j.language===input.language)).map(j=>{
   const topics=j.match_topics.filter(k=>hits[k].score>0),terms=[...new Set(topics.flatMap(k=>hits[k].terms))],methods=[...new Set(topics.flatMap(k=>methodHits[k]))];
   const score=topics.reduce((n,k)=>n+hits[k].score,0)+Math.min(3,methods.length);
   return {journal:j,topics,terms,methods,score};
  }).filter(j=>j.topics.length).sort((a,b)=>b.score-a.score||a.journal.name.localeCompare(b.journal.name)).slice(0,9);
  return {results,hits,titleOnly:!abstract,type:input.type||'原创研究',error:results.length?'':'当前语种没有匹配候选；可切换语种或补充摘要。'};
 }
 root.JournalEngine={match,contains};
 if(typeof module!=='undefined')module.exports={match,contains};
})(typeof window!=='undefined'?window:globalThis);
