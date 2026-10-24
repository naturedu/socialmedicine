"""Render PI-free source-backed figures for the Healthy China WeChat article.

Python/matplotlib only. Requires matplotlib and numpy; uses an installed CJK
font. All quantities come from the approved-only catalogue, never mock data.
"""
from pathlib import Path
from collections import Counter
from itertools import combinations
import csv,json,textwrap,math
import numpy as np
import matplotlib as mpl
mpl.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import FancyArrowPatch,Rectangle

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/nssfc-figures'
DATA=ROOT/'data/nssfc-wechat-figures'
GREEN='#1c5144';GOLD='#ad8b45';INK='#243f35';MUTED='#65756a';GRID='#e4e9e2'
TOPICS=['老龄养老与长期照护','医疗卫生服务与医改','公共卫生与应急','人口生育与托育','健康公平与社会决定因素','医疗保障与支付改革','心理健康与社会心理服务']
SHORT=['老龄照护','卫生服务','公卫应急','生育托育','健康公平','医保支付','心理健康']
REPRESENTATIVES=[
 (2016,'建设健康中国问题研究','健康中国'),
 (2017,'社区公共卫生服务集团化供给的关系结构与治理研究','公共卫生服务'),
 (2018,'健康中国视阈下失能老人长期照护体系协同治理研究','长期照护'),
 (2019,'健康中国战略下全民基本医疗保险制度实施路径研究','基本医疗保险'),
 (2020,'整体性治理视域下我国疾控体系的碎片化与治理现代化研究','疾控体系治理'),
 (2021,'健康中国行动背景下我国居民健康饮食决策与干预策略研究','健康饮食与干预'),
 (2022,'推动我国DRG/DIP医保支付方式改革的制度成本控制与路径优化研究','DRG/DIP支付改革'),
 (2023,'低生育率背景下中国生育支持政策体系构建研究','生育支持'),
 (2024,'数智技术驱动优质医疗资源扩容下沉的新模式、评估体系与推进路径研究','医疗资源下沉'),
 (2025,'数字新质生产力驱动特大城市公共卫生安全风险敏捷治理的机制与路径研究','公共卫生敏捷治理'),
 (2026,'推进全民健康数智化建设的政策保障研究','全民健康数智化')]
REPRESENTATIVES += [
 (2016,'“健康中国”战略下分级诊疗制度建设的法律问题研究','分级诊疗'),
 (2016,'M—HEALTH导向下农村公共卫生服务供给侧创新研究','农村公共卫生'),
 (2017,'“全面两孩”政策下女性围产期心理健康状况的发展轨迹、预测模型及干预研究','围产期心理健康'),
 (2017,'健康中国视域下农民工过度劳动与规制的跨层次研究','劳动与健康'),
 (2018,'我国长期护理保险体系建设研究','长期护理保险'),
 (2018,'健康中国战略背景下个人健康医疗信息保护与利用研究','健康信息保护'),
 (2019,'代际均衡视角下我国长期护理保险筹资的政策模拟与动态优化研究','长护筹资'),
 (2019,'“健康中国”战略背景下中国特色安宁疗护服务体系构建研究','安宁疗护'),
 (2020,'儿童综合支援计划提升中国生育率的机理、效果与制度架构研究','生育支持'),
 (2020,'防控突发公共卫生事件的刑法对策研究','公共卫生法治'),
 (2021,'我国重大突发公共卫生事件政府监管体系与监管政策优化研究','公共卫生监管'),
 (2021,'健康中国战略下信息贫困群体健康焦虑问题及其疏导行动研究','信息贫困与健康'),
 (2022,'家校社协同视角下城市在校青少年心理健康问题的预防与干预机制建设研究','青少年心理健康'),
 (2022,'计算社会科学赋能城市公共卫生风险动态研判与韧性治理研究','公共卫生韧性'),
 (2023,'基于大数据的突发事件下社会心理健康监测和预警研究','心理健康预警'),
 (2023,'推进长期护理保险政策背景下长期照护的市场供需关系研究','长期照护供需'),
 (2024,'数字适应促进老年人心理健康的内在机制与实现路径研究','数字适应与心理健康'),
 (2024,'数智化平台驱动健康管理行为的激励机制与引导策略研究','数智健康管理'),
 (2025,'资源配置视域下长期护理保险制度可持续发展研究','长护制度可持续'),
 (2025,'医保支付方式改革驱动城乡医养资源均衡配置的激励机制及引导政策研究','医保与医养资源'),
 (2026,'构建覆盖全人群、全生命周期的人口服务体系研究','全生命周期人口服务'),
 (2026,'健全社会心理服务体系和危机干预机制研究','社会心理服务')]
EVENTS=[
 dict(date='2016.10',title='健康中国2030规划纲要',note='健康融入政策 · 全人群与全生命周期',kind='政策',url='https://www.nhc.gov.cn/guihuaxxs/c100132/201610/cef9821abcfc4544bb27e2bc533bd7cf.shtml'),
 dict(date='2019.07',title='健康中国行动部署',note='健康促进 · 疾病预防 · 个人与社会行动',kind='政策',url='https://app.www.gov.cn/govdata/gov/201907/15/446056/article.html'),
 dict(date='2020.01',title='新冠肺炎纳入法定传染病管理',note='疫情应对 · 疾控体系 · 公共卫生治理',kind='公共卫生事件',url='https://www.nhc.gov.cn/jkj/c100063/202001/a558f073447946ae809de6da5a4b3fb9.shtml'),
 dict(date='2020.09',title='扩大长期护理保险制度试点',note='失能照护 · 筹资保障 · 服务供给',kind='政策',url='https://www.nhsa.gov.cn/art/2020/9/16/art_53_3587.html'),
 dict(date='2021.07',title='三孩及配套支持措施公布',note='生育支持 · 家庭养育 · 人口服务',kind='政策',url='https://app.www.gov.cn/govdata/gov/202107/20/473722/article.html'),
 dict(date='2022.10',title='党的二十大报告',note='人民健康优先发展 · 推进健康中国建设',kind='政策',url='https://app.www.gov.cn/govdata/gov/202210/25/493662/article.html'),
 dict(date='2024.10',title='完善生育支持政策体系',note='生育友好 · 托育服务 · 多方责任',kind='政策',url='https://www.mee.gov.cn/zcwj/gwywj/202410/t20241029_1090284.shtml'),
 dict(date='2025.07',title='育儿补贴制度实施方案公布',note='家庭支持 · 补贴制度 · 服务衔接',kind='政策',url='https://www.beijing.gov.cn/zhengce/zhengcefagui/202507/t20250730_4161880.html'),
 dict(date='2026.07',title='四中全会精神重大专项正式立项',note='含全民健康数智化、人口服务体系等题名',kind='立项公告',url='https://www.nopss.gov.cn/n1/2026/0701/c431028-40751777.html'),
]

def dump(name,value):
 (DATA/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def table(name,rows,fields):
 with (DATA/name).open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
def setup():
 for p in [Path('C:/Windows/Fonts/msyh.ttc'),Path('C:/Windows/Fonts/msyhbd.ttc')]:
  if p.exists():font_manager.fontManager.addfont(str(p))
 names={f.name for f in font_manager.fontManager.ttflist}
 chosen=next((n for n in ['Microsoft YaHei','Noto Sans CJK SC','SimHei'] if n in names),None)
 if not chosen:raise RuntimeError('Install a Chinese sans-serif font before plotting')
 mpl.rcParams.update({'font.family':'sans-serif','font.sans-serif':[chosen,'DejaVu Sans'],'font.size':11,
  'text.color':INK,'axes.labelcolor':INK,'xtick.color':MUTED,'ytick.color':INK,'axes.spines.top':False,'axes.spines.right':False,
  'svg.fonttype':'none','pdf.fonttype':42,'axes.unicode_minus':False,'savefig.facecolor':'white'})
 return chosen
def heading(fig,tag,title,subtitle):
 fig.text(.055,.97,tag,fontsize=10.5,color=GOLD,weight='bold',va='top')
 fig.text(.055,.925,title,fontsize=20,weight='bold',va='top',color=GREEN,linespacing=1.4)
 sub_y=.925-((title.count('\n')+1)*20*1.4+13)/(fig.get_figheight()*72)
 fig.text(.055,sub_y,subtitle,fontsize=11.3,color=MUTED,va='top',linespacing=1.5)
def save(fig,name):
 fig.savefig(OUT/(name+'.png'),dpi=300,facecolor='white')
 fig.savefig(OUT/(name+'.svg'),facecolor='white')
 fig.savefig(OUT/(name+'.pdf'),facecolor='white')
 plt.close(fig)

def main():
 OUT.mkdir(parents=True,exist_ok=True);DATA.mkdir(parents=True,exist_ok=True)
 font=setup();rows=json.loads((ROOT/'data/nssf-projects.json').read_text(encoding='utf-8'))
 health=[r for r in rows if r['health_core']];assert len(health)==2659
 reps=[]
 for year,title,theme in sorted(REPRESENTATIVES,key=lambda item:item[0]):
  found=[r for r in rows if r['date']==str(year) and r['title']==title];assert len(found)==1
  r=found[0];assert r['approval_status']=='approved'
  # Explicit whitelist: project principal and names are never exported here.
  reps.append({**{k:r[k] for k in ['date','title','organization','program','project_type','notice']},'source':r['source'].split('#')[0],'reading_theme':theme})
 assert Counter(int(r['date']) for r in reps)==Counter({y:3 for y in range(2016,2027)})
 dump('representatives.json',reps);table('representatives.csv',reps,list(reps[0]))
 dump('events.json',EVENTS)
 org=Counter(r['organization_normalized'] for r in health)
 orgrows=[dict(institution=k,projects=v) for k,v in org.most_common()]
 table('institutions.csv',orgrows,['institution','projects'])
 # Figure 1: frequencies, retaining the responsibility unit's original level.
 top=orgrows[:12][::-1];fig,ax=plt.subplots(figsize=(5.7,7.8))
 fig.subplots_adjust(left=.39,right=.94,top=.76,bottom=.23)
 heading(fig,'02 / INSTITUTIONS','卫生健康题名项目机构分布','本库2,659项卫生健康题名\n展示频次前12个责任单位')
 ax.barh([r['institution'] for r in top],[r['projects'] for r in top],height=.66,color=GREEN)
 for i,r in enumerate(top):ax.text(r['projects']+.7,i,str(r['projects']),va='center',fontsize=15,weight='bold')
 ax.set_xlim(0,max(r['projects'] for r in top)*1.16);ax.set_xlabel('正式立项项目数',labelpad=10,fontsize=13)
 ax.spines['left'].set_visible(False);ax.spines['bottom'].set_color(GRID);ax.tick_params(axis='y',length=0,pad=9,labelsize=13.8)
 ax.tick_params(axis='x',labelsize=12)
 ax.xaxis.grid(True,color=GRID,linewidth=.6);ax.set_axisbelow(True)
 fig.text(.055,.108,'机构按项目计数；学院、附属医院不并入大学。',fontsize=11,color=MUTED)
 fig.text(.055,.069,'本库频次不代表质量或申报成功率。',fontsize=11,color=MUTED)
 fig.text(.055,.032,'数据与覆盖更新：2026-10-24。',fontsize=11,color=MUTED)
 save(fig,'institutions')
 # Figure 2: comparable annual awards only; a missing national denominator stays NA.
 coverage=json.loads((ROOT/'data/nssfc-coverage.json').read_text(encoding='utf-8'))['coverage']
 denominators={c['year']:c['annualTotal'] for c in coverage}
 years=list(range(2016,2027));matrix=np.full((11,len(TOPICS)),np.nan);counts=np.full_like(matrix,np.nan);hm=[]
 for i,y in enumerate(years):
  rr=[r for r in health if r['program']=='年度项目' and int(r['date'])==y]
  for j,t in enumerate(TOPICS):
   n=sum(t in r['topics'] for r in rr);total=denominators[y]
   if total:matrix[i,j]=1000*n/total;counts[i,j]=n
   hm.append(dict(year=y,topic=t,projects=n if total else None,national_annual_total=total,per_1000=round(1000*n/total,4) if total else None))
 table('heatmap.csv',hm,list(hm[0]));assert np.isnan(matrix[-1]).all()
 cmap=LinearSegmentedColormap.from_list('health_green',['#f4f6ef','#d2e1cd','#8cb795','#3c7e64','#164b3b']);cmap.set_bad('#e9ebe7')
 fig,ax=plt.subplots(figsize=(5.2,7.8));fig.subplots_adjust(left=.16,right=.95,top=.65,bottom=.235)
 heading(fig,'03 / YEAR × THEME','年度立项中的\n七类健康研究议题','卫生健康子集 · 2016—2026\n重点/一般/青年完整批次')
 im=ax.imshow(matrix,cmap=cmap,vmin=0,vmax=float(np.nanmax(matrix)),aspect='auto')
 ax.set_xticks(range(len(TOPICS)),[s[:2]+'\n'+s[2:] for s in SHORT],fontsize=12);ax.xaxis.tick_top();ax.tick_params(axis='x',length=0,pad=11)
 ax.set_yticks(range(11),[str(y) for y in years],fontsize=13);ax.tick_params(axis='y',length=0,pad=9)
 for i in range(11):
  for j in range(len(TOPICS)):
   value=matrix[i,j];ax.text(j,i,'—' if np.isnan(value) else str(int(counts[i,j])),ha='center',va='center',fontsize=13.5,color='white' if value>np.nanmax(matrix)*.58 else INK)
 ax.set_xticks(np.arange(-.5,len(TOPICS),1),minor=True);ax.set_yticks(np.arange(-.5,11,1),minor=True);ax.grid(which='minor',color='white',linewidth=1.6);ax.tick_params(which='minor',length=0)
 for spine in ax.spines.values():spine.set_visible(False)
 cax=fig.add_axes([.38,.167,.54,.018]);cb=fig.colorbar(im,cax=cax,orientation='horizontal');cb.outline.set_visible(False);cb.ax.tick_params(labelsize=10.5,length=2)
 fig.text(.055,.17,'每千项频次',fontsize=11,color=MUTED)
 fig.text(.055,.109,'格内为项目数；颜色分母为全学科年度立项。\n主题按题名标注，可以交叉。',fontsize=10.8,color=MUTED,linespacing=1.6,va='top')
 fig.text(.055,.035,'2026灰格为名单缺失；已获专项不混入本图。',fontsize=10.7,color=MUTED)
 save(fig,'heatmap')
 # Figure 3: area-weighted nodes and co-occurrence, never causal pathways.
 themes=Counter(t for r in health for t in r['topics'] if t in TOPICS)
 pairs=Counter(p for r in health for p in combinations(sorted(t for t in r['topics'] if t in TOPICS),2))
 edges=[dict(a=a,b=b,projects=n,jaccard=round(n/(themes[a]+themes[b]-n),5)) for (a,b),n in pairs.most_common() if n>=10]
 table('theme-cooccurrence.csv',edges,list(edges[0]));table('theme-nodes.csv',[dict(topic=t,projects=themes[t]) for t in TOPICS],['topic','projects'])
 coords={TOPICS[0]:(0,0.03),TOPICS[1]:(-.97,-.73),TOPICS[2]:(-1.12,.74),TOPICS[3]:(1.0,.86),TOPICS[4]:(-.04,1.23),TOPICS[5]:(.97,-.66),TOPICS[6]:(.02,-1.2)}
 labels=dict(zip(TOPICS,['老龄养老\n与长期照护','医疗卫生\n服务与医改','公共卫生\n与应急','人口生育\n与托育','健康公平\n与社会决定因素','医疗保障\n与支付改革','心理健康\n与社会心理服务']))
 fig,ax=plt.subplots(figsize=(5.8,8.0));fig.subplots_adjust(left=.045,right=.955,top=.72,bottom=.18)
 heading(fig,'04 / THEMATIC SYNTHESIS','健康中国相关研究\n主题荟萃','2,659项卫生健康题名\n七组主题的同题多标签交叉')
 ax.set_xlim(-1.75,1.75);ax.set_ylim(-1.9,1.9);ax.axis('off')
 for e in edges:
  start=coords[e['a']];end=coords[e['b']]
  ax.add_patch(FancyArrowPatch(start,end,arrowstyle='-',linewidth=.5+e['projects']/22,color='#9eb5a5',alpha=.7,connectionstyle='arc3,rad=.05',zorder=1))
 offsets=[(0,-56),(-15,-36),(-5,35),(10,32),(0,33),(13,-30),(0,-30)]
 for topic,offset in zip(TOPICS,offsets):
  x,y=coords[topic];n=themes[topic]
  ax.scatter([x],[y],s=n*5.8,color='#dfcc91' if topic==TOPICS[0] else '#d8e6d4',edgecolor=GREEN,linewidth=1.1,zorder=2)
  ax.text(x,y,format(n,','),ha='center',va='center',fontsize=14.2,weight='bold',zorder=3)
  ax.annotate(labels[topic],(x,y),xytext=offset,textcoords='offset points',ha='center',va='center',fontsize=12.5,weight='bold',zorder=4,
    bbox=dict(boxstyle='round,pad=.22',facecolor='white',edgecolor='none',alpha=.94))
 fig.text(.055,.125,'节点面积=项目数；边宽=同题共现≥10项。\n位置只作排版；主题交叉，数量不能相加。\n词表重叠可产生共现，不表示机制或因果。\n“荟萃”是题名汇聚，不是效应量Meta分析。',fontsize=10.5,color=MUTED,linespacing=1.5,va='top')
 save(fig,'synthesis')
 # Figure 4: dated policy/award context, not an estimated event effect.
 fig,ax=plt.subplots(figsize=(5.8,11.8));fig.subplots_adjust(left=.055,right=.95,top=.79,bottom=.12)
 heading(fig,'01 / POLICY & AWARD CONTEXT','2016—2026\n健康中国相关热点事件线','政策、公共卫生事件与正式立项背景\n不推断事件对立项的因果影响')
 ax.set_xlim(0,1);ax.set_ylim(-.55,len(EVENTS)-.3);ax.axis('off');ax.plot([.2,.2],[-.1,len(EVENTS)-1],color='#cedacc',lw=2)
 for i,event in enumerate(EVENTS):
  y=len(EVENTS)-1-i;color=GOLD if event['kind']=='立项公告' else GREEN
  ax.scatter([.2],[y],s=70,color=color,zorder=3,edgecolor='white',linewidth=1.3)
  ax.text(.145,y,event['date'],ha='right',va='center',fontsize=14,weight='bold',color=color)
  title=event['title'].replace('四中全会精神重大专项正式立项','四中全会精神重大专项立项')
  ax.text(.26,y+.27,title,ha='left',va='center',fontsize=15.2,weight='bold')
  ax.text(.26,y+.02,'\n'.join(textwrap.wrap(event['note'],width=21)),ha='left',va='top',fontsize=12.5,color=MUTED,linespacing=1.3)
 fig.text(.055,.082,'按公布/部署与公告时间排列，不等同实施起点。',fontsize=11,color=MUTED)
 fig.text(.055,.053,'2026仅为已核实专项，年度完整名单仍缺失。',fontsize=11,color=MUTED)
 fig.text(.055,.024,'逐条官网链接见正文；更新2026-10-24。',fontsize=11,color=MUTED)
 save(fig,'timeline')
 qa=dict(updated='2026-10-24',backend='python/matplotlib',font=font,healthProjects=len(health),healthInstitutions=len(org),
  beforeProjects=len(rows),subsetRule='health_core is true',omittedFromInstitutionDisplay='Only top 12 responsibility-unit frequencies displayed; full institution CSV retained',
  heatmapRule='Health title subset, annual key/general/youth programs; national all-discipline annual totals as denominators',missing2026=True,
  synthesis='Seven prespecified Healthy China-related topics; show all pair edges with co-occurrence >= 10; positions are manual layout',
  statistics='Descriptive project document frequencies. No hypothesis tests, confidence intervals or causal estimates. Topic co-occurrence may arise from overlapping matching rules.',
  preflightNotes='Mobile WeChat typography: 132-147 mm logical canvas, enlarged labels; not a journal submission. PNG at 300 dpi meets this delivery contract.',
  names='No principal names or principal fields exported to this article evidence bundle',exports=['PNG 300dpi','SVG editable text','PDF TrueType'],
  source='data/nssf-projects.json and data/nssfc-coverage.json; representative source links included')
 dump('figure-qa.json',qa)
 print(json.dumps(dict(figureCount=4,representatives=len(reps),events=len(EVENTS),healthProjects=len(health),healthInstitutions=len(org),heatmapRows=len(hm),cooccurrenceEdges=len(edges)),ensure_ascii=False))

if __name__=='__main__':main()
