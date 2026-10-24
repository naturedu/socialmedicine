"""Unify public indexes; preserve provenance and never ingest local PDFs or chats."""
from pathlib import Path
from collections import Counter
import json,re,unicodedata
ROOT=Path(__file__).resolve().parents[1]
def read(name):return json.loads((ROOT/'data'/f'{name}.json').read_text(encoding='utf-8'))
def write(name,data):(ROOT/'data'/f'{name}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def title_key(s):return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',s).lower())
def doi_key(s):return re.sub(r'^https?://(?:dx\.)?doi.org/','',s.lower().strip())
def build():
 rows=[];bydoi={};bytitle={};duplicates=0
 for collection in ['studio-library','library']:
  for item in read(collection):
   r=dict(item);origin={'collection':collection,'id':str(r['id']),'verification':r.get('verified',r.get('verification','未另核验'))}
   segment={**origin,**{k:r[k] for k in ['text','locator','license','url','kind'] if k in r}}
   doi=doi_key(r.get('doi',''));title=title_key(r['title'])
   match=bydoi.get(doi) if doi else None
   if match is None:match=bytitle.get(title)
   if match is not None:
    target=rows[match];target['origins'].append(origin);target['segments'].append(segment);duplicates+=1
    # Article fragments share a DOI but contain different evidence. Keep all
    # authorized text and its individual locator; deduplicate cards, not content.
    if r.get('text') and r['text'] not in target.get('text',''):
     target['text']+='\n\n'+r.get('locator','补充片段')+'\n'+r['text']
    if not target.get('doi') and doi:target['doi']=doi;bydoi[doi]=match
    continue
   if collection=='library':
    kw=r.get('keywords',[]);kw='；'.join(kw) if isinstance(kw,list) else str(kw)
    r.update(id='public-'+str(r['id']),kind='公开题录',locator='公开题录；未导入全文',license='题录索引与原文入口；原论文权利归原作者或出版者',verified=r.get('verification','继承题录；未另核验'),text=f"{r.get('journal','')} · {r.get('year','')}\n{kw}\n{r.get('screening_note','')}\n仅提供题录线索，不据标题生成论文结论。")
   r['origins']=[origin];r['segments']=[segment]
   r['contentLevel']='题录' if r.get('kind') in ['公开题录','既有题录'] else '站内导读/方法' if r.get('kind')!='期刊文献' else '摘要/许可片段'
   bytitle[title]=len(rows)
   if doi:bydoi[doi]=len(rows)
   rows.append(r)
 write('research-knowledge',rows)
 write('knowledge-coverage',{'updated':'2026-10-24','inputs':{c:len(read(c)) for c in ['studio-library','library']},'total':len(rows),'mergedDuplicates':duplicates,'journals':dict(Counter(r.get('journal','未分组') for r in rows)),'contentLevels':dict(Counter(r['contentLevel'] for r in rows)),'scope':'公开题录、摘要/许可片段、原创导读与方法；并非全文语料。按DOI或规范题名去重，origins保留原索引与核验状态。个人聊天和本地PDF不上传；没有模型训练。'})
 print('Unified public knowledge:',len(rows),'records;',duplicates,'duplicate index entries merged')
if __name__=='__main__':build()
