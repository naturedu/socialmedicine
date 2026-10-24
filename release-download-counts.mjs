// Read aggregate counters only: no token, user identifier or event upload.
export async function readReleaseCounts(repo,names,get=async path=>{
 const r=await fetch('https://api.github.com'+path,{credentials:'omit',cache:'no-store',headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new Error('GitHub counters unavailable');return r.json();
}){
 if(!/^[\w.-]+\/[\w.-]+$/.test(repo))throw new Error('Invalid repository');
 async function all(path){const rows=[];for(let page=1;;page++){const batch=await get(path+`?per_page=100&page=${page}`);if(!Array.isArray(batch))throw new Error('Invalid response');rows.push(...batch);if(batch.length<100)return rows;}}
 const assets=[];
 for(const release of await all(`/repos/${repo}/releases`)){
  if(release.draft||release.prerelease)continue;
  if(!Number.isSafeInteger(release.id)||!release.published_at)throw new Error('Invalid release');
  for(const a of await all(`/repos/${repo}/releases/${release.id}/assets`)){
   if(!names.includes(a.name))continue;
   if(a.state!=='uploaded'||!Number.isSafeInteger(a.id)||!Number.isSafeInteger(a.download_count)||a.download_count<0)throw new Error('Invalid asset');
   assets.push({id:a.id,name:a.name,tag:release.tag_name,downloadCount:a.download_count,available:true});
  }
 }
 if(new Set(assets.map(a=>a.id)).size!==assets.length)throw new Error('Duplicate assets');
 return assets;
}
export function mergeLiveCounts(snapshot,current,names){
 const assets=new Map((snapshot?.assets||[]).map(a=>[a.id,{...a,available:false}]));
 for(const a of current){const old=assets.get(a.id);if(old&&a.downloadCount<old.downloadCount)throw new Error('Counter regressed');assets.set(a.id,{...old,...a});}
 const rows=[...assets.values()];return {assets:rows,observedTotal:rows.reduce((n,a)=>n+a.downloadCount,0),availableTotal:current.reduce((n,a)=>n+a.downloadCount,0),byPackage:Object.fromEntries(names.map(name=>[name,rows.filter(a=>a.name===name).reduce((n,a)=>n+a.downloadCount,0)]))};
}
