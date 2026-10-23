const box=document.getElementById('projectCoverage');
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
if(box){
 try{
  const response=await fetch(new URL('./data/project-coverage.json',import.meta.url));if(!response.ok)throw new Error();const data=await response.json();
  const wrap=make('div');wrap.style.overflowX='auto';const table=make('table');table.style.cssText='width:100%;border-collapse:collapse;font-size:13px';
  const head=make('tr');['年份','来源','所列附件解析条数','本站题名候选','覆盖与原名单'].forEach(x=>head.append(make('th',x)));const thead=make('thead');thead.append(head);table.append(thead);const body=make('tbody');
  for(const row of data.coverage){const tr=make('tr');for(const value of [row.year,row.provider,row.parsedRows??'未取得',row.selectedRows])tr.append(make('td',String(value)));const detail=make('td');detail.append(make('p',row.note));const sources=make('details'),summary=make('summary','原名单与版本（'+row.sources.length+' 份）');sources.append(summary);for(const source of row.sources){const p=make('p'),a=make('a',source.label+' ↗');if(/^https?:\/\//.test(source.url)){a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';}p.append(a);sources.append(p);}detail.append(sources);tr.append(detail);body.append(tr);}
  table.append(body);table.querySelectorAll('td,th').forEach(c=>c.style.cssText='padding:10px 12px;border-bottom:1px solid #dce5d8;text-align:left;vertical-align:top');wrap.append(table);box.replaceChildren(make('p',data.scope+' 更新：'+data.updated),wrap,make('p','“解析条数”仅对应上列附件，既不是全国年度总量，也不是本领域项目总量。'));
 }catch{box.textContent='年度覆盖文件暂时未能载入。请刷新，或打开 data/project-coverage.json 查看；不以 0 替代缺失。';}
}
