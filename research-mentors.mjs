let source;
const data=()=>source??=fetch(new URL('./data/research-mentors.json',import.meta.url)).then(r=>{if(!r.ok)throw new Error();return r.json();});
const node=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
function link(text,url){const a=node('a',text);if(/^https:\/\//.test(url||'')){a.href=url;a.target='_blank';a.rel='noopener';}return a;}
class PuxianMentors extends HTMLElement{
 async connectedCallback(){
  if(this.shadowRoot)return;const root=this.attachShadow({mode:'open'});const style=node('style',':host{display:block;margin:18px 0;color:#355348;font:14px/1.8 system-ui,sans-serif}details{border-top:1px solid #dce4d9;padding-top:12px}summary{cursor:pointer;color:#315b46}article{border-left:2px solid #c7b98e;padding:0 0 0 16px;margin:18px 0}h4{font-size:16px;margin:0}p{margin:6px 0}a{color:#315b46;overflow-wrap:anywhere}small{display:block;color:#758077}');root.append(style);
  try{
   const records=await data(),school=records.find(x=>x.id===this.getAttribute('school-id'));
   if(!school?.mentors?.length){root.append(node('small','该院系的导师条目尚未完成核验，请先查看院系官方师资与招生目录。'));return;}
   const fold=node('details'),summary=node('summary',`查看已收录教师与公开联系入口（${school.mentors.length} 位）`);fold.append(summary,node('small','博士指导身份、当前任职与当年招生名额分别核对。此处仅呈现院校官网公开资料；不代表招生邀请。'));
   for(const m of school.mentors){const card=node('article');card.append(node('h4',m.name),node('p',m.title),node('small',m.unit),node('p','研究方向：'+m.research.join('；')),node('small',m.qualificationNote));
    if(m.email){const a=node('a',m.email);a.href='mailto:'+m.email;card.append(node('span','公开工作邮箱：'),a,node('br'));}
    else card.append(node('small','联系信息请查看官方教师页；本站未摘录其邮箱。'));
    card.append(link('官方教师资料 ↗',m.url));if(m.qualificationUrl&&m.qualificationUrl!==m.url){card.append(node('span',' · '),link('指导资格出处 ↗',m.qualificationUrl));}
    if(m.evidence?.length){const sources=node('details');sources.append(node('summary','核验来源'));for(const e of m.evidence)sources.append(link(e.label+' ↗',e.url),node('br'));card.append(sources);}
    card.append(node('small','资料核验：'+school.checked+'；当年招生计划待核实。'));fold.append(card);
   }root.append(fold);
  }catch{root.append(node('small','教师资料暂未载入，请刷新重试或查看院系官方师资页。'));}
 }
}
customElements.define('puxian-mentors',PuxianMentors);
