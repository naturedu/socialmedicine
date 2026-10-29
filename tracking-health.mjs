const host=document.getElementById('usageDashboard');
if(host){
 const box=document.createElement('section');box.className='tracking-health';box.setAttribute('aria-label','本机记录状态');
 const title=document.createElement('strong');title.textContent='本机记录状态';const p=document.createElement('p');p.setAttribute('role','status');
 const b=document.createElement('button');b.type='button';b.textContent='重试待发送记录';b.onclick=()=>window.puxianRetryTracking?.();
 const note=document.createElement('p');note.textContent='仅暂存预设事件编号，最多100条、24小时；当前标签页关闭后待发送记录可能丢失。重试保留同一编号防止重复累计；按服务器接收日期计数。浏览器拦截或未接入期间的历史点击无法补回。';box.append(title,p,b,note);host.before(box);
 function render(s=window.puxianTrackingStatus){const local=['localhost','127.0.0.1'].includes(location.hostname);if(local){p.textContent='本地预览，不写线上计数。';b.disabled=true;return;}if(navigator.doNotTrack==='1'){p.textContent='浏览器已启用 Do Not Track，尊重设置，不记录访问。';b.disabled=true;return;}
  box.dataset.state=s?.state||'loading';p.textContent=!s?'记录脚本尚未就绪，请刷新或检查浏览器拦截。':`待发送 ${s.pending} 条；${s.state==='retrying'?'服务未确认，正在等待重试。':s.rejected?'有记录未被接收，请刷新页面后再试。':s.lastSuccess?'最近收到服务器确认：'+new Date(s.lastSuccess).toLocaleTimeString('zh-CN'):'等待本页首条记录确认。'}`;b.disabled=!s?.pending;}
 window.addEventListener('puxian:tracking-status',e=>render(e.detail));render();
}
