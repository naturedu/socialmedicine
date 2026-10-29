export const SERVICE='https://puxian-visit-statistics.dusixian16.chatgpt.site';
export function formatCount(value){
  if(!['number','string'].includes(typeof value)||typeof value==='string'&&!/^\d+$/.test(value.trim()))return '未取得';
  const n=Number(value);return Number.isSafeInteger(n)&&n>=0?n.toLocaleString('zh-CN'):'未取得';
}
export function validStats(data){
  return !!data&&['visits','clicks'].every(k=>formatCount(data.totals?.[k])!=='未取得')&&Number.isFinite(Date.parse(data.updatedAt));
}
export function createStatsClient({fetchImpl=fetch,storage,now=Date.now,endpoint=SERVICE+'/api/stats',archiveUrl=null}={}){
  const key='puxian-public-stats-v1';let saved=null,lastResult=null,lastAttempt=0,inflight=null;
  try{const data=JSON.parse(storage?.getItem(key)||'null');if(validStats(data))saved=data;}catch{}
  const withMeta=(data,state,error)=>({...data,clientMeta:{state,lastAttempt:new Date(lastAttempt).toISOString(),error:error||null,sourceLabel:state==='live'?'统计服务实时返回':state==='archive'?'本站保存的真实统计历史快照':'此浏览器上次成功读取的公开汇总',endpoint}});
  async function read({force=false}={}){
    if(inflight)return inflight;
    if(!force&&lastAttempt&&now()-lastAttempt<15000){if(lastResult)return lastResult;throw new Error('统计服务暂时不可用，当前次数尚未取得。');}
    lastAttempt=now();
    inflight=(async()=>{
      try{
        const response=await fetchImpl(endpoint,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(8000)});
        if(!response.ok)throw new Error('HTTP '+response.status);
        const data=await response.json();if(!validStats(data))throw new Error('统计返回字段不完整');
        const {clientMeta,...publicData}=data;saved=publicData;
        try{storage?.setItem(key,JSON.stringify(publicData));}catch{}
        lastResult=withMeta(publicData,'live');return lastResult;
      }catch(error){
        if(saved){lastResult=withMeta(saved,'cached',error.message);return lastResult;}
        if(archiveUrl){
          try{
            const response=await fetchImpl(archiveUrl,{credentials:'omit',signal:AbortSignal.timeout(5000)});
            if(!response.ok)throw new Error('归档未取得');
            const archive=await response.json();if(!validStats(archive))throw new Error('归档字段不完整');
            const {clientMeta,...publicData}=archive;
            lastResult=withMeta(publicData,'archive',error.message);return lastResult;
          }catch{/* A missing archive is not a zero counter. */}
        }
        throw new Error('统计服务暂时不可用，当前次数尚未取得。资料阅读和任务书仍可使用。');
      }finally{inflight=null;}
    })();
    return inflight;
  }
  return {read};
}
let storage;try{storage=globalThis.localStorage;}catch{}
const client=createStatsClient({storage,archiveUrl:new URL('./data/usage-stats-snapshot.json',import.meta.url).href});
export const fetchUsageStats=options=>client.read(options);
