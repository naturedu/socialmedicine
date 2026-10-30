// Public database-level metadata only. No policy records or policy text.
export const CDRIP = Object.freeze({
  id:'cdrip2026', name:'中国 DRGs/DIP 支付方式改革政策文本数据库（CDRIP2026）',
  englishName:'China DRG/DIP Reform Insurance Policy database (CDRIP2026)',
  author:'杜思娴', authorEnglish:'Du, Sixian',
  affiliation:'华中科技大学医药卫生管理学院',
  email:'dusixian@hust.edu.cn', telephone:'18217878646',
  doi:'10.5281/zenodo.23720911', url:'https://doi.org/10.5281/zenodo.23720911',
  page:'cdrip2026.html', published:'2026-10-28', cutoff:'2026-10-01',
  orcid:'https://orcid.org/0009-0009-9804-4645',
  description:'由杜思娴主持编制，围绕中国 DRG/DIP 医保支付方式改革整理政策文本。公开页面提供数据库介绍、试点城市分布图、引用信息和联系申请入口；具体数据须申请获取。',
  citationZh:'杜思娴. 中国 DRGs/DIP 支付方式改革政策文本数据库（CDRIP2026）[DB/OL]. Zenodo, 2026-10-28. https://doi.org/10.5281/zenodo.23720911.',
  citationEn:'Du, S. (2026, October 28). China DRG/DIP Reform Insurance Policy database (CDRIP2026) [Data set]. Zenodo. https://doi.org/10.5281/zenodo.23720911.',
  acknowledgement:'感谢华中科技大学医药卫生管理学院 DRG/DIP 研究小组提供的中国 DRG/DIP 支付方式改革政策文本数据库（CDRIP2026）。'
});

export function isCDRIPQuery(q, previous={}) {
  const text=String(q).normalize('NFKC');
  if(/cdrip\s*2026|\bcdrip\b|政策文本数据库|政策文本库|支付方式改革数据库|(?:drgs?|dip).{0,35}(?:数据库|数据申请|引用|doi)|杜思娴.{0,20}(?:数据库|引用|联系)/i.test(text))return true;
  return previous.kind==='cdrip' && !/charls|clhls|nhanes|cfps|chns|\bhrs\b|另一个|换个|别的/i.test(text)
    && /^(?:它|这个库|这个数据库|那)?(?:怎么引用|如何引用|引用格式|引用信息|英文引用|中文引用|doi|联系方式|怎么联系|联系作者|邮箱|电话|如何申请|怎么申请|申请数据|看地图|地图|数据在哪|获取数据|谁编制)[？?。\s]*$/i.test(text.trim());
}

export function cdripReply(){
  return {status:'answered',title:'CDRIP2026 · 政策文本数据库',
    paragraphs:[CDRIP.description],
    sections:[
      {heading:'作者与联系方式',items:[CDRIP.author+'（Du Sixian）｜'+CDRIP.affiliation,'邮箱：'+CDRIP.email+'；电话：'+CDRIP.telephone]},
      {heading:'如何引用',items:[CDRIP.citationZh,CDRIP.citationEn]},
      {heading:'数据申请',items:['本网站公开宣传介绍与数据库级引用信息，不提供逐条政策检索或数据文件下载。','面向学术研究免费申请。请联系杜思娴，说明研究主题、用途与所需资料，按要求提交研究信息采集表并办理使用手续。']}
    ],
    sources:[{title:'数据库独立介绍页 · 地图与引用',url:CDRIP.page},{title:'Zenodo 数据库登记记录',url:CDRIP.url},{title:'作者 ORCID',url:CDRIP.orcid}],
    suggestions:['CDRIP2026 如何引用？','CDRIP2026 如何申请数据？']
  };
}

export const publicSections=[
 {title:'CDRIP2026 数据库介绍',terms:'CDRIP2026 中国 DRG DRGs DIP 支付方式改革 医保 政策文本 数据库 简介 研究',description:CDRIP.description,href:'#about'},
 {title:'作者与联系方式',terms:'杜思娴 Du Sixian 主理人 编制人 华中科技大学 HUST 联系 邮箱 电话 申请 获取 数据',description:'杜思娴｜华中科技大学医药卫生管理学院｜dusixian@hust.edu.cn｜18217878646',href:'#contact'},
 {title:'引用信息 · DOI',terms:'文献 引用 cite citation APA GB/T 7714 DOI Zenodo 参考文献 致谢 23720911',description:CDRIP.citationZh,href:'#citation'},
 {title:'试点城市分布地图',terms:'地图 城市 省 地区 DRG DIP 试点 覆盖 分布',description:'保留交付包原有试点城市概览图。点位为示意，DIP 图示为原宣传材料已核验部分。',href:'#map'},
 {title:'研究应用与获取方式',terms:'研究 方法 分析 PMC LDA BERTopic 扎根 编码 DID ITS 效果 评估 申请 Excel CSV EndNote RIS 下载',description:'可用于政策文本编码、主题分析和政策时点梳理。具体数据请联系主理人申请，因果评估还需结局数据与设计假设。',href:'#research'}
];
export function searchPublicInfo(value){
 const tokens=String(value).normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
 return publicSections.filter(x=>tokens.every(t=>(x.title+' '+x.terms+' '+x.description).toLowerCase().includes(t)));
}
