const count=value=>{const n=Number(value);if(value===null||value===undefined||!Number.isFinite(n)||n<0)throw new Error('统计字段不完整');return n;};
const since=(day,days)=>new Date(Date.parse(day+'T00:00:00Z')-(days-1)*86400000).toISOString().slice(0,10);
export function socialmedicineSkillUsage(data){
 const row=data?.skills?.find(x=>x.id==='socialmedicineskills');
 return row?{opens:count(row.opens),downloadClicks:count(row.downloads)}:{opens:null,downloadClicks:null};
}
export function summarizeUsage(data){
 if(!data?.totals||!/^\d{4}-\d{2}-\d{2}$/.test(data.today||'')||!Array.isArray(data.daily))throw new Error('统计数据暂不可用');
 const visits=count(data.totals.visits),clicks=count(data.totals.clicks);
 const recent=days=>data.daily.filter(r=>r.day>=since(data.today,days)&&r.day<=data.today).reduce((a,r)=>({visits:a.visits+count(r.visits),clicks:a.clicks+count(r.clicks)}),{visits:0,clicks:0});
 return {visits,clicks,today:recent(1),week:recent(7),month:recent(30),perHundred:visits?clicks/visits*100:null,opens:count(data.skillTotals?.opens),downloads:count(data.skillTotals?.downloads)};
}
export function usageCsv(data){
 const s=summarizeUsage(data),scope=`${data.totals.started||'未开始'} 至 ${data.today}（Asia/Shanghai）`,rows=[['类型','项目','数量','单位','统计范围','数据更新时间']];
 const add=(type,label,n,unit='次',range=scope)=>rows.push([type,label,n,unit,range,data.updatedAt]);
 add('总计','页面访问',s.visits);add('总计','已记录按钮点击',s.clicks);add('Skill','打开',s.opens);add('Skill','下载点击',s.downloads);
 const mainSkill=socialmedicineSkillUsage(data);
 if(mainSkill.opens!==null){add('社会医学主技能','网页打开',mainSkill.opens);add('社会医学主技能','下载点击',mainSkill.downloadClicks);}
 if(data.downloadTotals)add('总计','全部下载点击',count(data.downloadTotals.total));
 if(data.chatTotals)for(const [key,label]of Object.entries({questions:'提问',answered:'已回答',clarifications:'需要补充',unmatched:'未匹配',errors:'回答失败',followups:'追问',helpful:'有帮助',unhelpful:'还没解决',exports:'导出对话'}))add('科研对话',label,count(data.chatTotals[key]),'次',`${data.chatStarted||'2026-10-24'} 至 ${data.today}`);
 for(const p of data.pages||[])add('页面',p.label||p.page,count(p.count));
 for(const a of data.actions||[])add('功能',a.label||a.action,count(a.count));
 for(const k of data.skills||[]){add('Skill打开',k.label||k.id,count(k.opens));add('Skill下载点击',k.label||k.id,count(k.downloads));}
 for(const day of data.daily)if(data.totals.started&&day.day>=data.totals.started){add('每日访问',day.day,count(day.visits),'次',day.day);add('每日点击',day.day,count(day.clicks),'次',day.day);}
 rows.push(['口径','访问不是独立人数；点击只包括预设事件；下载点击不等于下载完成；统计前历史数据不可回溯。','','','','']);
 return '\ufeff'+rows.map(row=>row.map(value=>{let text=String(value??'');if(typeof value==='string'&&/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
}
