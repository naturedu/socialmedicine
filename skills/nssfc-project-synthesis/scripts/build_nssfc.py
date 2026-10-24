"""Build the approved-only NSSFC catalogue and reproducible descriptive analysis.

Usage: python scripts/build_nssfc.py --cache <extracted-json-directory>
No private material, application documents or unpublished topics are inputs.
"""
from pathlib import Path
from collections import Counter,defaultdict
from itertools import combinations
import argparse,csv,hashlib,json,re,unicodedata
import markdown
ROOT=Path(__file__).resolve().parents[1]
UPDATED='2026-10-24'
HEALTH=r'健康|医疗|医保|卫生|疾控|疾病|慢病|慢性病|新冠|疫苗|癌症|肿瘤|阿尔茨海默|失智|认知症|疫病|疫情|传染病|流行病|老年|老龄|养老|老有所养|照护|护理|医护|医养|医学伦理|医德|生育|托育|药品|医院|残疾|残障|康复|失能|安宁疗护|医患|精神卫生|医改|医药'
PUBLIC=r'公共服务|公共事业|事业单位|社会治理|基层治理|社区治理|社会组织|社会工作|社会救助|社会保障|社会福利|社会保险|养老保险|政府购买|公共管理|政府治理|数字政府|政务服务|行政体制|行政改革|公共政策|公共财政|公共预算|公共资源|公共数据|行政效能|基层减负|政府绩效|城市治理|公共文化|公共体育|教育公平|教育资源|义务教育|教育治理|人口服务|就业政策|就业服务|公共就业|失业保险|社会心理服务|环境治理|环境规制|公共安全|应急管理|应急治理|应急救援|应急体系|应急能力|公益慈善|慈善事业|慈善组织'
FALSE_HEALTH=r'(?:生态系统|河流|森林|产业|企业|资本|植物|电池|机械|结构|设备|金融|市场|经济|网络生态|网络空间|政治生态|组织|行业)健康(?:发展)?'
PERSON_HEALTH_DEVELOPMENT=r'(?:儿童|青少年|学生|妇女|妇幼|全民|身心|心理|精神|居民|职工|劳动者|农民工).{0,12}健康发展'
TOPICS={
 '医疗保障与支付改革':r'医保|医疗保险|医疗保障|医疗支付|医疗费用|医药费用|按病种|DRG|DIP|长期护理保险',
 '医疗卫生服务与医改':r'医疗|卫生服务|医院|医改|医患|医药|药品|家庭医生|分级诊疗|医联体|医共体',
 '公共卫生与应急':r'公共卫生|疾控|疾病|慢病|疫病|疫情|传染病|流行病|应急|公共安全',
 '老龄养老与长期照护':r'养老|老年|老龄|照护|护理|医养|失能|安宁疗护|适老|银发',
 '人口生育与托育':r'生育|托育|人口服务|人口老龄|生育率|生殖|妇幼|母婴|儿童福利',
 '健康公平与社会决定因素':r'健康不平等|健康公平|健康差异|健康贫困|健康权益|因病致贫|健康素养|健康促进|健康行为|全民健康|健康中国|健康治理',
 '心理健康与社会心理服务':r'心理健康|精神卫生|精神健康|抑郁|社会心理服务|心理危机',
 '社会保障与救助福利':r'社会保障|社会保险|养老保险|社会救助|社会福利|失业保险|残疾|残障|慈善|福利制度',
 '基层社会治理与社会工作':r'社会治理|基层治理|社区治理|社会工作|社会组织|基层政权|治理共同体',
 '公共服务与事业组织':r'公共服务|公共事业|事业单位|政府购买|政务服务|公共就业|人口服务',
 '政府治理与公共政策':r'公共管理|政府治理|数字政府|公共政策|公共财政|公共预算|公共资源|公共数据|行政效能|基层减负|政府绩效|行政体制|行政改革|城市治理',
 '教育文化体育公共服务':r'公共文化|公共体育|教育公平|教育资源|义务教育|教育治理',
 '环境治理与公共安全':r'环境治理|环境规制|公共安全|应急救援|环境健康',
}
KEYWORDS={
 '养老':r'养老','老龄化':r'老龄','老年人':r'老年','长期照护':r'长期照护|长期护理|长护险','医养结合':r'医养','适老化':r'适老','失能':r'失能','银发经济':r'银发',
 '医保':r'医保|医疗保险|医疗保障','支付改革':r'支付改革|支付方式|按病种|DRG|DIP','医疗费用':r'医疗费用|医药费用|医疗支出','医疗服务':r'医疗服务','分级诊疗':r'分级诊疗','基层医疗':r'基层医疗|基层卫生','医院':r'医院','医共体':r'医共体|医联体','家庭医生':r'家庭医生','医患关系':r'医患','药品':r'药品','健康治理':r'健康治理','健康中国':r'健康中国','健康公平':r'健康公平|健康不平等|健康差异','健康素养':r'健康素养','健康促进':r'健康促进','健康行为':r'健康行为','公共卫生':r'公共卫生','疫情':r'疫情','慢性病':r'慢病|慢性病','疾病防控':r'疾控|疾病预防|疾病防控','心理健康':r'心理健康|精神健康','社会心理服务':r'社会心理服务','生育':r'生育','托育':r'托育','人口服务':r'人口服务','儿童':r'儿童','妇女':r'妇女|女性','残障':r'残疾|残障','康复':r'康复',
 '社会保障':r'社会保障','社会救助':r'社会救助','社会福利':r'社会福利','社会保险':r'社会保险','社会工作':r'社会工作','社会组织':r'社会组织','慈善':r'慈善','公共服务':r'公共服务','均等化':r'均等化','可及性':r'可及性','政府购买服务':r'政府购买','事业单位':r'事业单位','公共文化':r'公共文化','公共体育':r'公共体育','教育公平':r'教育公平','义务教育':r'义务教育','社会治理':r'社会治理','基层治理':r'基层治理','社区治理':r'社区治理','城市治理':r'城市治理','协同治理':r'协同治理','数字政府':r'数字政府','政务服务':r'政务服务','政府绩效':r'政府绩效','公共政策':r'公共政策','环境治理':r'环境治理','环境规制':r'环境规制','应急管理':r'应急管理|应急治理','公共安全':r'公共安全',
 '数字化':r'数字|数智','人工智能':r'人工智能|大模型|生成式|AI(?!G?C?\w)','大数据':r'大数据','平台':r'平台','数据治理':r'数据治理|数据安全|数据共享','风险':r'风险','韧性':r'韧性','城乡':r'城乡','农村':r'农村|乡村','流动人口':r'流动人口','农民工':r'农民工','共同富裕':r'共同富裕','政策协同':r'政策协同|政策组合','多层次':r'多层次','全生命周期':r'全生命周期|生命历程',
}
def read(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write(name,obj):
 p=ROOT/'data'/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def csvwrite(name,rows,fields):
 with (ROOT/'data'/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields,extrasaction='ignore');w.writeheader()
  for r in rows:w.writerow({k:'；'.join(v) if isinstance(v,list) else v for k,v in r.items() if k in fields})
def canonical_org(s):return unicodedata.normalize('NFKC',s).strip()
def classify(title):
 clean=re.sub(FALSE_HEALTH,'',title)
 clean=clean.replace('健康发展','')
 if re.search(PERSON_HEALTH_DEVELOPMENT,title):clean+='健康'
 h=bool(re.search(HEALTH,clean));p=bool(re.search(PUBLIC,clean))
 if not (h or p):return None
 topics=[k for k,v in TOPICS.items() if re.search(v,title)] or [('卫生健康综合' if h else '公共治理综合')]
 words=[k for k,v in KEYWORDS.items() if re.search(v,title,re.I)]
 return dict(health_core=h,scope_groups=(["卫生健康"] if h else [])+(["公共事业治理"] if p else []),topics=topics,keywords=words)
def main(cache,output=None,manifest_path=None):
 global ROOT
 source_manifest=manifest_path or ROOT/'data/nssfc-source-files.json'
 if output:ROOT=output.resolve()
 manifest=read(source_manifest);metas={m['key']:m for m in manifest};raw=[];audits=[]
 if output:write('nssfc-source-files.json',manifest)
 for m in manifest:
  d=read(cache/(m['key']+'.json'));a=d['audit']
  assert a['sha256']==m['sha256'],m['key']+' hash mismatch'
  assert not a['issues'],(m['key'],a['issues'])
  raw+=d['rows'];audits.append(a)
 # Keep the historical unverified corpus apart from the approved-only catalogue.
 archive=ROOT/'data/archive/nssf-unverified-2026-10-23.json'
 if not archive.exists() and (ROOT/'data/nssf-projects.json').exists():
  prior=read(ROOT/'data/nssf-projects.json');write('archive/nssf-unverified-2026-10-23.json',[r for r in prior if not r['status'].startswith('正式立项')])
 all_unique={};selected={};duplicates=[];conflicts=[]
 for r in raw:
  m=metas[r['source_id']];code=r['project_code']
  identity=code or 'NSSF-'+hashlib.sha256('|'.join([r['date'],r['program'],r['title'],r['organization'],r['principal']]).encode()).hexdigest()[:18]
  if identity in all_unique:
   old=all_unique[identity];duplicates.append(identity)
   if (old['title'],old['organization'])!=(r['title'],r['organization']):conflicts.append(dict(id=identity,first=old,second=r))
   continue
  all_unique[identity]=r
  labels=classify(r['title'])
  if not labels:continue
  source=m['url']+('#page='+str(r['page']) if r['page'] else '')
  selected[identity]={**r,**labels,'id':identity,'funder':'国社科','organization_normalized':canonical_org(r['organization']),
    'status':'正式立项（'+m['source_level']+'）','approval_status':'approved','state':'正式立项名单',
    'source':source,'notice':m['notice'],'official_notice':m.get('official_notice',''),'notice_status':m.get('official_notice_status',''),'source_level':m['source_level'],
    'scope':'按公开正式立项题名筛选；主题与关键词为本站受控词表标注，不是官方学科认定。','theme':labels['topics'][0]}
 rows=sorted(selected.values(),key=lambda r:(-int(r['date']),r['program'],r['project_code'] or r['id']))
 assert not conflicts,'Approval-code conflicts require review before publishing'
 batches=[];coverage=[]
 for m in manifest:
  mr=[r for r in raw if r['source_id']==m['key']]
  for year in sorted(set(int(r['date']) for r in mr)):
   yrows=[r for r in mr if int(r['date'])==year];sr=[r for r in rows if r['source_id']==m['key'] and int(r['date'])==year]
   expected=m.get('expected',{}).get(str(year));codes=[r['project_code'] for r in yrows if r['project_code']]
   if expected is not None:assert len(yrows)==expected,(m['key'],year,len(yrows),expected)
   batches.append(dict(source_id=m['key'],year=year,program=m['program'],parsedRows=len(yrows),selectedRows=len(sr),expectedRows=expected,
     redactedRows=sum(r['title'] in ['略','题目略','课题略'] for r in yrows),withCode=len(codes),uniqueCodes=len(set(codes)),
     source=m['url'],notice=m['notice'],official_notice=m.get('official_notice',''),source_level=m['source_level'],sha256=m['sha256']))
 for year in range(2016,2027):
  br=[b for b in batches if b['year']==year];sr=[r for r in rows if int(r['date'])==year]
  annual=next((b for b in br if b['program']=='年度项目'),None)
  coverage.append(dict(year=year,parsedRows=sum(b['parsedRows'] for b in br),selectedRows=len(sr),annualTotal=annual['parsedRows'] if annual else None,
   annualSelected=sum(r['program']=='年度项目' for r in sr),batches=br,
   missing=[p for p in ['年度项目','西部项目','重大项目','后期资助'] if p not in [b['program'] for b in br]],
   note='重点、一般、青年全国批次条数已核对；其他类别仅覆盖所列附件。' if annual else '尚未取得可核实的本年度重点、一般、青年正式名单；仅统计取得的正式重大专项。'))
 org=Counter(r['organization_normalized'] for r in rows);themes=Counter(t for r in rows for t in r['topics']);words=Counter(w for r in rows for w in r['keywords'])
 health_themes=Counter(t for r in rows if r['health_core'] for t in r['topics'])
 edges=Counter(pair for r in rows for pair in combinations(sorted(set(r['keywords'])),2))
 pairs=[dict(a=a,b=b,count=n,jaccard=round(n/(words[a]+words[b]-n),4)) for (a,b),n in edges.items() if n>=5 and a not in b and b not in a and set([a,b])!=set(['数字化','数字政府'])]
 pairs.sort(key=lambda x:(-x['count'],x['a'],x['b']))
 cohort=[r for r in rows if r['program']=='年度项目']
 annual_stats=[]
 for c in coverage:
  yr=[r for r in cohort if int(r['date'])==c['year']]
  annual_stats.append(dict(year=c['year'],nationalTotal=c['annualTotal'],domainProjects=len(yr) if c['annualTotal'] else None,
   healthProjects=sum(r['health_core'] for r in yr) if c['annualTotal'] else None,topics=dict(Counter(t for r in yr for t in r['topics']))))
 before=[r for r in cohort if 2018<=int(r['date'])<=2020];after=[r for r in cohort if 2023<=int(r['date'])<=2025]
 nb=sum(c['annualTotal'] for c in coverage if 2018<=c['year']<=2020);na=sum(c['annualTotal'] for c in coverage if 2023<=c['year']<=2025)
 changes=[]
 for name,pattern in TOPICS.items():
  b=sum(name in r['topics'] for r in before);a=sum(name in r['topics'] for r in after)
  changes.append(dict(topic=name,before=b,after=a,beforeTotal=nb,afterTotal=na,beforePer1000=round(1000*b/nb,2),afterPer1000=round(1000*a/na,2),differencePer1000=round(1000*a/na-1000*b/nb,2)))
 changes.sort(key=lambda x:-x['differencePer1000'])
 stats=dict(updated=UPDATED,projects=len(rows),healthProjects=sum(r['health_core'] for r in rows),institutions=len(org),sourceFiles=len(manifest),batches=len(batches),
   parsedRows=len(raw),uniqueParsedRows=len(all_unique),duplicateRows=len(duplicates),withCode=sum(bool(r['project_code']) for r in rows),
   officialSourceProjects=sum('非官方' not in r['source_level'] for r in rows),
   institutionsTop=[dict(name=k,count=v) for k,v in org.most_common(30)],topics=[dict(name=k,count=v) for k,v in themes.most_common()],keywords=[dict(name=k,count=v) for k,v in words.most_common()],
   healthTopics=[dict(name=k,count=v) for k,v in health_themes.most_common()],
   annual=annual_stats,changes=changes,cooccurrence=pairs[:250],cohort=dict(beforeYears=[2018,2019,2020],afterYears=[2023,2024,2025],beforeTotal=nb,afterTotal=na))
 rules=dict(updated=UPDATED,inclusion='只纳入正式立项附件或高校官网正式立项存档；不纳入公示、拟立项、申报指南或结项清单。',healthRegex=HEALTH,publicRegex=PUBLIC,falseHealthRegex=FALSE_HEALTH,
   genericHealthDevelopment='健康发展本身不作为健康领域命中；人群健康发展表达按以下规则保留。其他独立卫生健康词或公共事业治理词仍可纳入。',personHealthDevelopmentRegex=PERSON_HEALTH_DEVELOPMENT,
   topicRules=TOPICS,keywordRules=KEYWORDS,organizationNormalization='原名称完整保留；统计名称仅进行 Unicode NFKC（全半角括号等）和首尾空白统一。不合并高校、学院、附属医院或历史更名。',
   counting='以批准号去重；无批准号时以年份、项目系列、题名、责任单位、负责人组合建立稳定标识。同题不同单位或首席专家保留独立项目。每项目机构全计数；主题及关键词按项目文档频次计数，标签可交叉。',
   hotspot='热点为题名中主题频次与共现的描述性汇聚，不是效应量Meta分析。共现剔除包含关系的词对及数字化/数字政府的机械共现。时期比较仅用全国条数核对完成的重点、一般、青年批次（2018—2020 对 2023—2025），分母为各期全学科正式立项总数，报告每千项频次变化。',
   limitations=['不代表三领域的全部项目：关键词法存在漏检和误检，题目略的项目无法判定主题。','2026年度重点、一般、青年项目尚无本次可核实的正式名单；公示不计数。','西部2017未取得正式完整附件；后期资助2021—2023及2026、教育学/艺术学/军事学单列与其他专项未系统覆盖。','重大专项仅收录2023二十大精神、2026二十届四中全会精神两批，其他专项待补。','立项状态指当年公布状态，未逐条追溯后来撤项、变更或结项。','机构频次反映本库覆盖与题名规则，不能解释为学术质量排名或申报成功率。'])
 write('nssf-projects.json',rows);write('nssfc-analysis.json',stats);write('nssfc-coverage.json',dict(updated=UPDATED,coverage=coverage,batches=batches,limitations=rules['limitations']))
 write('nssfc-methodology.json',rules);write('nssfc-extraction-audit.json',dict(updated=UPDATED,audits=audits,duplicateIds=duplicates,conflicts=conflicts))
 fields=['id','date','project_code','title','organization','organization_normalized','principal','category','project_type','program','scope_groups','topics','keywords','status','source_level','official_notice','notice','source','source_id','locator']
 csvwrite('nssf-projects.csv',rows,fields);csvwrite('nssfc-batches.csv',batches,list(batches[0]));csvwrite('nssfc-institutions.csv',[dict(name=k,count=v) for k,v in org.most_common()],['name','count'])
 csvwrite('nssfc-cooccurrence.csv',pairs,['a','b','count','jaccard']);csvwrite('nssfc-topic-changes.csv',changes,list(changes[0]))
 if (ROOT/'data/moe-projects.json').exists():
  moe=read(ROOT/'data/moe-projects.json');write('health-projects.json',rows+moe);csvwrite('health-projects.csv',rows+moe,fields+['funder'])
 # Preserve the separate education-ministry catalogue and refresh the legacy coverage UI.
 legacy=read(ROOT/'data/project-coverage.json') if (ROOT/'data/project-coverage.json').exists() else {'coverage':[]};oldmoe=[c for c in legacy['coverage'] if c['provider']=='教育部']
 nc=[dict(year=c['year'],provider='国社科',parsedRows=c['parsedRows'],selectedRows=c['selectedRows'],note=c['note']+' 未覆盖：'+'、'.join(c['missing']),sources=[dict(label=b['source_id']+' · '+b['source_level'],url=b['source']) for b in c['batches']]) for c in coverage]
 write('project-coverage.json',dict(updated=UPDATED,years=[2016,2026],scope='国社科仅正式立项题名筛选；教育部项目独立保留原状态与覆盖口径。',limitations=rules['limitations'],coverage=sorted(nc+oldmoe,key=lambda c:(c['year'],c['provider']))))
 report=['# 国社科领域立项项目荟萃与分析','',f'更新：{UPDATED}。检索范围 2016—2026 年；仅统计当年正式立项。',
  f'从 {len(manifest)} 份来源文件、{len(batches)} 个年度批次提取 {len(raw):,} 条公开立项元数据，按题名规则筛入并去重后 {len(rows):,} 项，涉及 {len(org)} 个保留原层级的机构名称。其中卫生健康题名 {stats["healthProjects"]:,} 项，存在与公共事业治理的交叉。',
  '', '## 机构分布','', '下列为本库检索频次，不作全国学术质量排名。高校与其附属医院、学院独立记录。','', '|机构（规范化名称）|项目数|','|---|---:|']
 report += [f'|{k}|{v}|' for k,v in org.most_common(20)]
 report += ['', '## 主题与热点','', '主题为本站受控词表标注，可多标签交叉；不是官方项目关键词或学科分类。','', '|主题|项目文档频次|','|---|---:|']+[f'|{k}|{v}|' for k,v in themes.most_common()]
 report += ['', '## 健康中国建设相关研究布局','',
  '以[《“健康中国2030”规划纲要》](https://www.nhc.gov.cn/guihuaxxs/c100132/201610/cef9821abcfc4544bb27e2bc533bd7cf.shtml)涉及的健康服务、保障与全人群健康等任务为阅读背景，下表从本库卫生健康题名子集观察研究关注。并非逐项认定项目直接服务某一政策任务。',
  f'统计子集为命中卫生健康题名规则的 {stats["healthProjects"]:,} 项，主题仍可交叉。以下数字不能与上一节全领域主题频次混用，也不能相加为项目总数。立项反映科研布局，不直接衡量健康中国建设成效；评价建设进展还须结合健康结果、服务可及性和保障水平等实际数据。',
  '', '|卫生健康子集的主题|题名项目频次|','|---|---:|']+[f'|{k}|{v}|' for k,v in health_themes.most_common()]
 report += ['', '## 可比时期的变化','',f'只比较重点、一般、青年项目完整批次：2018—2020 年分母 {nb:,} 项，2023—2025 年分母 {na:,} 项。以下是全学科立项中命中本领域主题的每千项频次，不是领域内百分比。变化是描述性结果，不据此推断因果或申报胜算。','', '|主题|2018—2020 命中|每千项|2023—2025 命中|每千项|变化（每千项）|','|---|---:|---:|---:|---:|---:|']
 report += [f'|{x["topic"]}|{x["before"]}|{x["beforePer1000"]}|{x["after"]}|{x["afterPer1000"]}|{x["differencePer1000"]:+.2f}|' for x in changes]
 report += ['', '## 如何理解这些结果','',
  f'题名聚集最多的两组是“{themes.most_common(2)[0][0]}”与“{themes.most_common(2)[1][0]}”，分别命中 {themes.most_common(2)[0][1]} 与 {themes.most_common(2)[1][1]} 个项目。这体现了本库中人口老龄化、照护服务和基层治理议题的集中出现；主题交叉，不能将两组简单相加。',
  '同系列、同样经过全国条数核对的时期比较中，老龄养老与长期照护、人口生育与托育的每千项题名频次上升。这是资助项目题名构成的变化，不能替代申请数量、成功率或评审偏好数据。',
  '数字化与老年人、养老与农村等关键词交汇，可以作为继续阅读“数字服务可及性”“城乡照护供给”等研究问题的线索。是否存在真实机制、研究采用何种设计，仍须阅读项目成果；仅凭题名不补写研究发现。',
  '机构频次较高的单位通常同时覆盖多个题名主题。本站保留责任单位原层级，学院和附属医院的独立记录不会并入大学总数，因此本表适合寻找研究团队线索，不适合评价机构综合实力。']
 report += ['', '## 关键词共现','', '同一题名内同时命中两个受控词记一次。Jaccard = 两词共现项目数 / 至少命中一词的项目数；频次和关联不代表机制已验证。','', '|关键词对|共现项目数|Jaccard|','|---|---:|---:|']+[f'|{x["a"]} × {x["b"]}|{x["count"]}|{x["jaccard"]}|' for x in pairs[:20]]
 report += ['', '## 来源与逐年覆盖','', '|年份|重点/一般/青年全学科条数|领域筛入（所有已取得系列）|本次缺口|','|---|---:|---:|---|']+[f'|{c["year"]}|{c["annualTotal"] if c["annualTotal"] is not None else "未取得正式名单"}|{c["selectedRows"]}|{"、".join(c["missing"]) or "另见专项覆盖限制"}|' for c in coverage]
 report += ['', '## 限制','']+['- '+s for s in rules['limitations']]+['','## 来源文件','']
 for m in manifest:report += [f'- **{m["key"]} · {m["source_level"]}**：[公告或官网存档]({m["notice"]})；[名单附件]({m["url"]})。SHA-256：`{m["sha256"]}`。']
 (ROOT/'data/nssfc-analysis-report.md').write_text('\n'.join(report)+'\n',encoding='utf-8')
 body=markdown.markdown('\n'.join(report).replace('<','&lt;').replace('>','&gt;'),extensions=['tables'])
 style='body{max-width:1060px;margin:35px auto;padding:0 24px;color:#233b30;background:#fafaf6;font:15px/1.9 system-ui,Microsoft YaHei,sans-serif}h1,h2{color:#174735;font-family:Georgia,serif}h2{margin-top:38px}a{color:#246449;text-underline-offset:3px}table{width:100%;border-collapse:collapse;margin:22px 0;font-size:13px;background:white}th,td{padding:9px 13px;border:1px solid #d9e2d4;text-align:left}th{background:#edf2e5}code{font-size:11px;overflow-wrap:anywhere}li{margin:13px 0}.top{font-size:12px;padding:15px 0;border-bottom:1px solid #ccd7c5}p,li{overflow-wrap:anywhere}@media(max-width:680px){table{display:block;overflow-x:auto}body{padding:0 16px;margin:20px auto}}@media print{body{max-width:none;margin:0;background:white}h2{break-after:avoid}tr{break-inside:avoid}.top{display:none}}'
 (ROOT/'data/nssfc-analysis-report.html').write_text('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>国社科正式立项 · 机构、主题词与热点分析</title><style>'+style+'</style><div class="top"><a href="https://naturedu.github.io/socialmedicine/nssfc-projects.html">打开交互立项图谱 ↗</a> · 数据及来源更新：'+UPDATED+'</div><main>'+body+'</main></html>\n',encoding='utf-8')
 print(json.dumps({k:stats[k] for k in ['projects','healthProjects','institutions','parsedRows','batches','withCode','officialSourceProjects']},ensure_ascii=False))
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True)
 ap.add_argument('--output',type=Path,help='Write results under this directory; leave the skill or repository unchanged')
 ap.add_argument('--manifest',type=Path,help='Use a reviewed source manifest instead of the bundled version')
 args=ap.parse_args();main(args.cache,args.output,args.manifest)
