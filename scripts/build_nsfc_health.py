"""Read local management/economics NSFC compilations; publish whitelisted metadata only.

Requires openpyxl and xlrd. Original workbooks and proposal PDFs are never copied.
Usage: python scripts/build_nsfc_health.py --input <local-source-directory>
"""
from pathlib import Path
from collections import Counter
from itertools import combinations
import argparse,csv,hashlib,json,re,unicodedata,html
import xlrd
from openpyxl import load_workbook

ROOT=Path(__file__).resolve().parents[1]
OFFICIAL='https://kd.nsfc.cn/'
DEPARTMENT='https://www.nsfc.gov.cn/p1/2857/3201/3210/glkxsc.html'
HEALTH=r'健康|医疗|医保|卫生|医院|医患|医护|医药|医养|养老|老龄|老年|照护|护理|慢病|慢性病|疾病|高血压|糖尿病|心血管|精神障碍|传染病|疫情|疫苗|疾控|癌症|肿瘤|抑郁|心理健康|心理压力|心理应激|心理危机|心理困扰|心理调适|生育|托育|残疾|残障|康复|失能|公共营养|食品安全|职业伤害|工伤|预期寿命|人口寿命|死亡率|肥胖|吸烟|控烟'
FALSE=r'(?:产业|经济|市场|企业|组织|金融|财政|设备|机械|结构|电池|生态系统|河流|森林|植物|土壤|网络生态|网络空间|大坝|桥梁).{0,2}健康(?:发展)?'
TOPICS={
 '医疗服务与医院管理':r'医疗|医院|医患|医护|分级诊疗|家庭医生|卫生服务|医联体|医共体',
 '医保支付与卫生经济':r'医保|医疗保险|医疗保障|卫生经济|健康经济|医疗费用|医疗支出|按病种|DRG|DIP|长期护理保险|疾病负担',
 '老龄养老与长期照护':r'老年|老龄|养老|照护|护理|医养|失能|适老|银发|失智',
 '公共卫生与风险治理':r'公共卫生|疫情|传染病|疾控|疾病预防|疫苗|食品安全|公共健康|公共营养',
 '健康行为与心理健康':r'健康行为|健康素养|健康促进|心理|抑郁|吸烟|控烟|肥胖|健康信息|健康传播|健康信念',
 '健康公平与社会环境':r'健康公平|健康不平等|健康差异|健康贫困|环境.{0,8}健康|污染.{0,8}健康|社会资本.{0,8}健康|职业.{0,8}健康|工伤|职业伤害',
 '人口生育与家庭健康':r'生育|托育|妇幼|母婴|儿童|青少年|生殖|分娩|人口.{0,8}健康',
 '药品与健康技术管理':r'医药|药品|药物|药事|疫苗|医疗器械|医疗技术|健康技术|卫生技术',
 '数字健康与资源配置':r'互联网.{0,8}医|智慧.{0,6}(医|健康|养老)|数字.{0,8}(医|健康|养老)|远程医疗|在线医疗|线上医疗|医疗资源|卫生资源',
 '慢病管理与健康测量':r'慢病|慢性病|糖尿病|高血压|心血管|疾病管理|健康管理|健康效用|生命质量|健康相关生命质量',
}
WORDS={k:v for k,v in [
 ('医疗服务',r'医疗服务'),('医院',r'医院'),('医保',r'医保|医疗保险|医疗保障'),('支付改革',r'支付改革|支付方式|按病种|DRG|DIP'),('医疗费用',r'医疗费用|医疗支出'),('卫生经济',r'卫生经济|健康经济'),('养老',r'养老'),('老龄化',r'老龄'),('老年人',r'老年'),('长期照护',r'照护|长期护理'),('护理',r'护理'),('医养结合',r'医养'),('公共卫生',r'公共卫生'),('疫情',r'疫情|新冠'),('慢性病',r'慢病|慢性病'),('心理健康',r'心理|抑郁'),('健康行为',r'健康行为|健康素养|健康促进'),('健康公平',r'健康公平|健康不平等|健康差异'),('生育',r'生育'),('儿童',r'儿童|青少年'),('药品',r'药品|药物|医药'),('环境污染',r'污染'),('健康风险',r'健康风险'),('数字化',r'数字|互联网|在线|线上|智慧'),('人工智能',r'人工智能|大模型'),('大数据',r'大数据'),('资源配置',r'资源配置|资源分配|资源优化'),('供需匹配',r'供需|需求|供给'),('政策评估',r'政策评估|政策评价|政策效应|政策效果'),('因果识别',r'因果|准自然实验|双重差分'),('城乡',r'城乡|农村|乡村'),('流动人口',r'流动人口|农民工'),('基层',r'基层|社区'),('公平',r'公平|不平等'),('治理',r'治理'),('激励',r'激励'),('行为',r'行为') ]}

def clean(x):
 if x is None:return ''
 if isinstance(x,float) and x.is_integer():return str(int(x))
 return re.sub(r'\s+',' ',unicodedata.normalize('NFKC',html.unescape(str(x)))).strip()

def norm(x):return re.sub(r'[\W_]+','',clean(x)).lower()

def health_labels(title):
 text=re.sub(FALSE,'',title)
 if re.search(r'剩余寿命|工程系统|机械系统|风力发电|机载电子|发动机|电池|桥梁|大坝',text) and not re.search(r'医疗|患者|人群|居民|老年|职业',text):return None
 if not re.search(HEALTH,text,re.I):return None
 topics=[k for k,v in TOPICS.items() if re.search(v,text,re.I)] or ['健康治理综合']
 return topics,[k for k,v in WORDS.items() if re.search(v,text,re.I)]

def pick(row,*names):return next((clean(row[k]) for k in names if clean(row.get(k))), '')

def rows_from_xls(path):
 book=xlrd.open_workbook(path);rows=[];sheets=[]
 # The combined 2010–2019 sheet is the primary series. Other old-year sheets
 # have overlapping projects and heterogeneous year definitions; do not pool them.
 for name in ['2010-2019年','2020','2021','2022','2023年']:
  sheet=book.sheet_by_name(name);headers=[clean(x) for x in sheet.row_values(0)];count=0
  for i in range(1,sheet.nrows):
   raw=dict(zip(headers,sheet.row_values(i)))
   title=pick(raw,'项目名称','项目标题','名称');org=pick(raw,'依托单位','单位')
   if not title or not org:continue
   year=pick(raw,'年份','批准年份') or name[:4]
   if not re.fullmatch(r'20\d{2}',year):raise ValueError('Unexpected year')
   code=pick(raw,'申请代码');department=pick(raw,'所属学部','所在学部')
   if not (code.startswith('G') or department=='管理科学部'):continue
   rows.append(dict(date=year,title=title,organization=org,project_type=pick(raw,'项目类型','资助类别') or '原表未列',
    discipline='管理科学部（原表标注）',source_sheet=name,
    _code=pick(raw,'项目批准号','项目编号'),_person=pick(raw,'项目负责人','负责人')));count+=1
  sheets.append(dict(name=name,readRows=sheet.nrows-1,usableRows=count))
 skipped=[dict(name=s.name,rows=s.nrows-1,reason='与2010—2019主表年份重叠，口径不同，未重复合并') for s in book.sheets() if s.name not in [x['name'] for x in sheets]]
 return rows,sheets,skipped

def rows_from_xlsx(path,year,mixed=False):
 book=load_workbook(path,read_only=True,data_only=True);rows=[];sheets=[];skipped=[]
 school_mode='分学校版' in path.name
 for sheet in book:
  if sheet.title=='Sheet4':
   skipped.append(dict(name=sheet.title,reason='院校汇总计数表，不是逐项记录'));continue
  headers=None;org='';count=0;uncertain=0;total=0
  for values in sheet.values:
   cells=[clean(x) for x in values]
   if '项目名称' in cells:
    headers=cells;continue
   if school_mode and cells and re.match(r'^[一二三四五六七八九十百\d]+[、.．]',cells[0]):
    org=re.sub(r'^[一二三四五六七八九十百\d]+[、.．]\s*','',cells[0]);continue
   if not headers:continue
   raw={k:v for k,v in zip(headers,cells) if k}
   title=pick(raw,'项目名称');unit=pick(raw,'学校名称','学校') or (org if school_mode else '')
   kind=pick(raw,'项目类型','项目类别')
   if len(title)<5 or not unit:continue
   total+=1
   # A mixed natural/social compilation cannot establish ambiguous funding types.
   if re.search('社科|社会科学',kind) or (mixed and not re.search('自然科学|科学基金|面上项目|地区.*基金|外国学者',kind)):
    uncertain+=1;continue
   rows.append(dict(date=str(year),title=title,organization=unit,project_type=kind or '原表未列',
    discipline='经管类汇编（学部待核）',source_sheet=sheet.title,_code='',_person=pick(raw,'负责人')));count+=1
  sheets.append(dict(name=sheet.title,readRows=total,usableRows=count,excludedUncertainFunder=uncertain))
 book.close();return rows,sheets,skipped

def write_json(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def write_csv(path,rows,fields=None):
 fields=fields or list(rows[0])
 with path.open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fields,extrasaction='ignore');w.writeheader()
  for row in rows:
   out={k:'；'.join(map(str,v)) if isinstance(v,list) else v for k,v in row.items() if k in fields}
   for k,v in out.items():
    if isinstance(v,str) and v.startswith(('=','+','-','@')):out[k]="'"+v
   w.writerow(out)

def main(source,root=ROOT):
 files=[next(source.rglob('2010-2023国自科.xls'))]
 for pattern in ['*分学校版*.xlsx','*分专业版*.xlsx','2025经管类国自科项目.xlsx','2025年已发布国自然、社科清单.xlsx']:
  matches=list(source.rglob(pattern));assert len(matches)==1,pattern;files+=matches
 records=[];manifest=[]
 for n,path in enumerate(files,1):
  key=f'nsfc-compilation-{n}'
  rows,sheets,skipped=rows_from_xls(path) if path.suffix=='.xls' else rows_from_xlsx(path,2024 if '2024' in path.name else 2025,'社科' in path.name)
  for r in rows:r['_source']=key
  records+=rows
  manifest.append(dict(id=key,filename=path.name,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),sheets=sheets,skippedSheets=skipped,provenance='用户提供的第三方清单汇编；非本次从基金委逐项提取',officialVerification=OFFICIAL))
 # Dedup uses private in-memory identifiers first and normalized title + unit second.
 # Only whitelisted records below are written. No raw workbooks/cache are copied.
 unique=[];codes={};keys={};people={};duplicates=0;conflicts=0;hierarchy_merges=0
 for r in records:
  k=(r['date'],norm(r['title']),norm(r['organization']))
  existing=codes.get(r['_code']) if r['_code'] else None
  if existing is None:existing=keys.get(k)
  # Match school/professional versions only with the same private person,
  # year, compatible institution hierarchy and exact/prefix title evidence.
  if existing is None and r['_person'] and int(r['date'])>=2024:
   for candidate in people.get((r['date'],norm(r['_person'])),[]):
    old=unique[candidate];u,v=norm(old['organization']),norm(r['organization']);a,b=norm(old['title']),norm(r['title'])
    if (u.startswith(v) or v.startswith(u)) and min(len(a),len(b))>=14 and (a.startswith(b) or b.startswith(a)):
     existing=candidate;hierarchy_merges+=1;break
  ref=r['_source']+' / '+r['source_sheet']
  if existing is not None:
   old=unique[existing]
   if r['_code'] and (norm(old['title'])!=norm(r['title']) or norm(old['organization'])!=norm(r['organization'])):
    conflicts+=1;continue
   if old['_person'] and r['_person'] and norm(old['_person'])!=norm(r['_person']):
    conflicts+=1;continue
   if ref not in old['source_refs']:old['source_refs'].append(ref)
   if int(r['date'])>=2024:
    if len(r['title'])>len(old['title']):old['title']=r['title']
    if norm(old['project_type'])!=norm(r['project_type']):old['_type_variants'].add(r['project_type'])
   duplicates+=1;continue
  r['source_refs']=[ref];r['_type_variants']={r['project_type']};index=len(unique);unique.append(r);keys[k]=index
  if r['_person']:people.setdefault((r['date'],norm(r['_person'])),[]).append(index)
  if r['_code']:codes[r['_code']]=index
 selected=[]
 for r in unique:
  labels=health_labels(r['title'])
  if not labels:continue
  if int(r['date'])>=2024 and not re.search(r'管理|治理|经济|政策|服务|医疗|医保|医院|养老|老龄|老年|生育|行为|干预|成本|定价|公平|不平等|就业|照护|照料|效益|消费者|康复|支付|卫生|疫情|决策|健康信息',r['title']):continue
  topics,keywords=labels
  payload={k:r[k] for k in ['date','title','organization','project_type','discipline','source_refs']}
  if len(r['_type_variants'])>1:payload['category_note']='汇编版本的类别表述不一致，暂沿用优先来源，须官方核验'
  payload.update(id='nsfc-public-'+hashlib.sha256('|'.join([r['date'],norm(r['title']),norm(r['organization'])]).encode()).hexdigest()[:24],funder='国自然',topics=topics,keywords=keywords,
   economics_policy=bool(re.search(r'经济|医保|保险|支付|费用|支出|成本|价格|补偿|激励|政策|公平|不平等|治理|资源配置',r['title'])),
   verification='汇编记录；未逐项官方核验',official_lookup=OFFICIAL)
  selected.append(payload)
 selected.sort(key=lambda r:(-int(r['date']),r['organization'],r['title']))
 assert len({r['id'] for r in selected})==len(selected)
 topic_counts=Counter(t for r in selected for t in r['topics']);org_counts=Counter(r['organization'] for r in selected)
 word_counts=Counter(w for r in selected for w in r['keywords']);pair_counts=Counter(p for r in selected for p in combinations(sorted(set(r['keywords'])),2))
 pairs=[dict(a=a,b=b,count=n,jaccard=round(n/(word_counts[a]+word_counts[b]-n),4)) for (a,b),n in pair_counts.items() if n>=3 and a not in b and b not in a]
 pairs.sort(key=lambda p:-p['count'])
 annual=[]
 for year in range(1991,2026):
  base=[r for r in unique if r['date']==str(year)];sr=[r for r in selected if r['date']==str(year)]
  annual.append(dict(year=year,compilationRecords=len(base) if base else None,healthRecords=len(sr) if base else None,
   topics=dict(Counter(t for r in sr for t in r['topics'])),coverage='本地管理科学部汇编，完整性未核验' if 2010<=year<=2023 else '经管院校局部汇编，完整性未核验' if year>=2024 else '未提供可用国自然清单'))
 changes=[]
 before=[r for r in selected if 2010<=int(r['date'])<=2014];after=[r for r in selected if 2019<=int(r['date'])<=2023]
 for topic in topic_counts:
  a=sum(topic in r['topics'] for r in before);b=sum(topic in r['topics'] for r in after)
  changes.append(dict(topic=topic,before=a,beforeDenominator=len(before),beforePercent=round(100*a/len(before),2),after=b,afterDenominator=len(after),afterPercent=round(100*b/len(after),2),differencePoints=round(100*b/len(after)-100*a/len(before),2)))
 changes.sort(key=lambda x:-x['differencePoints'])
 limitations=['实际可用国自然条目为2010—2025年；1991—2009年未提供可用国自然项目清单，缺失不作零值。','本库来自第三方汇编，未完成逐项官方核验；官网入口仅供复核，不表示基金委已验证本库每条记录。','2024—2025年主要是部分经管院校，不能把年度条目变化解释为全国资助趋势。','按题名关键词筛选，未阅读申请书；可能漏检或误检，主题为本站标注。','保留原单位层级；机构频次不是学术质量排名、立项率或获批难度。','主题可以交叉；共现不代表因果关系，时期比例仅描述本汇编相关条目构成。','完整申请书、人员、批准号、申请代码、经费及本地路径均不公开。']
 stats=dict(updated='2026-10-24',projects=len(selected),institutions=len(org_counts),sourceFiles=len(files),inputRows=len(records),uniqueCompilationRows=len(unique),duplicateRows=duplicates,conflictingRowsExcluded=conflicts,hierarchyVersionMerges=hierarchy_merges,
  economicsPolicyProjects=sum(r['economics_policy'] for r in selected),institutionsTop=[dict(name=k,count=v) for k,v in org_counts.most_common()],topics=[dict(name=k,count=v) for k,v in topic_counts.most_common()],keywords=[dict(name=k,count=v) for k,v in word_counts.most_common()],annual=annual,cooccurrence=pairs,changes=changes,limitations=limitations)
 data=root/'data';data.mkdir(exist_ok=True,parents=True)
 for name,value in [('nsfc-health-projects',selected),('nsfc-health-analysis',stats),('nsfc-health-sources',manifest)]:write_json(data/(name+'.json'),value)
 fields=['date','title','organization','project_type','category_note','discipline','topics','keywords','economics_policy','verification','official_lookup','source_refs']
 write_csv(data/'nsfc-health-projects.csv',selected,fields)
 write_csv(data/'nsfc-health-institutions.csv',stats['institutionsTop']);write_csv(data/'nsfc-health-cooccurrence.csv',pairs)
 write_csv(data/'nsfc-health-topic-changes.csv',changes)
 write_json(data/'nsfc-health-methodology.json',dict(updated=stats['updated'],inclusion=HEALTH,exclusion=FALSE,topicRules=TOPICS,keywordRules=WORDS,
  discipline='基金委现行经济科学属管理科学部。历史申请代码有调整，不以现行代码倒推旧项目细分学科；原表无学部者仅标经管汇编。',
  deduplication='只在本地内存以批准号优先、年份+规范化题名+机构补充去重；同键不同负责人或批准号对应标题/机构冲突单列排除计数。2024—2025跨版本同年同人、机构为相同或上下级且题名相同或较长前缀吻合者合并，保留优先来源机构和更完整题名；类别差异提示待核。姓名和编号不输出。',
  sourcePriority='2010—2019采用原工作簿合并主表，不再叠加同簿2015—2019异口径表；2020—2023按年份页；2024两版本去重；2025两个文件的重复条目合并。混合国自/社科表仅采用类别可判定为国自然的记录。',
  contextualScreening='排除无医疗、人群或职业语境的设备寿命和工程系统健康题名；2024—2025年缺少学部字段，须同时出现管理、经济、政策、服务或人群健康相关语境，纯生物/数学机制题名不纳入。完整规则见生成脚本。',
  privacy='公开字段白名单：年份、题名、单位、项目类型、来源说明、主题与关键词、核验状态。匿名技术ID仅由年份、题名、机构生成。不上传原工作簿或申请书。',officialDepartment=DEPARTMENT,officialLookup=OFFICIAL,limitations=limitations))
 report=['# 国自然经管与健康治理项目汇编分析','',f'更新：{stats["updated"]}。实际条目覆盖2010—2025年。',
  f'读取5份清单，取得 {len(records):,} 条可用记录。合并 {duplicates:,} 条重复记录、排除 {conflicts} 条冲突记录后，得到 {len(unique):,} 条汇编记录；题名筛出 {len(selected):,} 项健康相关项目，涉及 {len(org_counts)} 个原层级机构。其中 {stats["economicsPolicyProjects"]:,} 项题名同时出现经济、政策或治理切面词。',
  '', '来源为用户提供的第三方汇编，尚未逐项向基金委核验。分析不等于全国全量或官方统计。公开记录已移除人员和项目编号，原工作簿与申请书不上传。','',
  '## 学科口径','',f'[基金委管理科学三处]({DEPARTMENT})将经济科学与宏观管理与政策列在管理科学部下。本次按管理科学部标注或经管清单来源筛选，再匹配健康题名。历史代码有调整，不把现行细分学科追溯套用到旧项目。',
  '', '## 机构与主题','', '|机构（原单位层级）|本库相关条目|','|---|---:|']
 report += [f'|{x["name"]}|{x["count"]}|' for x in stats['institutionsTop'][:20]]
 report += ['', '|主题（可交叉）|本库项目频次|','|---|---:|']+[f'|{x["name"]}|{x["count"]}|' for x in stats['topics']]
 report += ['', '## 两个时期的题名构成','',f'比较2010—2014年（{len(before)}项）与2019—2023年（{len(after)}项），分母分别为本汇编当期筛入的健康相关项目；不使用全国立项数。2024—2025年覆盖明显不同，不进入这一时期比较。','', '|主题|前期频次|前期占比%|后期频次|后期占比%|差值（百分点）|','|---|---:|---:|---:|---:|---:|']
 report += [f'|{x["topic"]}|{x["before"]}|{x["beforePercent"]}|{x["after"]}|{x["afterPercent"]}|{x["differencePoints"]:+.2f}|' for x in changes]
 report += ['', '## 题名关键词共现','', '同一条目内两词共同出现计一次。Jaccard为共现项目数除以至少出现一个词的项目数，仅表示题名关联。','', '|关键词对|共现频次|Jaccard|','|---|---:|---:|']+[f'|{x["a"]} × {x["b"]}|{x["count"]}|{x["jaccard"]}|' for x in pairs[:20]]
 report += ['', '## 年份覆盖','', '|年份|本地汇编去重条目|健康相关条目|','|---|---:|---:|','|1991—2009|未提供|未提供|']+[f'|{a["year"]}|{a["compilationRecords"]}|{a["healthRecords"]}|' for a in annual if a['year']>=2010]
 report += ['', '## 阅读边界','']+['- '+x for x in limitations]+['',f'逐项复核请使用[基金委大数据知识管理服务平台]({OFFICIAL})，复制项目题名检索。', '', '## 来源文件','']
 report += [f'- {x["filename"]}；SHA-256：`{x["sha256"]}`。原文件保留在本地，不提供公开下载。' for x in manifest]
 (data/'nsfc-health-report.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
 print(json.dumps({k:stats[k] for k in ['projects','institutions','inputRows','uniqueCompilationRows','duplicateRows','conflictingRowsExcluded','economicsPolicyProjects']},ensure_ascii=False))

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--input',type=Path,required=True);p.add_argument('--output',type=Path,default=ROOT)
 a=p.parse_args();main(a.input,a.output)
