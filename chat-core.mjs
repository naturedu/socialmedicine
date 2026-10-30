import {isCDRIPQuery,cdripReply} from './cdrip-catalogue.mjs';
import {isResearchQuestion,detailedResearchReply} from './research-analysis.mjs?v=20261029';
import {search,terms,buildPlan,matchSchools,writingAudit} from './studio-core.mjs?v=20261024knowledge1';
import {buildGoal} from './studio-goals.mjs';
import {detectJournals,journalMatches,writingGuidance,WRITING_PROFILES} from './journal-profiles.mjs';

export const CHAT_VERSION='2026-10-24';
export const OUTCOMES={answered:'chat_answer',clarify:'chat_clarify',unmatched:'chat_no_match',error:'chat_error'};
const aliases=[
 ['standardized-patient-skill',/标准化病人|标准化患者|模拟病人|模拟患者|standard[izs]+ed patient|simulated patient|\busp\b|\bosce\b/i],
 ['implementation-science-skill',/实施科学|实施研究|实施策略|implementation science|implementation research|\bcfir\b|re[- ]?aim|\beric\b|\bstari\b|hybrid\s*[123一二三]/i],
 ['microsimulation-studio',/微观模拟|个体模拟|micro\s*simulation/i],['markov-model-skill',/马尔可夫|markov/i],
 ['did-skill',/双重差分|\bdid\b/i],['ddd-skill',/三重差分|\bddd\b/i],['rdd-studio',/断点回归|\brdd\b/i],
 ['its-skill',/间断时间序列|中断时间序列|\bits\b/i],['machine-learning-skill',/机器学习|xgboost|随机森林/i],
 ['meta-analysis-skill',/meta|荟萃|系统评价/i],['dce-design-assistant-skill',/离散选择|\bdce\b/i],
 ['sem-qca-qualitative-skill',/扎根|\bsem\b|\bqca\b|结构方程/i],['longitudinal-studio',/纵向轨迹|混合模型|重复测量/i],
 ['survival-studio',/生存分析|竞争风险|cox/i],['binary-studio',/logistic|logit|二元结局/i],
 ['health-economics-tutorial-skill',/经济评价|成本效果|成本效用|qaly|icer/i]
];
const norm=s=>String(s||'').toLowerCase().replace(/\s/g,'');
const source=(title,url,note='')=>({title,url,note});
const answer=(title,paragraphs=[],extra={})=>({status:'answered',title,paragraphs,sections:[],sources:[],suggestions:[],...extra});
const relevant=(rows,q,fields,limit=4)=>search(rows.map(r=>({...r,title:fields(r)[0],text:fields(r).slice(1).join(' ')})),q,{limit});
const collection={
 'standardized-patient-skill':['机构、医生、访问、案例与扮演者匿名ID；组别、访问时间、处置评分条目及适用分母。','记录剧本版本、训练一致性、识别、访问失败与安全退出；先核对伦理方案。机构分配时按机构处理相关性。'],
 'implementation-science-skill':['服务干预与实施策略分别定义；记录执行者、剂量、机构/人员/服务对象层级、时间窗和合格总体。','分别记录采纳、触达、忠实度、成本、维持及健康结局。分母为0记缺失；机构均值与汇总比例不能混报。'],
 'did-skill':['对象或地区 ID、时间、结局变量、处理组标识和首次接受政策的时间。','尽量收集多个政策前年份，记录协变量、样本退出和同期政策；对照组必须有明确依据。'],
 'rdd-studio':['连续运行变量、准确阈值、资格与实际处理状态、结局和处理前协变量。','保留阈值两侧原始样本与测量精度，用于密度、带宽及协变量连续性检查。'],
 'markov-model-skill':['健康状态、周期长度、各状态转移概率及其来源、状态成本和效用。','记录评价视角、时间范围、贴现率与参数不确定性；转移概率须与周期一致。'],
 'microsimulation-studio':['个体初始特征、健康状态、事件时间或转移风险、历史事件、成本与效用。','为异质性、历史依赖及外部验证保留参数出处；不把个体随机性与参数不确定性混为一谈。'],
 'its-skill':['连续且等间隔的时间、结局、分母、干预日期、季节与同期变化。','保留足够干预前后时间点，核对定义变更、自相关和可能的对照序列。'],
 'machine-learning-skill':['预测时点、预测窗口、结局标签、预测时点之前已可获得的特征及样本 ID。','按个体、机构或时间安排训练验证集；记录缺失、标签来源，避免信息泄漏。']
};
export function chooseIntent(q,previous={}){
 if(isCDRIPQuery(q,previous))return {kind:'cdrip',methodIds:[]};
 const methodIds=aliases.filter(([,re])=>re.test(q)).map(([id])=>id);
 const profiles=detectJournals(q);
 if(isResearchQuestion(q)||previous.kind==='design'&&/继续|进一步|具体|详细|只有|已有|我有|变量|下一步|分析方案|请整理|纳排|编码/.test(q))return {kind:'design',methodIds:[]};
 if(/润色|英文|摘要|写作|翻译|论证结构|审读/.test(q)&&(!methodIds.length||profiles.length))return {kind:'writing',profiles:profiles.length?profiles:previous.kind==='writing'?previous.profiles||[]:[],methodIds:[]};
 if(profiles.length&&/审稿|周期|分区|jcr|影响因子|发表时间/i.test(q))return {kind:'journals',profiles,methodIds:[]};
 if(/研究主题|主题分析/.test(q)&&profiles.length)return {kind:'publicTopics',methodIds:[]};
 if(profiles.length&&(/文献|论文|文章|题录|找|检索|看看/.test(q)||!methodIds.length))return {kind:'search',profiles,methodIds:[]};
 if(/博士.*(毕业|论文|设计)|毕业设计/.test(q))return {kind:'goal',goal:'thesis',methodIds:[]};
 if(/盖茨|gates|\bcns\b|Cell主刊/i.test(q)||(/研究主题|主题分析/.test(q)&&profiles.length))return {kind:'publicTopics',methodIds:[]};
 if(methodIds.length)return {kind:'methods',methodIds};
 if(/院校|学校|中山大学|南方医科|哪所|招生|导师/.test(q))return {kind:'schools',methodIds:[]};
 if(/国社科|国自然|教育部|项目题|立项|获批项目/.test(q))return {kind:'grants',methodIds:[]};
 if(/期刊|审稿|分区|jcr/i.test(q)&&!/研究设计/.test(q))return {kind:'journals',profiles,methodIds:[]};
 if(/典籍|经典|arrow|阿罗|不确定性|福利经济学/i.test(q))return {kind:'classics',methodIds:[]};
 if(/数据库|charls|clhls|nhanes|\bhrs\b|cfps|chns|数据源/i.test(q))return {kind:'datasets',methodIds:[]};
 if(/博士.*(毕业|论文|设计)|毕业设计/.test(q))return {kind:'goal',goal:'thesis',methodIds:[]};
 if(/申请博士|申博/.test(q))return {kind:'goal',goal:'phd',methodIds:[]};
 if(/保研|推免/.test(q))return {kind:'goal',goal:'admission',methodIds:[]};
 if(/基金申报|申报基金/.test(q))return {kind:'goal',goal:'fund',methodIds:[]};
 if(/研究设计|怎么设计|如何设计|收数据|收集数据|政策评估|因果|面板|横断面|月度数据|时间序列/.test(q))return {kind:'design',methodIds:[]};
 if(previous.kind&&/继续|再找|更多|具体|详细|代码|怎么做|如何做|需要什么|怎么收集|哪些变量|用\s*[rR]|stata|只有|已有|我有|这个|它|那|下一步/.test(q))return {...previous};
 return {kind:'search',methodIds:[]};
}
export function makeReply(question,previous={},data={}){
 const q=String(question).trim().slice(0,2000),intent=chooseIntent(q,previous);
 const followup=intent.kind===previous.kind&&intent.kind!=='search'&&!/我(?:想|计划|准备|要).{0,35}研究|换个问题|新的研究/.test(q);
 const context=followup?[previous.topic,q].filter(Boolean).join('；').slice(-3500):q;
 const state={...intent,topic:context};
 const finish=r=>({...r,state});
 if(intent.kind==='cdrip')return finish(cdripReply());
 if(/^(你好|您好|hello|hi|你能做什么)[！!。?？\s]*$/i.test(q))return finish(answer('你好，我是普贤。',['你可以问研究设计、方法与代码、院校方向、数据库、经典著作或项目题目。我会从站内资料整理回答，并给出出处。','当前是资料检索与规则问答，没有接入通用大语言模型。你可以继续补充背景，我会沿着这次问题查找。'],{suggestions:['DID 和断点回归怎么选？','中山大学和南方医科大学有哪些方向？','博士毕业设计从哪里开始？']}));
 if(intent.kind==='methods'){
  const methods=(data.methods||[]).filter(m=>intent.methodIds.includes(m.id));
  if(!methods.length)return finish(answer('方法资料暂未找到',['请换用方法全名，或进入完整方法库。'],{status:'unmatched',sources:[source('完整方法与代码','methods.html')]}));
  const guides=data.methodGuide?.skills||[];
  const sections=methods.map(m=>{const g=guides.find(x=>x.id===m.id);return {heading:g?.title||m.title,items:[g?.intro||m.use,g?.prepare,g?.example].filter(Boolean)};});
  for(const [i,m] of methods.entries()){
   if(m.id==='implementation-science-skill')sections[i].items.push('CFIR：识别情境与实施障碍；RE-AIM：规划触达、有效性、采纳、实施和维持。','Proctor：区分实施结局；ERIC：说明具体实施策略；StaRI：分别报告服务干预与实施策略。','Hybrid 1偏重有效性，2同时关注有效性与实施，3偏重实施策略；这些类型不能替代随机或准实验设计。');
   if(m.id==='standardized-patient-skill')sections[i].items.push('先区分教学/OSCE、告知式评价和未预先告知的USP研究；统一情境不能代表所有临床场景。','固定剧本与评分规则，训练并核查扮演和评分一致性；预先记录安全退出与识别处理。');
  }
  if(/变量|收集|收数据/.test(q))for(const section of sections){const m=methods[sections.indexOf(section)];section.items=collection[m.id]||[section.items[1]||'先核对手册中的数据要求。','明确分析单位、结局、暴露或分组、时间、协变量及缺失编码，并建立数据字典。'];}
  const codes=[];
  if(/代码|示例|例子|用\s*r\b|stata/i.test(q)){
   const lang=/stata/i.test(q)?'stata':/(?:用\s*r\b|\br语言|\br\s*代码)/i.test(q)?'r':'';
   for(const m of methods)for(const code of (m.codes||[]).filter(c=>!lang||c.lang.toLowerCase()===lang).slice(0,10))codes.push({...code,heading:m.title+' · '+code.heading,method:m.title});
  }
  return finish(answer(methods.length>1?'先比较适用条件，再选方法。':'这个方法可以这样开始。',['以下按本站手册整理。方法适用性取决于研究问题、数据结构与识别假设；代码是教学模板，需替换变量并检查依赖。'],{sections,codes,sources:methods.map(m=>source(m.title,m.url,m.status)),suggestions:['需要收集哪些变量？','给我 R 代码示例','给我 Stata 代码示例']}));
 }
 if(intent.kind==='schools'){
  const named=(data.schools||[]).filter(s=>context.includes(s.school.replace(/（.*?）/g,'')));
  const schools=(named.length?named:matchSchools(data.schools||[],{interest:context,major:'',route:''})).slice(0,4);
  return finish(answer(schools.length?'这些院系方向可进一步比较。':'还需要一个研究方向或学校名称。',schools.length?['下面列出目录中的研究方向及核验边界。方向匹配不等于录取概率；当前招生名额与截止时间请到官方入口确认。']:['例如“卫生经济”“医疗保障”，或直接输入“中山大学”。'],{status:schools.length?'answered':'clarify',sections:schools.map(s=>({heading:s.school+' · '+s.department,items:[s.focus.join('；'),s.programs.join('；'),s.admissionsNote]})),sources:schools.flatMap(s=>[source(s.school+' · 院系介绍',s.officialUrl,s.checked?'核对日期：'+s.checked:'导航资料；招生待核'),source(s.school+' · 招生入口',s.admissionsUrl)]),suggestions:['申请博士需要准备哪些材料？','有哪些适合卫生经济的院校？']}));
 }
 if(intent.kind==='datasets'){
  const rows=relevant(data.datasets||[],context,r=>[r.acronym+' '+r.name,r.population,...r.questions],3);
  return finish(answer(rows.length?'先核对变量、波次和使用权限。':'没有找到明确匹配的数据源。',rows.length?['以下为数据库目录中的资料，不代表你已取得数据授权，也不保证每个波次都有需要的变量。']:['请补充研究人群、结局和需要的年份。'],{status:rows.length?'answered':'clarify',sections:rows.map(r=>({heading:r.acronym+' · '+r.name,items:[r.design,r.population,...r.limitations.slice(0,2)]})),sources:rows.map(r=>source(r.acronym+' 官方资料',r.sourceUrl,'核对日期：'+r.factsVerifiedAt)),suggestions:['研究政策效果需要收集哪些数据？','打开数据源目录']}));
 }
 if(intent.kind==='journals'){
  const rows=(data.journals||[]).filter(j=>(intent.profiles||[]).some(id=>journalMatches(j.name,id)));
  const found=intent.profiles?.length?rows:data.journals||[];
  if(!found.length)return finish(answer('这本期刊的当前指标尚未在本站核实。',['没有可核实的审稿周期或分区记录，不能用同品牌其他期刊替代。可前往期刊官网，并记录数据年份和口径。'],{status:'unmatched',sources:(intent.profiles||[]).map(id=>source(WRITING_PROFILES[id].name,WRITING_PROFILES[id].url))}));
  return finish(answer('周期要连同统计口径一起看。',['这是站内最近核对的资料，不是实时查询；历史中位数不保证你的稿件处理时间。分区缺少版本依据时保留“待核实”。'],{sections:found.map(j=>({heading:j.name,items:['初次决定：'+j.first,'外审：'+j.review,'接收到发表：'+j.publish,'JCR：'+j.jcr,'中科院：'+j.cas]})),sources:found.map(j=>source(j.name+' 官方说明',j.url,j.asof)),suggestions:['英文论文怎样写得清晰克制？']}));
 }
 if(intent.kind==='classics'){
  const rows=relevant(data.classics||[],context,r=>[r.zh+' '+r.title,r.author,r.idea,r.application],3);
  return finish(answer(rows.length?'从核心问题读起。':'可以先指定一个主题。',[],{status:rows.length?'answered':'clarify',sections:rows.map(r=>({heading:r.zh+' · '+r.author,items:[r.idea,r.application]})),sources:rows.map(r=>source(r.title,r.url,r.edition)),suggestions:['医疗不确定性如何用于研究设计？']}));
 }
 if(intent.kind==='grants'){
  return finish(answer('项目资料目前仅展示汇总分析。',['本站按领域相关资料整理，不是全国全部项目。国社科、教育部和国自然各自保留统计范围与状态说明；网页不展示人员、编号或逐项名单。'],{status:'answered',sources:[source('教育部与项目分析总览','grants.html#moe'),source('国社科主题与机构分析','nssfc-projects.html'),source('国自然经管与健康分析','nsfc-health.html'),source('盖茨基金公开项目与主题分析','gates-grants.html')],suggestions:['机器学习预测模型怎么验证？']}));
 }
 if(intent.kind==='publicTopics'){
  const key=/盖茨|gates/i.test(context)?'gates':/管理世界/.test(context)?'management':'cns';
  const topicUrl=key==='gates'?'gates-grants.html':'topic-analysis.html#'+key;
  const labels={gates:'盖茨基金公开资助',cns:'CNS主刊及相关期刊',management:'《管理世界》题录'};
  const stats=data.publicAnalysis?.collections?.[key];
  if(!stats)return finish(answer('主题资料暂未载入。',['请从专题页查看已整理的公开索引与主题分析。'],{status:'clarify',sources:[source('公开主题分析',topicUrl)]}));
  const rows=(data.publicTopics?.records||[]).filter(r=>r.collection===key&&r.analysisEligible);
  const top=stats.primaryTopics.slice(0,3);
  const examples=top.map(t=>rows.find(r=>r.id===t.exampleIds[0])).filter(Boolean);
  return finish(answer(labels[key]+'：从主题到原始出处。',[`当前收录 ${stats.total} 条，${stats.analyzed} 条纳入主题构成。这里描述本站收录样本，不是资助全库或期刊全量发文。`,key==='gates'?'资助按公开 ID 去重，金额为承诺额；机构所在地不等于服务地。':key==='cns'?'55 条主刊与 10 条相关期刊分开；Cell 的 3 条是方法与转化研究参照。':'7 条书评线索保留检索，未计入默认主题构成；题录不能代替全文。'],{sections:[{heading:'数量较多的主主题',items:top.map(t=>`${t.name}：${t.count} 条（${t.percent}%）`)},{heading:'代表性公开条目',items:examples.map(r=>r.title)}],sources:[source('筛选公开条目与查看主题分析',topicUrl),...examples.map(r=>source(r.title,r.sourceUrl,r.verification))],suggestions:['盖茨基金有哪些研究主题？','CNS文献有哪些主题？','管理世界有哪些研究主题？']}));
 }
 if(intent.kind==='goal'){
  const plan=buildGoal({target:context,type:intent.goal,background:'',weeks:12},data.library||[]);
  return finish(answer(plan.title+'：先把路径拆成可交付的步骤。',[`以下是本站的准备路线，需根据你的学校要求、已有基础和时间进一步调整。`],{sections:plan.phases.slice(0,3).map(p=>({heading:p.title,items:[p.task,'交付物：'+p.deliverable]})),sources:[source('完整阶段路线','#learn'),source('研究设计工作区','#research')],question:plan.questions[0],suggestions:intent.goal==='thesis'?['我想研究医保支付改革，怎么设计？','有哪些公共数据库？']:['中山大学和南方医科大学有哪些方向？','我想写一份研究计划']}));
 }
 if(intent.kind==='design')return finish(detailedResearchReply(context,data));
 if(intent.kind==='writing'){
  const profiles=writingGuidance(q,intent.profiles||[]);
  return finish(answer(profiles.length?profiles.map(p=>p.name).join(' / ')+'：按对应论证逻辑审读。':'先写清问题，再让每句话承担一个任务。',['当前提供期刊分流的结构建议、检查与可复制任务书；没有调用通用模型改写全文。','尽量每句话表达一个主要判断，保留数字、引用、限制条件与不确定性；不能靠润色改变证据强度。'],{sections:[...profiles.map(p=>({heading:p.name+' · '+p.focus,items:[...p.checks,p.basis]})),{heading:'当前文本的检查线索',items:writingAudit(q)},{heading:'可复制到模型的审读要求',items:['按上述目标期刊建议审读我的原稿。先指出论证缺口，再给修改稿、修改理由及待核事实；冻结数字、引用、设计、效应方向与不确定性。缺证处标记待补，不编造研究结论。']}],sources:[...profiles.map(p=>source(p.name+' · 依据与指南',p.url,p.basis)),source('学术润色工作区','#polishing'),source('完整期刊写作手册','guides/references/journal-writing.html')],suggestions:['按管理世界检查论证结构','按 Nature 和 Science 审读论文','找 Nature 和 Science 的健康政策论文']}));
 }
 const filtered=(data.library||[]).filter(r=>!intent.profiles?.length||intent.profiles.some(id=>journalMatches(r.journal,id)));
 const query=intent.profiles?.length?q.replace(/nature(?:\s+health)?|science|jama(?:\s+health\s+forum)?|lancet(?:\s+public\s+health)?|管理世界|柳叶刀|\bn\s*(?:和|与|\/|&|、)\s*s\b/gi,' ').replace(/帮我|给我|请|再找|继续|看看|检索|查找|推荐|有关|相关|关于|论文|文献|文章|题录|主刊|哪些|一些|里面|的|和|与|找|有/g,' ').trim():q;
 const rows=(terms(query).length?relevant(filtered,query,r=>[r.title,r.text||''],5).filter(r=>r.score>=(intent.profiles?.length?1:8)):filtered.slice(0,5));
 return finish(answer(rows.length?'以下资料与问题相关。':'这次没有找到足够的站内依据。',rows.length?['检索已合并原专题文献库与工作台资料。题录、摘要/许可片段与本站导读分别标注；题录命中不等于已经阅读全文或证明结论。']:['请把问题缩小到具体方法、研究人群、数据库或院校。对于实时新闻、个体诊疗和未收录的事实，这个问答入口无法可靠回答。'],{status:rows.length?'answered':'unmatched',sections:rows.map(r=>({heading:r.title,items:[`${r.journal||''} · ${r.year||''} · ${r.contentLevel||r.kind||'站内资料'}`,String(r.text||'').slice(0,450),r.verified||'核验状态见原记录']})),sources:rows.filter(r=>r.url).map(r=>source(r.title,r.url,r.locator)),suggestions:['找 Nature 的健康政策论文','找 Science 的医疗公平论文','标准化病人怎么设计？','实施科学有哪些框架？']}));
}
export function metricSnapshot(data){
 const num=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
 return {visits:num(data?.totals?.visits),clicks:num(data?.totals?.clicks),downloads:num(data?.downloadTotals?.total),chat:data?.chatTotals||null,updatedAt:data?.updatedAt||null};
}
