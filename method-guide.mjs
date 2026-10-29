import {loadAuthorities, attachAuthorities} from './method-authorities.mjs';

export const MAIN_ANALYSIS_GROUPS = ['descriptive','association','causal','predictive'];
const fallbackGroups = [
  {id:'descriptive',title:'描述性分析',intro:'回答现状、分布与变化：是什么、有多少、怎样分布？',order:1},
  {id:'association',title:'相关性分析',intro:'回答变量之间的联系：哪些因素相互关联、关联有多大？',order:2},
  {id:'causal',title:'因果推断',intro:'回答干预或政策带来的改变：相对于可信的对照，效果是什么？',order:3},
  {id:'predictive',title:'预测分析',intro:'回答未见对象或未来结局：预测是否准确、校准、具有应用价值？',order:4},
  {id:'support',title:'跨类研究与支撑',intro:'定性研究、专家共识、组态分析、理论框架、证据综合与经济评价有各自的问题和证据逻辑。',order:5}
];

export function navigationGroups(guide) {
  const definitions = new Map((guide.groups||[]).map(group=>[group.id,group]));
  return fallbackGroups.map(group=>({...group,...definitions.get(group.id)}));
}

export function orderedGroups(rows, guide) {
  const definitions=[...navigationGroups(guide),{id:'other',title:'待补充归类的专题',intro:'查看相应手册的研究问题、数据与假设，再判断适用路线。',order:99}];
  const known=new Set(definitions.map(group=>group.id));
  return definitions.map(group=>({...group,items:rows.filter(row=>(known.has(row.group)?row.group:'other')===group.id).sort((a,b)=>(a.order??99)-(b.order??99)||String(a.id).localeCompare(String(b.id)))})).filter(group=>group.items.length);
}

const el=(tag,text,cls)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;};
function attachPredictionGuide(card,id){
  if(id!=='machine-learning-skill'||card.querySelector('.prediction-guide-link'))return;
  const link=el('a','机器学习预测 · 图文教程 ↗','secondary prediction-guide-link');link.href='prediction-models.html';
  const row=el('p');row.append(link);card.append(row);
}

const styles=`
.method-reading-map{padding:22px;background:#eef2e7;border:1px solid #dce3d4;border-radius:13px;margin:18px 0 24px}
.method-reading-map h2{margin:0 0 8px;font-size:23px;line-height:1.45}.method-reading-map p{font-size:13px;line-height:1.8;margin:7px 0;color:#5f725d}
.method-main-routes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:18px 0}
.method-route-card{display:flex;flex-direction:column;gap:8px;padding:16px;border:1px solid #cad9c6;border-radius:10px;background:#fff;color:#244b35;text-decoration:none;min-width:0}
.method-route-card:hover,.method-route-card[aria-current=true]{border-color:#417858;background:#e1eddf}.method-route-card strong{font-size:18px;line-height:1.5}.method-route-card p{font-size:12px;line-height:1.8;margin:0}.method-route-card .method-route-number{font-size:11px;color:#5e795c;letter-spacing:1px}.method-route-card .method-route-action{font-size:11px;color:#356947;margin-top:auto;padding-top:8px}
.method-support-route{padding:15px 17px;border-left:3px solid #ac9560;background:#f6f4ea;border-radius:0 8px 8px 0}.method-support-route h3{font-size:16px;margin:0 0 6px}.method-support-route a{font-size:12px;font-weight:600}.method-reading-map .method-reading-note{font-size:12px;margin-top:15px}
.method-category-group{grid-column:1/-1;min-width:0;margin:3px 0 19px}.method-category-heading{border-bottom:1px solid #d6dece;margin:0 0 15px;padding:0 0 12px}.method-category-heading h3{font-size:21px;line-height:1.5;margin:0 0 5px}.method-category-heading p{font-size:13px;color:#6d7d67;margin:0;line-height:1.8}.method-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}.method-category-grid>article{margin:0;min-width:0}.method-prepare{padding-top:10px;border-top:1px solid #e3e9dd;font-size:12px!important;line-height:1.85;color:#66765f!important;margin:12px 0!important}.method-example{font-size:12px!important;color:#778369!important;line-height:1.85}.method-group-kicker{color:#8b7b55;font-size:11px;letter-spacing:1px;display:block;margin:0 0 6px}.method-category-grid .resource-card>h3{line-height:1.5}.method-category-grid .tag{max-width:100%;overflow-wrap:anywhere}.method-role-heading{font-size:14px;color:#486648;margin:20px 0 12px}.method-guide-error{font-size:12px;color:#7e683e}
@media(min-width:1440px){.method-category-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:1000px){.method-main-routes{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:580px){.method-category-grid,.method-main-routes{grid-template-columns:1fr}.method-reading-map{padding:16px}.method-reading-map h2{font-size:21px}.method-route-card{padding:14px}.method-category-heading h3{font-size:19px}}
`;

function renderNavigation(guide, classicGrid){
  const map=document.getElementById('methodFramework')||el('section');
  map.classList.add('method-reading-map');map.setAttribute('aria-label','四类分析主线与跨类研究支撑');map.replaceChildren();
  map.append(el('h2','先分清研究问题，再选择分析路线'),el('p','描述性分析、相关性分析、因果推断与预测分析回答不同的问题。同一个模型可以服务不同目标，研究设计和假设决定结论能走多远。'));
  const groups=navigationGroups(guide),routes=el('div',null,'method-main-routes');
  groups.filter(group=>MAIN_ANALYSIS_GROUPS.includes(group.id)).forEach((group,index)=>{
    const card=el('a',null,'method-route-card');card.href=`methods.html?analysis_group=${encodeURIComponent(group.id)}#toolbar`;card.dataset.methodRoute=group.id;
    card.append(el('span',`分析主线 ${String(index+1).padStart(2,'0')}`,'method-route-number'),el('strong',group.title),el('p',group.intro),el('span','查看这一主线的方法 →','method-route-action'));routes.append(card);
  });
  const support=groups.find(group=>group.id==='support'),supportBox=el('div',null,'method-support-route');
  supportBox.append(el('h3',support.title),el('p','定性研究、德尔菲等专家共识、fsQCA等组态分析、理论框架、证据综合与经济评价，按各自的研究逻辑选用，不强行归入上述四类。'));
  const supportLink=el('a','查看跨类方法与支撑 →');supportLink.href='methods.html?analysis_group=support#toolbar';supportLink.dataset.methodRoute='support';supportBox.append(supportLink);
  map.append(routes,supportBox,el('p','四类主线是问题导航，不是固定的研究步骤；“跨类研究与支撑”也不是第五类统计结论。筛选中的“方法类型”与原A—J分类保留不同维度。','method-reading-note'));
  if(classicGrid){
    const selector=document.querySelector('[data-filter="analysis_group"]');
    const syncActive=()=>map.querySelectorAll('[data-method-route]').forEach(link=>{if(selector?.value===link.dataset.methodRoute)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
    map.addEventListener('click',event=>{
      const link=event.target.closest('[data-method-route]');if(!link||!selector)return;
      const group=link.dataset.methodRoute;if(![...selector.options].some(option=>option.value===group))return;
      event.preventDefault();document.querySelectorAll('[data-filter]').forEach(select=>{select.value=select===selector?group:'';});
      const search=document.getElementById('search');if(search)search.value='';
      selector.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('toolbar')?.scrollIntoView({block:'start'});
    });
    selector?.addEventListener('change',syncActive);syncActive();
  }
  return map;
}

export async function initMethodGuide(){
  const skillGrid=document.getElementById('methodGrid'),quickGrid=document.getElementById('quickMethods'),classicGrid=document.body.dataset.page==='methods'?document.getElementById('results'):null;
  if(!skillGrid&&!quickGrid&&!classicGrid)return;
  if(document.getElementById('method-guide-style'))return;
  const style=el('style',styles);style.id='method-guide-style';document.head.append(style);
  try{
    const response=await fetch(new URL('./data/method-guide.json?v=20261029framework1',import.meta.url));if(!response.ok)throw new Error();const guide=await response.json();
    const definitions=new Map([...(guide.skills||[]),...(guide.quick||[])].map(row=>[row.id,row]));
    let authorities;try{authorities=await loadAuthorities();}catch{/* Original source links and code remain available. */}
    const map=renderNavigation(guide,classicGrid);
    if(!map.isConnected){
      if(skillGrid){const panel=document.getElementById('panel-methods');const anchor=panel?.querySelector('.searchbar')||skillGrid;anchor.before(map);}
      else (document.getElementById('toolbar')||classicGrid||quickGrid).before(map);
    }
    function groupCards(container,kind){
      const cards=[...container.children].filter(node=>node.matches('article.resource-card,article.entry'));if(!cards.length)return;
      const rows=cards.map((card,index)=>{
        const id=card.dataset.methodId||(kind==='skills'?card.querySelector('[data-method]')?.dataset.method:(card.querySelector('.step')||card.querySelector('.tag'))?.textContent.trim());
        const info=definitions.get(id),group=card.dataset.analysisGroup||info?.group||'other';
        return {...(info||{id:id||`unknown-${index}`,order:999}),group,role:card.dataset.methodRole||info?.role||'',card};
      });
      for(const method of rows){
        if(method.intro){
          const heading=method.card.querySelector('h3,h2');if(heading){heading.title=heading.textContent;heading.textContent=method.title;}
          if(method.card.dataset.methodSummary!=='structured'){
            const paragraph=[...method.card.children].find(node=>node.tagName==='P');
            if(paragraph)paragraph.textContent=method.intro;else heading?.after(el('p',method.intro));
            if(method.prepare&&!method.card.querySelector('.method-prepare')){
              const prep=el('p',null,'method-prepare');prep.append(el('strong','先准备：'),document.createTextNode(method.prepare));
              const intro=[...method.card.children].find(node=>node.tagName==='P');intro?.after(prep);if(method.example)prep.after(el('p',method.example,'method-example'));
            }
          }
        }
        if(authorities)attachAuthorities(method.card,method.id,authorities);attachPredictionGuide(method.card,method.id);
      }
      const fragment=document.createDocumentFragment();
      for(const group of orderedGroups(rows,guide)){
        const section=el('section',null,'method-category-group');section.dataset.methodGroup=group.id;
        const title=group.id==='support'?'跨类研究与支撑':group.title;
        const kicker=group.id==='support'?'CROSS-CUTTING':MAIN_ANALYSIS_GROUPS.includes(group.id)?`分析主线 ${String(MAIN_ANALYSIS_GROUPS.indexOf(group.id)+1).padStart(2,'0')}`:'待补充归类';
        const heading=el('header',null,'method-category-heading');heading.append(el('span',kicker,'method-group-kicker'),el('h3',`${title} · 本页 ${group.items.length} 项`),el('p',group.intro));section.append(heading);
        const roleGroups=group.id==='support'?new Map():new Map([['',group.items]]);
        if(group.id==='support')for(const item of group.items){const role=item.role||'其他跨类方法';if(!roleGroups.has(role))roleGroups.set(role,[]);roleGroups.get(role).push(item);}
        for(const [role,items] of roleGroups){if(role)section.append(el('h4',role,'method-role-heading'));const grid=el('div',null,'method-category-grid');for(const item of items)grid.append(item.card);section.append(grid);}
        fragment.append(section);
      }
      container.replaceChildren(fragment);
    }
    for(const [container,kind] of [[skillGrid,'skills'],[quickGrid,'quick'],[classicGrid,'quick']])if(container){groupCards(container,kind);new MutationObserver(()=>groupCards(container,kind)).observe(container,{childList:true});}
    if(classicGrid&&Array.isArray(window.SM?.methods)){
      const ranks=new Map(navigationGroups(guide).map((group,index)=>[group.id,index]));
      window.SM.methods.sort((a,b)=>{const x=definitions.get(a.id),y=definitions.get(b.id);return (ranks.get(a.analysis_group||x?.group)??99)-(ranks.get(b.analysis_group||y?.group)??99)||(x?.order??99)-(y?.order??99);});
      document.getElementById('search')?.dispatchEvent(new Event('input',{bubbles:true}));
    }
    const detail=document.getElementById('detailContent');
    if(detail)new MutationObserver(()=>{
      if(detail.querySelector('.method-dialog-intro'))return;
      const href=detail.querySelector('a[download]')?.getAttribute('href'),id=href?.match(/skills\/([^/]+)\.md/)?.[1],info=definitions.get(id);if(!info)return;
      const context=el('div',null,'method-dialog-intro');if(info.intro)context.append(el('p',info.intro));if(info.prepare)context.append(el('p','先准备：'+info.prepare,'method-prepare'));if(info.example)context.append(el('p',info.example,'method-example'));if(authorities)attachAuthorities(context,id,authorities);
      const heading=detail.querySelector('h3'),previous=heading?.nextElementSibling;if(previous?.tagName==='P')previous.remove();heading?.after(context);attachPredictionGuide(context,id);
    }).observe(detail,{childList:true});
  }catch{
    const note=el('p','分类导航暂未载入，仍可使用下方筛选、方法说明和原有代码。','method-guide-error');(skillGrid||classicGrid||quickGrid).before(note);
  }
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void initMethodGuide(),{once:true});else void initMethodGuide();
}