"""Rebuild the public material index without mutating pages or historical archives."""
import json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def build():
    specs=[
      ('visual-skills','科研画图与PPT工作流','画图与PPT','visual-skills.html'),
      ('database-skills','数据库卡片与操作路线','数据','database-skills.html'),
      ('database-sources','数据库官方文档与出处','数据','database-skills.html'),
      ('policy-topics','政策主题与研究逻辑','政策','policy-topics.html'),
      ('policy-documents','官方政策文件与入口','政策','policy-topics.html'),
      ('library','专题文献与方法参考','文献','library.html'),
      ('studio-library','工作台知识与阅读材料','文献','index.html#library'),
      ('papers','CSSCI当前专题筛选版','文献','papers.html'),
      ('archive/cssci-100','CSSCI原站100条双语语料（历史归档）','历史归档','papers-archive.html'),
      ('figures','论文图表与图源','图表','figures.html'),
      ('methods','方法完整说明','方法','methods.html'),
      ('studio-methods','代码与方法教程','方法','index.html#methods'),
      ('code-library','代码及上下文','代码','code.html'),
      ('tools','完整Skill教程','方法','tools.html'),
      ('journals','期刊总目录','期刊','journals.html'),
      ('user-journals','原提供期刊清单','期刊','journals.html'),
      ('studio-journals','期刊写作与周期口径','期刊','index.html#writing'),
      ('institutions','全球院校机构导航','院校','institutions.html'),
      ('research-schools','院系方向深度指南','院校','research-resources.html'),
      ('research-mentors','公开导师与教师介绍','院校','index.html#match'),
      ('research-conferences','国际会议与投稿信息','会议','research-conferences.html'),
      ('sci-playbook','SCI八阶段指南','方法','index.html#sci'),
      ('research-datasets','原有公共数据深度指南','数据','research-resources.html'),
      ('sources','检索与数据来源目录','数据','sources.html'),
      ('research-theses','博士论文题录与入口','论文','research-resources.html'),
      ('studio-classics','经典理论书架','理论','index.html#classics'),
      ('insurance-timeline','医保制度时间线','政策','insurance-timeline.html'),
      ('nssf-projects','国社科领域项目（2016—2025）','项目','grants.html'),
      ('moe-projects','教育部领域项目（2016—2025）','项目','grants.html')]
    records=[];collections=[]
    def add(key,title,kind,page,rows,source):
        if isinstance(rows,dict):
            candidates=[rows['papers']] if isinstance(rows.get('papers'),list) else [v for v in rows.values() if isinstance(v,list)]
            rows=max(candidates,key=len) if candidates else [rows]
        collections.append(dict(id=key,title=title,kind=kind,count=len(rows),url=page,source=source))
        for i,x in enumerate(rows):
            if not isinstance(x,dict):x=dict(content=x)
            name=next((str(x[k]) for k in ['title','name','title_zh','chinese_title','标题','paper_title'] if x.get(k)),key+' '+str(i+1))
            summary=next((str(x[k]) for k in ['use','description','desc','overview','abstract_zh','abstract','scope','core','text','content','focus','supports'] if x.get(k)),'')
            url='guides/'+x['guide']+'.html' if key=='database-skills' else page
            records.append(dict(id=key+':'+str(x.get('id',i+1)),collection=key,collection_title=title,kind=kind,title=name,summary=summary[:650],url=url,source=source,details=x))
    for key,title,kind,page in specs:
        p=R/'data'/(key+'.json')
        if p.exists():add(key,title,kind,page,read(p),p.relative_to(R).as_posix())
    legacy=read(R/'data/studio-legacy.json')
    for key,title,kind,page in [
      ('DATA_SOURCES','原站25个数据库入口','数据','classic.html#datasources'),
      ('SCHOOLS','原站12所院校完整介绍','院校','classic.html#schools'),
      ('JOURNALS','原站48条期刊速查','期刊','classic.html#journals'),
      ('TOP_JOURNALS','原站19篇选刊指南','期刊','classic.html#topjournals'),
      ('THEORIES','原站34条理论完整说明','理论','index.html#theory')]:
        add('legacy-'+key,title,kind,page,legacy[key],'data/studio-legacy.json')
    pages=[]
    for p in sorted((R/'guides').rglob('*.html')):
        title=re.search(r'<title>(.*?) · 普贤</title>',p.read_text(encoding='utf-8'))
        pages.append(dict(title=title[1] if title else p.stem,path=p.relative_to(R).as_posix()))
    add('reading-pages','完整方法与数据库阅读页','方法','method-garden.html#methods',pages,'guides/')
    for rec,page in zip(records[-len(pages):],pages):rec['url']=page['path'];rec['source']=page['path']
    payload=dict(updated='2026-10-23',count=len(records),collections=collections,records=records)
    (R/'data/material-index.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print('PUBLIC INDEX',len(records),'records',len(collections),'collections')
if __name__=='__main__':build()
