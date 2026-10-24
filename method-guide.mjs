import {loadAuthorities, attachAuthorities} from './method-authorities.mjs';
export function orderedGroups(rows, guide) {
  const definitions=[...guide.groups,{id:'other',title:'其他方法专题',intro:'继续查看对应手册的研究问题、数据要求和假设。',order:99}];
  return definitions.map(group=>({...group,items:rows.filter(x=>(x.group||'other')===group.id).sort((a,b)=>(a.order??99)-(b.order??99)||a.id.localeCompare(b.id))})).filter(x=>x.items.length);
}
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(text)x.textContent=text;if(cls)x.className=cls;return x;};
function attachPredictionGuide(card,id){
  if(id!=='machine-learning-skill'||card.querySelector('.prediction-guide-link'))return;
  const link=el('a','机器学习预测 · 图文教程 ↗','secondary prediction-guide-link');link.href='prediction-models.html';
  const row=el('p');row.append(link);card.append(row);
}
const styles=`.method-reading-map{padding:19px 22px;background:#eef2e7;border:1px solid #dce3d4;border-radius:13px;margin:16px 0 22px}.method-reading-map h3{margin:0 0 7px;font-size:17px}.method-reading-map p{font-size:13px;line-height:1.85;margin:7px 0;color:#5f725d}.method-route{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.method-route span{font-size:11px;padding:4px 9px;border-radius:20px;border:1px solid #d0dbc8;background:#fff}.method-category-group{grid-column:1/-1;min-width:0;margin:3px 0 19px}.method-category-heading{border-bottom:1px solid #d6dece;margin:0 0 15px;padding:0 0 12px}.method-category-heading h3{font-size:21px;line-height:1.5;margin:0 0 5px}.method-category-heading p{font-size:13px;color:#6d7d67;margin:0;line-height:1.8}.method-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.method-category-grid>article{margin:0;min-width:0}.method-prepare{padding-top:10px;border-top:1px solid #e3e9dd;font-size:12px!important;line-height:1.85;color:#66765f!important;margin:12px 0!important}.method-example{font-size:12px!important;color:#778369!important;line-height:1.85}.method-group-kicker{color:#8b7b55;font-size:11px;letter-spacing:1px;display:block;margin:0 0 6px}.method-reading-note{font-size:12px!important}.method-category-grid .resource-card>h3{line-height:1.5}.method-category-grid .method-card>div:has(>.tag){display:none}.method-category-grid .tag{max-width:100%;overflow-wrap:anywhere}.method-guide-error{font-size:12px;color:#7e683e}@media(min-width:1440px){.method-category-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:720px){.method-category-grid{grid-template-columns:1fr}.method-reading-map{padding:15px}.method-category-heading h3{font-size:19px}}`;
export async function initMethodGuide(){
  const skillGrid=document.getElementById('methodGrid'),quickGrid=document.getElementById('quickMethods'),classicGrid=document.body.dataset.page==='methods'?document.getElementById('results'):null;
  if(!skillGrid&&!quickGrid&&!classicGrid)return;
  if(document.getElementById('method-guide-style'))return;
  try{
    const r=await fetch(new URL('./data/method-guide.json',import.meta.url));if(!r.ok)throw new Error();const guide=await r.json();
    const style=el('style',styles);style.id='method-guide-style';document.head.append(style);
    const definitions=new Map([...guide.skills,...guide.quick].map(x=>[x.id,x]));
    let authorities;try{authorities=await loadAuthorities();}catch{/* Existing method content remains available. */}
    const map=el('aside',null,'method-reading-map');map.setAttribute('aria-label','方法分类与阅读建议');map.append(el('h3','先看研究问题，再选方法'),el('p','想描述现状，先看研究设计与统计；想评价政策，先核对因果识别条件；想比较方案价值，再看经济评价。每张卡片先说明用途和准备条件，详细代码按需展开。'));
    const route=el('div',null,'method-route');for(const g of guide.groups.filter(g=>g.id!=='start'))route.append(el('span',`${String(g.order).padStart(2,'0')} ${g.title}`));map.append(route,el('p','这是阅读导航，不是固定分析流程。理论框架、样本量与数据准备要在选题和设计阶段考虑。','method-reading-note'));
    if(skillGrid){const panel=document.getElementById('panel-methods');const anchor=panel.querySelector('.searchbar')||skillGrid;anchor.before(map);}else classicGrid.before(map);
    function groupCards(container, kind){
      const cards=[...container.children].filter(x=>x.matches('article.resource-card,article.entry'));
      if(!cards.length)return;
      const rows=cards.map((card,i)=>{const id=kind==='skills'?card.querySelector('[data-method]')?.dataset.method:(card.querySelector('.step')||card.querySelector('.tag'))?.textContent.trim();const info=definitions.get(id);return {...(info||{id:id||`unknown-${i}`,group:'other',order:999}),card};});
      for(const m of rows){
        if(!m.intro){if(authorities)attachAuthorities(m.card,m.id,authorities);continue;}
        const heading=m.card.querySelector('h3,h2');if(heading){heading.title=heading.textContent;heading.textContent=m.title;}
        const paragraph=[...m.card.children].find(x=>x.tagName==='P');
        if(paragraph)paragraph.textContent=m.intro;else heading?.after(el('p',m.intro));
        if(!m.card.querySelector('.method-prepare')){
          const prep=el('p',null,'method-prepare');prep.append(el('strong','先准备：'),document.createTextNode(m.prepare));
          const intro=[...m.card.children].find(x=>x.tagName==='P');intro?.after(prep);if(m.example)prep.after(el('p',m.example,'method-example'));
        }
        if(authorities)attachAuthorities(m.card,m.id,authorities);
        attachPredictionGuide(m.card,m.id);
      }
      const fragment=document.createDocumentFragment();
      for(const group of orderedGroups(rows,guide)){
        const section=el('section',null,'method-category-group');section.dataset.methodGroup=group.id;
        const heading=el('header',null,'method-category-heading');heading.append(el('span',group.id==='start'?'START HERE':`SECTION ${String(group.order).padStart(2,'0')}`,'method-group-kicker'),el('h3',`${group.title} · ${group.items.length}`),el('p',group.intro));
        const grid=el('div',null,'method-category-grid');for(const item of group.items)grid.append(item.card);section.append(heading,grid);fragment.append(section);
      }
      container.replaceChildren(fragment);
    }
    for(const [container,kind] of [[skillGrid,'skills'],[quickGrid,'quick'],[classicGrid,'quick']])if(container){groupCards(container,kind);new MutationObserver(()=>groupCards(container,kind)).observe(container,{childList:true});}
    // The classic catalogue keeps this array by reference; re-sort it, then use its normal search renderer.
    if(classicGrid&&Array.isArray(window.SM?.methods)){
      const groupRank=new Map(guide.groups.map(x=>[x.id,x.order]));
      window.SM.methods.sort((a,b)=>{const x=definitions.get(a.id),y=definitions.get(b.id);return (groupRank.get(x?.group)??99)-(groupRank.get(y?.group)??99)||(x?.order??99)-(y?.order??99);});
      const selector=document.querySelector('[data-filter="category"]');if(selector){const choices=[...selector.options].slice(1).sort((a,b)=>(groupRank.get(a.value)??99)-(groupRank.get(b.value)??99));for(const option of choices)selector.append(option);}
      document.getElementById('search')?.dispatchEvent(new Event('input',{bubbles:true}));
    }
    // Add the same context when the existing Skill dialog is opened, without changing its code actions.
    const detail=document.getElementById('detailContent');
    if(detail)new MutationObserver(()=>{
      if(detail.querySelector('.method-dialog-intro'))return;
      const href=detail.querySelector('a[download]')?.getAttribute('href');const id=href?.match(/skills\/([^/]+)\.md/)?.[1];const info=definitions.get(id);if(!info)return;
      const context=el('div',null,'method-dialog-intro');context.append(el('p',info.intro),el('p','先准备：'+info.prepare,'method-prepare'));if(info.example)context.append(el('p',info.example,'method-example'));if(authorities)attachAuthorities(context,id,authorities);
      const heading=detail.querySelector('h3');const previous=heading?.nextElementSibling;if(previous?.tagName==='P')previous.remove();heading?.after(context);
      attachPredictionGuide(context,id);
    }).observe(detail,{childList:true});
  }catch{
    const note=el('p','方法分类介绍暂未载入，原有方法和代码仍可使用。','method-guide-error');(skillGrid||classicGrid||quickGrid).before(note);
  }
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void initMethodGuide(),{once:true});else void initMethodGuide();
}
