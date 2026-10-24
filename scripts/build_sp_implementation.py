"""Refresh only the two authored method records and their teaching code indexes."""
from pathlib import Path
import json,re,csv,io,hashlib
ROOT=Path(__file__).resolve().parents[1]
DEFS=[dict(id='standardized-patient-skill',stem='standardized_patient',title='模拟与标准化病人 SP / USP',group='A',order=6,tags='标准化病人 模拟病人 SP USP OSCE 服务质量',intro='用训练过的扮演者在统一情境下测量服务过程，区分教学考核与未预先告知的质量研究。',prepare='先明确场景、剧本、评分依据、伦理安全、机构抽样、重复访问与识别记录。',example='例如：按机构比较基层规范处置率，再检查扮演一致性与识别风险。'),dict(id='implementation-science-skill',stem='implementation_science',title='实施科学：从框架到研究设计',group='F',order=1,tags='实施科学 CFIR RE-AIM Proctor ERIC hybrid StaRI',intro='区分服务干预与实施策略，把障碍、策略、实施结局、健康结局和持续使用连接到具体设计。',prepare='先明确服务证据、策略执行者、主要结局、层级、分母与时间窗；框架不能代替识别设计。',example='例如：评价培训与反馈策略是否提高机构采纳和目标人群触达，同时观察服务质量。')]
def read(n):return json.loads((ROOT/'data'/f'{n}.json').read_text(encoding='utf-8'))
def write(n,d):(ROOT/'data'/f'{n}.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def upsert(rows,item,key='id'):
 for i,x in enumerate(rows):
  if x.get(key)==item[key]:rows[i]=item;return
 rows.append(item)
def csv_write(name,rows):
 target=ROOT/'data'/f'{name}.csv'
 with target.open('r',encoding='utf-8-sig',newline='') as f:fields=next(csv.reader(f))
 with target.open('w',encoding='utf-8',newline='') as f:
  w=csv.DictWriter(f,fields,extrasaction='ignore');w.writeheader();w.writerows({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in x.items()} for x in rows)
def build():
 methods=read('studio-methods');guide=read('method-guide');codes=read('code-library');tools=read('tools');library=read('studio-library');quick=read('methods');extension=read('methods-extension')
 for d in DEFS:
  p=ROOT/'skills'/f"{d['id']}.md";text=p.read_text(encoding='utf-8').split('<!-- BEGIN TEACHING CODE -->')[0].rstrip()
  snippets=[]
  text+='\n\n<!-- BEGIN TEACHING CODE -->\n\n## 教学代码：可以单独下载，也可展开复制\n'
  for language,ext in [('r','R'),('stata','do')]:
   file=f"{d['stem']}_demo.{ext}";code=(ROOT/'skills/scripts'/file).read_text(encoding='utf-8').rstrip();heading='机构层级分析 · '+language.upper()
   text+=f'\n### {heading}\n\n[下载脚本](scripts/{file})\n\n```{language}\n{code}\n```\n'
   snippets.append(dict(lang=language,heading=heading,code=code))
  p.write_text(text,encoding='utf-8')
  status='R 4.6.1模拟示例已运行；Stata未执行；不代表真实数据验证'
  upsert(methods,dict(id=d['id'],title=d['title'],tags=d['tags'],use=d['intro'],url=f"guides/{d['id']}.html",codes=snippets,status=status))
  upsert(guide['skills'],{k:d[k] for k in ['id','title','group','order','intro','prepare','example']})
  codes=[x for x in codes if x.get('source')!=f"skills/{d['id']}.md"]
  for i,s in enumerate(snippets,1):
   line=text[:text.index('```'+s['lang']+'\n'+s['code'])].count('\n')+2
   codes.append(dict(id=f"{d['id']}-{i}",title=d['title']+' · '+s['heading'],language=s['lang'],source=f"skills/{d['id']}.md",line=line,code=s['code'],status='R 4.6.1 已运行教学模拟与断言；未验证真实研究数据' if s['lang']=='r' else 'Stata教学模板；未执行'))
  upsert(tools,dict(name=d['title'],category='研究设计',description=d['intro'],url=f"skills/{d['id']}.md",tags=d['tags'].split()),'name')
  entry=dict(id='skill-'+d['id'],title=d['title'],journal='方法 Skill',year='2026',kind='方法 Skill',text=d['intro']+'\n'+d['prepare']+'\n'+re.sub(r'```[\s\S]*?```','[教学代码见手册]',text),url=f"guides/{d['id']}.html",locator='本站原创方法手册',license='本站原创说明与代码；参考论文各自保留权利',verified='2026-10-24；来源登记另列；R模拟已执行')
  upsert(library,entry)
  existing=next((x for x in quick if x['name']==d['title']),None)
  qid=existing['id'] if existing else d['group']+str(1+max([int(x['id'][1:]) for x in quick if re.fullmatch(d['group']+r'\d+',x['id'])]+[0]))
  q=dict(id=qid,cat=d['group'],name=d['title'],use=d['intro'],guide=d['id'],keywords=d['tags'],pitfall=d['prepare'],report='报告设计、分母、层级、执行状态与证据边界。')
  preview=f"**适用**：{d['intro']}\n\n**准备**：{d['prepare']}\n\n**代码**与完整说明：\n\n"+text
  upsert(quick,dict(id=qid,name=d['title'],category=d['group'],content=preview,source=f"guides/{d['id']}.html"));upsert(extension,q);upsert(guide['quick'],dict(id=qid,title=d['title'],group=d['group'],order=d['order'],intro=d['intro'],prepare=d['prepare'],example=d['example'],source=f"skills/{d['id']}.md"))
 for name,data in [('studio-methods',methods),('method-guide',guide),('code-library',codes),('tools',tools),('studio-library',library),('methods',quick),('methods-extension',extension)]:write(name,data)
 for name,data in [('code-library',codes),('tools',tools),('methods',quick)]:csv_write(name,data)
 if (ROOT/'data/method-authorities.json').exists():
  authorities=read('method-authorities');sources=read('sp-implementation-sources')
  for s in sources:
   sid='sp-impl-'+s['id'];authorities['sources'][sid]=dict(id=sid,title=s['title'],url=s['url'],type='原始方法论文或官方指南',scope=s.get('use','研究设计与测量'),checkedDate=s['checked_date'],verification=s['verification_state'],verificationScope=s['verification_scope'])
  for d in DEFS:
   selected=sources[:3] if d['id']=='standardized-patient-skill' else sources[3:]
   ids=['sp-impl-'+s['id'] for s in selected]
   q=next(x for x in quick if x['name']==d['title']);authorities['methods'][q['id']]=ids;authorities['skills'][d['id']]=ids
  write('method-authorities',authorities)
 print('Updated 2 method guides; total',len(methods),'workbench methods,',len(quick),'quick entries,',len(codes),'code snippets')
if __name__=='__main__':build()
