const host=document.getElementById('sciPlaybook');
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
const list=items=>{const ul=node('ul');for(const text of items)ul.append(node('li',text));return ul;};
if(host){
 try{
  const response=await fetch(new URL('./data/sci-playbook.json',import.meta.url));if(!response.ok)throw new Error('load');const data=await response.json();
  const intro=node('p','从选题到投稿，把每一步做成可检查的交付物。依据本站方法资料与科研工作流整理，可复制模板到自己的 AI 对话。','section-intro');host.append(intro);
  const grid=node('div',undefined,'card-grid');host.append(grid);
  for(const [index,stage] of data.stages.entries()){
   const card=node('article',undefined,'resource-card');card.append(node('span',String(index+1).padStart(2,'0'),'step'),node('h3',stage.title),node('p',stage.goal));
   const details=node('details');details.append(node('summary','展开技巧、检查与交付物'),node('h4','怎样做'),list(stage.tips),node('h4','完成前检查'),list(stage.checks),node('h4','交付物'),list(stage.deliverables));
   const resources=node('p');for(const skill of stage.skills){if(!/^skills\/[a-z0-9-]+\.md$/.test(skill.url||''))continue;const a=node('a',skill.label+' ↗');a.href=skill.url;a.target='_blank';a.rel='noopener';resources.append(a,document.createElement('br'));}details.append(resources);
   const prompt=node('textarea');prompt.value=stage.prompt;prompt.readOnly=true;prompt.rows=5;prompt.setAttribute('aria-label',stage.title+' AI 模板');details.append(prompt);
   card.append(details);const actions=node('div',undefined,'actions');const copy=node('button','复制阶段模板','secondary');copy.type='button';copy.dataset.puxianEvent='plan_export';const status=node('p','','micro');status.setAttribute('role','status');
   copy.onclick=async()=>{try{await navigator.clipboard.writeText(stage.prompt);status.textContent='模板已复制，请填写方括号中的研究信息。';}catch{details.open=true;prompt.focus();prompt.select();status.textContent='请选中模板手动复制。';}};
   const use=node('button','带入研究任务','text-button');use.type='button';use.onclick=()=>{const payload={source:'sci:'+stage.id,text:`SCI阶段：${stage.title}\n目标：${stage.goal}\n检查：${stage.checks.join('；')}\n交付物：${stage.deliverables.join('；')}\n对话模板：${stage.prompt}`,handled:false};document.dispatchEvent(new CustomEvent('puxian-resource-context',{detail:payload}));};
   actions.append(copy,use);card.append(actions,status);grid.append(card);
  }
  host.append(node('p','这些指南是现有方法与工作流的提炼，不代表作者个人的发表经历；具体分析需要原始数据、真实证据与研究者判断。','note'));
 }catch{host.append(node('p','SCI 指南暂未载入，请刷新页面重试。','note'));}
}
