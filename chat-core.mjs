import {search,buildPlan,matchSchools,writingAudit} from './studio-core.mjs';
import {buildGoal} from './studio-goals.mjs';

export const CHAT_VERSION='2026-10-24';
export const OUTCOMES={answered:'chat_answer',clarify:'chat_clarify',unmatched:'chat_no_match',error:'chat_error'};
const aliases=[
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
 'did-skill':['对象或地区 ID、时间、结局变量、处理组标识和首次接受政策的时间。','尽量收集多个政策前年份，记录协变量、样本退出和同期政策；对照组必须有明确依据。'],
 'rdd-studio':['连续运行变量、准确阈值、资格与实际处理状态、结局和处理前协变量。','保留阈值两侧原始样本与测量精度，用于密度、带宽及协变量连续性检查。'],
 'markov-model-skill':['健康状态、周期长度、各状态转移概率及其来源、状态成本和效用。','记录评价视角、时间范围、贴现率与参数不确定性；转移概率须与周期一致。'],
 'microsimulation-studio':['个体初始特征、健康状态、事件时间或转移风险、历史事件、成本与效用。','为异质性、历史依赖及外部验证保留参数出处；不把个体随机性与参数不确定性混为一谈。'],
 'its-skill':['连续且等间隔的时间、结局、分母、干预日期、季节与同期变化。','保留足够干预前后时间点，核对定义变更、自相关和可能的对照序列。'],
 'machine-learning-skill':['预测时点、预测窗口、结局标签、预测时点之前已可获得的特征及样本 ID。','按个体、机构或时间安排训练验证集；记录缺失、标签来源，避免信息泄漏。']
};
export function chooseIntent(q,previous={}){
 const methodIds=aliases.filter(([,re])=>re.test(q)).map(([id])=>id);
 if(/院校|学校|中山大学|南方医科|哪所|招生|导师/.test(q))return {kind:'schools',methodIds:[]};
 if(/国社科|国自然|教育部|项目题|立项|获批项目/.test(q))return {kind:'grants',methodIds:[]};
 if(/期刊|审稿|分区|jcr|lancet|jama|nature health/i.test(q)&&!/研究设计/.test(q))return {kind:'journals',methodIds:[]};
 if(/典籍|经典|arrow|阿罗|不确定性|福利经济学/i.test(q))return {kind:'classics',methodIds:[]};
 if(/数据库|charls|clhls|nhanes|\bhrs\b|cfps|chns|数据源/i.test(q))return {kind:'datasets',methodIds:[]};
 if(/润色|英文|摘要|写作|翻译/.test(q)&&!methodIds.length)return {kind:'writing',methodIds:[]};
 if(/博士.*(毕业|论文|设计)|毕业设计/.test(q))return {kind:'goal',goal:'thesis',methodIds:[]};
 if(/申请博士|申博/.test(q))return {kind:'goal',goal:'phd',methodIds:[]};
 if(/保研|推免/.test(q))return {kind:'goal',goal:'admission',methodIds:[]};
 if(/基金申报|申报基金/.test(q))return {kind:'goal',goal:'fund',methodIds:[]};
 if(methodIds.length)return {kind:'methods',methodIds};
 if(/研究设计|怎么设计|如何设计|收数据|收集数据|政策评估|因果|面板|横断面|月度数据|时间序列/.test(q))return {kind:'design',methodIds:[]};
 if(previous.kind&&/继续|具体|详细|代码|怎么做|如何做|需要什么|怎么收集|哪些变量|用\s*[rR]|stata|只有|已有|我有|这个|它|那|下一步/.test(q))return {...previous};
 return {kind:'search',methodIds:[]};
}
export function makeReply(question,previous={},data={}){
 const q=String(question).trim().slice(0,2000),intent=chooseIntent(q,previous);
 const followup=intent.kind===previous.kind&&intent.kind!=='search';
 const context=followup?[previous.topic,q].filter(Boolean).join('；').slice(-3500):q;
 const state={...intent,topic:context};
 const finish=r=>({...r,state});
 if(/^(你好|您好|hello|hi|你能做什么)[！!。?？\s]*$/i.test(q))return finish(answer('你好，我是普贤。',['你可以问研究设计、方法与代码、院校方向、数据库、经典著作或项目题目。我会从站内资料整理回答，并给出出处。','当前是资料检索与规则问答，没有接入通用大语言模型。你可以继续补充背景，我会沿着这次问题查找。'],{suggestions:['DID 和断点回归怎么选？','中山大学和南方医科大学有哪些方向？','博士毕业设计从哪里开始？']}));
 if(intent.kind==='methods'){
  const methods=(data.methods||[]).filter(m=>intent.methodIds.includes(m.id));
  if(!methods.length)return finish(answer('方法资料暂未找到',['请换用方法全名，或进入完整方法库。'],{status:'unmatched',sources:[source('完整方法与代码','methods.html')]}));
  const guides=data.methodGuide?.skills||[];
  const sections=methods.map(m=>{const g=guides.find(x=>x.id===m.id);return {heading:g?.title||m.title,items:[g?.intro||m.use,g?.prepare,g?.example].filter(Boolean)};});
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
  const rows=(data.journals||[]).filter(j=>norm(context).includes(norm(j.name))||norm(context).includes(j.id)||/柳叶刀/.test(context)&&j.id==='lancet');
  const found=rows.length?rows:data.journals||[];
  return finish(answer('周期要连同统计口径一起看。',['这是站内最近核对的资料，不是实时查询；历史中位数不保证你的稿件处理时间。分区缺少版本依据时保留“待核实”。'],{sections:found.map(j=>({heading:j.name,items:['初次决定：'+j.first,'外审：'+j.review,'接收到发表：'+j.publish,'JCR：'+j.jcr,'中科院：'+j.cas]})),sources:found.map(j=>source(j.name+' 官方说明',j.url,j.asof)),suggestions:['英文论文怎样写得清晰克制？']}));
 }
 if(intent.kind==='classics'){
  const rows=relevant(data.classics||[],context,r=>[r.zh+' '+r.title,r.author,r.idea,r.application],3);
  return finish(answer(rows.length?'从核心问题读起。':'可以先指定一个主题。',[],{status:rows.length?'answered':'clarify',sections:rows.map(r=>({heading:r.zh+' · '+r.author,items:[r.idea,r.application]})),sources:rows.map(r=>source(r.title,r.url,r.edition)),suggestions:['医疗不确定性如何用于研究设计？']}));
 }
 if(intent.kind==='grants'){
  return finish(answer('项目资料目前仅展示汇总分析。',['本站按领域相关资料整理，不是全国全部项目。国社科、教育部和国自然各自保留统计范围与状态说明；网页不展示人员、编号或逐项名单。'],{status:'answered',sources:[source('教育部与项目分析总览','grants.html#moe'),source('国社科主题与机构分析','nssfc-projects.html'),source('国自然经管与健康分析','nsfc-health.html')],suggestions:['机器学习预测模型怎么验证？']}));
 }
 if(intent.kind==='goal'){
  const plan=buildGoal({target:context,type:intent.goal,background:'',weeks:12},data.library||[]);
  return finish(answer(plan.title+'：先把路径拆成可交付的步骤。',[`以下是本站的准备路线，需根据你的学校要求、已有基础和时间进一步调整。`],{sections:plan.phases.slice(0,3).map(p=>({heading:p.title,items:[p.task,'交付物：'+p.deliverable]})),sources:[source('完整阶段路线','#learn'),source('研究设计工作区','#research')],question:plan.questions[0],suggestions:intent.goal==='thesis'?['我想研究医保支付改革，怎么设计？','有哪些公共数据库？']:['中山大学和南方医科大学有哪些方向？','我想写一份研究计划']}));
 }
 if(intent.kind==='design'){
  const type=/横断面|只有一年|只有一次/.test(q)?'cross':/面板|多轮|追踪|随访/.test(context)?'panel':/月度|季度|时间序列/.test(context)?'series':'cross';
  const goal=/成本效果|经济评价|成本效用/.test(context)?'economic':/预测|机器学习/.test(context)?'prediction':/机制|访谈/.test(context)?'mechanism':/政策|改革|因果|影响|效果/.test(context)?'causal':'descriptive';
  const plan=buildPlan({question:context,goal,data:type,journal:'lancet'},data.library||[]);
  return finish(answer(plan.design,[plan.theory],{sections:[{heading:'成立条件',items:plan.assumptions},{heading:'需要收集的数据',items:plan.collect}],sources:[source('配套方法手册','skills/'+plan.skill),source('继续填写结构化研究方案','#research')],question:type==='cross'?'你目前有横断面、连续月度数据，还是能追踪同一对象的多期数据？':'政策或干预何时实施，是否有未受影响的对照？',suggestions:['我只有横断面数据','我有多期面板数据','我有连续月度数据']}));
 }
 if(intent.kind==='writing')return finish(answer('先写清问题，再让每句话承担一个任务。',['当前提供写作检查与任务组织，不自动生成通用模型润色稿。','组织上先明确问题与证据缺口，再写设计、主要发现、局限和政策意义。尽量让一句话表达一个主要判断；保留数值、引用和不确定性。'],{sections:[{heading:'检查重点',items:writingAudit(q)}],sources:[source('学术润色工作区','#polishing'),source('清晰学术英文手册','skills/clear-academic-writing/SKILL.md')],suggestions:['打开英文润色工作区']}));
 const rows=relevant(data.library||[],q,r=>[r.title,r.text||''],3).filter(r=>r.score>=8);
 return finish(answer(rows.length?'以下资料与问题相关。':'这次没有找到足够的站内依据。',rows.length?['以下是检索片段，相关命中不等于对研究结论的证明。可以指定其中的方法、数据或院校继续问。']:['请把问题缩小到具体方法、研究人群、数据库或院校。对于实时新闻、个体诊疗和未收录的事实，这个问答入口无法可靠回答。'],{status:rows.length?'answered':'unmatched',sections:rows.map(r=>({heading:r.title,items:[String(r.text||'').slice(0,450)]})),sources:rows.filter(r=>r.url).map(r=>source(r.title,r.url,r.locator)),suggestions:['DID 需要满足哪些条件？','中山大学有哪些研究方向？','我想做博士毕业设计']}));
}
export function metricSnapshot(data){
 const num=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0?v:null;
 return {visits:num(data?.totals?.visits),clicks:num(data?.totals?.clicks),downloads:num(data?.downloadTotals?.total),chat:data?.chatTotals||null,updatedAt:data?.updatedAt||null};
}
