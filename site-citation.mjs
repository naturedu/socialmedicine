const host=document.getElementById('siteCitation');
if(host){
 const today=new Date(),date=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
 const citation=`杜思娴. 普贤 社医卫管科研助手[EB/OL]. [引用日期：${date}]. https://naturedu.github.io/socialmedicine/.`;
 const style=document.createElement('style');style.textContent='.puxian-citation{flex:1 0 100%;max-width:1180px;width:100%;margin:18px auto 0;padding:18px 24px;border-top:1px solid #dce0d5;font:12px/1.9 system-ui,sans-serif;color:#52665d;box-sizing:border-box}.puxian-citation strong{color:#234b3c}.puxian-citation p{margin:6px 0;overflow-wrap:anywhere}.puxian-citation button{border:1px solid #b8c9bc;border-radius:4px;background:#fffefa;color:#234b3c;padding:5px 12px;cursor:pointer;font:inherit}.puxian-citation textarea{width:100%;box-sizing:border-box}.puxian-citation button:focus-visible{outline:3px solid #91b68a;outline-offset:2px}footer:has(>.puxian-citation){flex-wrap:wrap}';
 host.append(style);
 const heading=document.createElement('strong');heading.textContent='引用本站';host.append(heading);
 const text=document.createElement('p');text.textContent=citation;host.append(text);
 const button=document.createElement('button');button.type='button';button.textContent='复制引用';host.append(button);
 const status=document.createElement('span');status.setAttribute('role','status');status.style.marginLeft='12px';host.append(status);
 button.onclick=async()=>{try{await navigator.clipboard.writeText(citation);status.textContent='已复制完整引用。';}catch{status.textContent='请在下方选中并复制。';let field=host.querySelector('textarea');if(!field){field=document.createElement('textarea');field.rows=3;field.readOnly=true;field.setAttribute('aria-label','本站完整引用');host.append(field);}field.value=citation;field.focus();field.select();}};
 const note=document.createElement('p');note.textContent='引用日期按本次打开页面的日期生成；文献、图表和数据库请同时引用各条目原始来源。';host.append(note);
}
