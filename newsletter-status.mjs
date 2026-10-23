const status=document.getElementById('newsletterStatus'),entry=document.getElementById('newsletterEntry');
if(status&&entry){
 const endpoint='https://puxian-visit-statistics.greycarp257.chatgpt.site';
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),6000);
 try{
  const response=await fetch(endpoint+'/api/newsletter/status',{credentials:'omit',signal:controller.signal});if(!response.ok)throw new Error();
  const data=await response.json();if(typeof data.enabled!=='boolean')throw new Error();
  status.textContent=data.enabled?'月报订阅已开放。请在订阅页面填写邮箱，再到邮箱确认。':'邮件订阅尚未开放，暂不收集邮箱。你可以先使用本站 Skill 与 SCI 指南。';
  entry.hidden=false;entry.href=endpoint+'/newsletter';entry.textContent=data.enabled?'打开月报与订阅页面 ↗':'查看月报与服务状态 ↗';
 }catch{status.textContent='暂时无法确认邮件服务状态；本站未收集邮箱。方法手册与 SCI 指南可正常使用。';}
 finally{clearTimeout(timeout);}
}
