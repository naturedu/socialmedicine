// Editorial suggestions are not journal acceptance criteria or a model response.
export const WRITING_PROFILES = {
 management:{name:'管理世界',focus:'制度与管理问题 → 理论机制 → 识别与证据 → 管理启示',checks:['开篇写清可观察的制度矛盾与研究问题，压缩背景口号。','机制交代主体、约束、行为与结果；统计中介显著不能单独证明因果机制。','说明相对具体文献的认识推进，避免无依据的“首次”“填补空白”。','政策建议对应证据和适用场景，不把局部结果直接推广到全国。'],url:'guides/references/journal-writing.html',basis:'本站论证与审读建议；不是《管理世界》官方录用标准'},
 nature_main:{name:'Nature（主刊）',focus:'跨学科可理解的问题 → 知识缺口 → 核心发现 → 一般意义与边界',checks:['摘要先让非本领域读者理解问题，再说明本研究回答了什么。','结果围绕主要发现组织，每幅图承担明确证据任务。','区分观察结果、机制解释和外推条件，不能用修辞抬高证据强度。','摘要与篇幅随栏目核对官方指南；Nature Health、Nature Medicine 单独处理。'],url:'https://www.nature.com/nature/for-authors/formatting-guide',basis:'官方格式指南与本站写作建议；核对日期 2026-10-24'},
 science_main:{name:'Science（主刊）',focus:'重要科学问题 → 可检验论点 → 关键证据 → 解释与适用范围',checks:['尽早提出核心问题，主结果前置，并解释跨领域读者为何需要关注。','报告效应大小、不确定性与替代解释，不用夸张形容词代替结果。','图、正文和补充方法形成可以核查的证据链。','具体栏目、字数和格式需重新核对官网；Science Advances 不能当作 Science 主刊。'],url:'https://www.science.org/content/page/instructions-preparing-initial-manuscript',basis:'本站原创审读建议；官方指南访问受限，未据此填写当前字数限制'},
 lancet:{name:'The Lancet Public Health',focus:'人群负担与公平 → 证据缺口 → 研究发现 → 公共卫生意义',checks:['明确人群、时间窗、比较与主要结局。','同时报告绝对尺度、区间与重要亚组。','实践含义受研究设计与外推条件约束。'],url:'https://www.thelancet.com/journals/lanpub/home',basis:'本站编辑建议；文章类型与当期作者指南另核对'},
 nature_health:{name:'Nature Health',focus:'真实健康问题 → 跨学科证据 → 健康政策与实践',checks:['明确原创问题，而不是仅强调方法复杂。','交代真实场景、人群与参与者角色。','健康影响与外推边界须有证据支撑。'],url:'https://www.nature.com/naturehealth/aims',basis:'站内已有期刊资料与编辑建议'},
 jama:{name:'JAMA Health Forum',focus:'政策问题 → 识别策略 → 主要结局 → 决策意义',checks:['政策暴露、实施时间、对照与识别假设写清。','费用、质量、可及性和公平指标明确分母。','区分关联与因果，Key Points 与摘要按栏目要求核对。'],url:'https://jamanetwork.com/journals/jama-health-forum/pages/for-authors',basis:'站内已有作者指南资料与编辑建议'}
};
export function detectJournals(text=''){
 const q=String(text),found=[];
 if(/管理世界/.test(q))found.push('management');
 if(/nature\s+health/i.test(q))found.push('nature_health');
 if(/lancet|柳叶刀/i.test(q))found.push('lancet');
 if(/jama/i.test(q))found.push('jama');
 const main=q.replace(/nature\s+(health|medicine|communications|human behaviour|human behavior)|science\s+advances|social\s+science\s*(?:&|and)\s*medicine/gi,'');
 if(/\bnature\b/i.test(main))found.push('nature_main');
 if(/\bscience\b/i.test(main))found.push('science_main');
 if(/(?:^|\W)n\s*(?:和|与|\/|&|、)\s*s(?:\W|$)/i.test(q))found.push('nature_main','science_main');
 return [...new Set(found)];
}
export function journalMatches(journal='',profile){
 const j=journal.toLowerCase().replace(/[.]/g,'').replace(/\s+/g,' ').trim();
 return ({management:j==='管理世界',nature_main:j==='nature',science_main:j==='science',nature_health:j==='nature health',lancet:j==='the lancet public health',jama:j==='jama health forum'})[profile]||false;
}
export function writingGuidance(text,previous=[]){const ids=detectJournals(text);return (ids.length?ids:previous).filter(id=>WRITING_PROFILES[id]).map(id=>({id,...WRITING_PROFILES[id]}));}
