(()=>{
 if(window.__puxianAnalyticsLoaded||navigator.doNotTrack==='1')return;
 const src=document.currentScript?.src;if(!src)return;
 const endpoint='https://puxian-visit-statistics.greycarp257.chatgpt.site/api/collect';
 if(location.hostname!=='naturedu.github.io'||!location.pathname.startsWith('/socialmedicine/'))return;
 const paths={'/socialmedicine/':'home','/socialmedicine/index.html':'home','/socialmedicine/classic.html':'classic','/socialmedicine/research-resources.html':'resources','/socialmedicine/research-studio.html':'studio'};
 for(const [file,id] of Object.entries({'code':'code','figures':'figures','grants':'grants','institutions':'institutions','insurance-timeline':'insurance','journal-match':'journalmatch','journals':'journals','library':'library','methods':'methods','papers':'papers','sources':'sources','tools':'tools','wechat':'wechat'}))paths['/socialmedicine/'+file+'.html']=id;
 paths['/socialmedicine/research-conferences.html']='conferences';paths['/socialmedicine/research-careers.html']='careers';paths['/socialmedicine/research-polishing.html']='polishing';
 for(const [file,id]of Object.entries({'method-garden':'methodgarden','database-skills':'databases','policy-topics':'policies','all-materials':'materials','visual-skills':'visuals'}))paths['/socialmedicine/'+file+'.html']=id;
 if(location.pathname.startsWith('/socialmedicine/guides/'))paths[location.pathname]='guide';
 paths['/socialmedicine/skill-downloads.html']='skilldownloads';
 paths['/socialmedicine/usage-statistics.html']='usagestatistics';
 for(const [file,id] of Object.entries({'topic-analysis':'topics','nssfc-projects':'nssfc','nsfc-health':'nsfc','method-sources':'methodsources','prediction-models':'prediction'}))paths['/socialmedicine/'+file+'.html']=id;
 const page=paths[location.pathname]||(/\.html$/.test(location.pathname)?'guide':null);if(!page)return;window.__puxianAnalyticsLoaded=true;window.puxianUsagePage=page;
 const allowed=new Set(['research_start','plan_export','pdf_import','resource_add','resource_export','schools_open','datasets_open','theses_open','methods_open','journals_open','contact_click','stats_open','conferences_open','skill_bundle_download','newsletter_open','careers_open','polishing_open']),last=new Map();
 const skillIds=new Set(["academic-copyediting-skill", "active-health-hiap-skill", "advanced-causal-inference-skill", "aging-family-extension-skill", "binary-studio", "cfps-chns-database-skill", "charls-database-skill", "claims-clinical-database-skill", "clhls-database-skill", "clinical-statistical-figures-skill", "clustering-analysis-skill", "conceptual-mechanism-figure-skill", "cross-cohort-harmonization-skill", "dce-design-assistant-skill", "ddd-skill", "did-skill", "econometric-modeling-skill", "elsa-database-skill", "event-study-studio", "figure-ppt-quality-skill", "grant-roadmap-figure-skill", "graphical-abstract-skill", "health-economics-tutorial-skill", "home-hospital-bed-policy-skill", "hrs-database-skill", "image-based-slides-skill", "image-to-editable-slides-skill", "implementation-equity-skill", "its-skill", "klosa-database-skill", "lasi-database-skill", "long-term-care-policy-skill", "longitudinal-public-data-skill", "longitudinal-studio", "machine-learning-skill", "markov-model-skill", "medical-ai-evaluation-skill", "meta-analysis-skill", "method-map", "mhas-database-skill", "microsimulation-studio", "monte-carlo-simulation-skill", "network-meta-analysis-skill", "nhanes-database-skill", "paper-to-ppt-skill", "policy-evaluation-figures-skill", "policy-text-analysis-skill", "propensity-score-skill", "rdd-studio", "research-figure-skill", "research-public-posts-skill", "research-workflow-skill", "sdid-studio", "sem-qca-qualitative-skill", "share-database-skill", "simulation-models-skill", "socialmedicineskills", "staggered-did-skill", "survival-studio", "target-trial-emulation-skill", "teaching-storyboard-ppt-skill", "thesis-defense-ppt-skill", "umbrella-review-skill"]);
 allowed.add('file_download');allowed.add('citation_copy');allowed.add('citation_download');
 const chatAllowed=new Set(['chat_question','chat_answer','chat_clarify','chat_no_match','chat_error','chat_followup','chat_helpful','chat_unhelpful','chat_export']);
 function createTelemetryQueue({send,storage,notify=()=>{},now=Date.now,schedule=setTimeout,cancel=clearTimeout}){
 const key='puxian-events-v2',ttl=24*3600000;let queue=[],busy=false,timer=null,lastSuccess=null,failure=0,rejected=0;
 const valid=x=>x&&typeof x==='object'&&Object.keys(x).every(k=>['id','page','kind','action','queuedAt'].includes(k))&&/^[a-f\d-]{36}$/i.test(x.id)&&/^[a-z]+$/.test(x.page)&&['pageview','click','interaction','selfreport'].includes(x.kind)&&/^[a-z\d_:-]{0,140}$/.test(x.action)&&Number.isFinite(x.queuedAt)&&x.queuedAt<=now()&&now()-x.queuedAt<ttl;
 try{queue=JSON.parse(storage?.getItem(key)||'[]').filter(valid).slice(-100);}catch{}
 function save(){try{storage?.setItem(key,JSON.stringify(queue));}catch{}}
 function status(state){notify({state,pending:queue.length,lastSuccess,rejected});}
 async function flush(){
  if(busy)return;if(timer){cancel(timer);timer=null;}queue=queue.filter(valid);save();if(!queue.length){status(rejected?'rejected':'ready');return;}
  busy=true;status('sending');
  try{while(queue.length){const entry=queue[0],{queuedAt,...event}=entry;const response=await send(event);
   if(response.ok){if(queue[0]?.id===entry.id)queue.shift();lastSuccess=now();failure=0;save();status('ready');}
   else if([400,403,413].includes(response.status)){queue.shift();rejected++;save();status('rejected');}
   else throw new Error('Temporary collection failure');
  }}catch{failure++;status('retrying');timer=schedule(()=>void flush(),Math.min(60000,5000*2**Math.min(failure-1,4)));}finally{busy=false;}
 }
 function enqueue(event){const entry={...event,queuedAt:now()};if(!valid(entry))return false;if(queue.some(x=>x.id===entry.id))return true;if(queue.length>=100){rejected++;status('overflow');return false;}queue.push(entry);save();void flush();return true;}
 status(queue.length?'pending':'ready');return {enqueue,flush,snapshot:()=>({pending:queue.length,lastSuccess,rejected})};
}
 let storage;try{storage=window.sessionStorage;}catch{}
 const queue=createTelemetryQueue({storage,send:async event=>{const r=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',keepalive:true,signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json'},body:JSON.stringify(event)});if(r.ok)window.dispatchEvent(new Event('puxian:tracked'));return r;},notify:detail=>{window.puxianTrackingStatus=detail;window.dispatchEvent(new CustomEvent('puxian:tracking-status',{detail}));}});
 window.puxianRetryTracking=()=>queue.flush();window.addEventListener('online',()=>queue.flush());document.addEventListener('visibilitychange',()=>{if(!document.hidden)queue.flush();});
 function send(kind,action=''){queue.enqueue({id:crypto.randomUUID(),page,kind,action});}
 window.puxianTrackChat=action=>{if(chatAllowed.has(action))send('interaction',action);};
 const platforms=new Set(['unspecified','doubao','chatgpt','codex','claude','other']);
 window.puxianTrackUsage=(id,kind,platform='unspecified')=>{if(!skillIds.has(id)||!platforms.has(platform))return;if(kind==='reported')send('selfreport','skill_reported:'+id+':'+platform);else if(['open','download','copy','platform'].includes(kind))track('skill_'+kind+':'+id+':'+platform);};
 function track(action){const skill=/^skill_(open|download|copy|platform):([a-z0-9-]+)(?::([a-z]+))?$/.exec(action);if(!allowed.has(action)&&!(skill&&skillIds.has(skill[2])&&platforms.has(skill[3]||'unspecified')))return;const now=Date.now();if(now-(last.get(action)||0)<1000)return;last.set(action,now);send('click',action);}
 window.puxianTrackSkill=(id,kind)=>{if(skillIds.has(id)&&['open','download'].includes(kind))track('skill_'+kind+':'+id);};
 window.puxianTrack=track;send('pageview');
 document.addEventListener('click',event=>{
  const chain=event.composedPath();if(chain.some(x=>x instanceof Element&&x.hasAttribute('data-puxian-ignore')))return;const skillItem=chain.find(x=>x instanceof Element&&x.hasAttribute('data-puxian-skill'));
  if(skillItem){window.puxianTrackSkill(skillItem.getAttribute('data-puxian-skill'),skillItem.getAttribute('data-puxian-kind'));return;}
  const a=chain.find(x=>x instanceof HTMLAnchorElement);
  if(a){try{const u=new URL(a.href),g=/^\/socialmedicine\/guides\/([a-z0-9-]+)\.html$/.exec(u.pathname);if(u.origin===location.origin&&g&&skillIds.has(g[1])){window.puxianTrackSkill(g[1],'open');return;}}catch{}}
  if(a){try{const url=new URL(a.href),m=/^\/socialmedicine\/skills\/([a-z0-9-]+)\.md$/.exec(url.pathname);if(url.origin==='https://github.com'&&/^\/naturedu\/socialmedicine\/releases\/(?:latest\/download|download\/[^/]+)\/socialmedicineskills\.zip$/.test(url.pathname)){window.puxianTrackSkill('socialmedicineskills','download');return;}if(url.origin===location.origin&&m&&skillIds.has(m[1])){window.puxianTrackSkill(m[1],a.hasAttribute('download')?'download':'open');return;}if(url.origin===location.origin&&url.pathname==='/socialmedicine/data/method-code-library.zip'){track('skill_bundle_download');return;}if(url.origin===location.origin&&/^https?:$/.test(url.protocol)&&(a.hasAttribute('download')||/\.(zip|csv|xlsx|pdf)$/i.test(url.pathname))){track('file_download');return;}}catch{}}
  const item=chain.find(x=>x instanceof Element&&x.hasAttribute('data-puxian-event'));if(item)track(item.getAttribute('data-puxian-event'));
 },{capture:true});
})();


