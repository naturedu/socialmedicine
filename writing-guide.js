(function(){
 const btn=document.getElementById('journalReview');if(!btn)return;
 btn.addEventListener('click',()=>{
  const input=document.getElementById('polInput').value.trim(),mode=document.getElementById('writingMode').value,out=document.getElementById('journalReviewResult');
  out.replaceChildren();const h=document.createElement('h3');h.textContent=mode+' · 审读任务书';out.append(h);
  if(!input){const p=document.createElement('p');p.textContent='先在上方粘贴待审读文本。';out.append(p);return}
  const specific=mode==='管理世界'?'按“现实制度矛盾—研究问题—理论机制—识别与证据—管理启示”检查。解释对既有管理研究的具体推进，不堆砌政策背景，不把统计中介直接当作因果机制。':mode==='Nature / Science'?'检查核心科学问题是否明确、证据是否支持跨情境解释、主结果是否前置、替代解释是否排除、适用边界是否清楚。不能只靠修辞将局部相关性升级为普遍机制。':'检查人群与场景、研究设计、比较方案、主要结局、效应量与不确定性、伦理与注册、实践意义及外推边界。按设计选择 CONSORT、STROBE、PRISMA、CHEERS 等报告规范。';
  const hints=[];if(!/\d/.test(input))hints.push('未发现数字：若这是结果段，补充效应量、区间和样本信息；不要凭空补数。');
  if(/首次|填补空白|国际领先|开创性|first ever|groundbreaking/i.test(input))hints.push('发现优先性／创新性强措辞，需检索证据或降低表述强度。');
  if(/导致|因果|causal|cause/i.test(input)&&!/随机|工具变量|断点|双重差分|natural experiment|random|difference-in-differences/i.test(input))hints.push('存在因果措辞，但片段内未发现明确识别设计；需结合全文核查。');
  if(!hints.length)hints.push('未命中本地提示规则；这不表示全文已经通过学术审读。');
  const p=document.createElement('p');p.textContent='本地规则提示：'+hints.join(' ');out.append(p);
  const pre=document.createElement('pre');pre.textContent='请按 '+mode+' 的学术表达与论证要求审读以下文本。\n'+specific+'\n保持所有数字、研究对象、引文及结论强度；缺少证据处标注待核。输出：修改稿、逐条修改理由、事实与引用检查、待补证据。禁止虚构文献或未报告结果。\n\n待审读原文：\n'+input;out.append(pre);
  const note=document.createElement('p');note.textContent='此处生成可复制的审读任务书与规则提示；没有自动调用语言模型，也不把提示当作已经完成的深度润色。';out.append(note);
 });
})();
