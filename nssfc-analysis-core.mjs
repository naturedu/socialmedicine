export const normalize=value=>String(value??'').normalize('NFKC').trim();
export function filterProjects(rows,state={}){
 const terms=normalize(state.query).toLowerCase().split(/\s+/).filter(Boolean);
 return rows.filter(r=>r.approval_status==='approved'&&(!state.year||r.date===state.year)&&(!state.kind||r.project_type.startsWith(state.kind))&&(!state.scope||r.scope_groups.includes(state.scope))&&(!state.topic||r.topics.includes(state.topic))&&(!state.organization||r.organization_normalized===state.organization)&&terms.every(t=>normalize([r.title,r.organization,...r.keywords].join(' ')).toLowerCase().includes(t)));
}
export function frequencies(rows,field){
 const counts=new Map();for(const r of rows){const values=Array.isArray(r[field])?[...new Set(r[field])]:[r[field]];for(const v of values)if(v)counts.set(v,(counts.get(v)||0)+1);}
 return [...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,'zh-CN'));
}
export const mechanicalPair=(a,b)=>a.includes(b)||b.includes(a)||[a,b].includes('数字化')&&[a,b].includes('数字政府');
export function cooccurrences(rows,minCount=3){
 const counts=new Map(),frequency=new Map();
 for(const r of rows){const words=[...new Set(r.keywords)].sort();for(const w of words)frequency.set(w,(frequency.get(w)||0)+1);for(let i=0;i<words.length;i++)for(let j=i+1;j<words.length;j++){const a=words[i],b=words[j];if(mechanicalPair(a,b))continue;const key=JSON.stringify([a,b]);counts.set(key,(counts.get(key)||0)+1);}}
 return [...counts].filter(([,n])=>n>=minCount).map(([key,count])=>{const [a,b]=JSON.parse(key);return {a,b,count,jaccard:count/(frequency.get(a)+frequency.get(b)-count)};}).sort((a,b)=>b.count-a.count||a.a.localeCompare(b.a,'zh-CN'));
}
export function csvText(rows){
 const fields=['date','title','organization','category','project_type','topics','keywords','status','notice','source','locator'];
 const cell=value=>{let text=Array.isArray(value)?value.join('；'):String(value??'');if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 return '\uFEFF'+[fields,...rows.map(r=>fields.map(f=>r[f]))].map(r=>r.map(cell).join(',')).join('\r\n');
}
