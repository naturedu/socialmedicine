// Only fixed event identifiers enter this session-scoped queue. Never pass research text.
export function createTelemetryQueue({send,storage,notify=()=>{},now=Date.now,schedule=setTimeout,cancel=clearTimeout}){
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
