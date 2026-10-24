export function filterNsfc(rows,state={}){
 const terms=String(state.query||'').normalize('NFKC').trim().toLowerCase().split(/\s+/).filter(Boolean);
 return rows.filter(r=>(!state.year||r.date===state.year)&&(!state.topic||r.topics.includes(state.topic))&&(!state.organization||r.organization===state.organization)&&(!state.economic||r.economics_policy)&&terms.every(t=>[r.title,r.organization,...r.topics,...r.keywords].join(' ').normalize('NFKC').toLowerCase().includes(t)));
}
export function nsfcCsv(rows){
 const fields=['date','title','organization','project_type','category_note','discipline','topics','keywords','verification','official_lookup','source_refs'];
 const cell=v=>{let s=Array.isArray(v)?v.join('；'):String(v??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 return '\uFEFF'+[fields,...rows.map(r=>fields.map(k=>r[k]))].map(r=>r.map(cell).join(',')).join('\r\n');
}
