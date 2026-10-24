"""Build the finite public skill whitelist; optionally update the analytics source.

python scripts/build_usage_catalog.py [--analytics-root /absolute/source/checkout]
Only public skill documents are used; no participant data or local history.
"""
import argparse,json,re
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def build(analytics_root=None):
    catalog={}
    for p in sorted((R/'skills').glob('*.md')):
        if p.stem=='methods-89':continue
        text=p.read_text(encoding='utf-8-sig')
        if text.startswith('---\n'):text=re.sub(r'^---\n[\s\S]*?\n---\n','',text,count=1)
        title=re.search(r'^# (.+)',text,re.M)
        if not title:continue
        slug=p.stem;category='method'
        if 'database' in slug or slug in ['aging-family-extension-skill','cross-cohort-harmonization-skill']:category='database'
        elif slug in ['long-term-care-policy-skill','home-hospital-bed-policy-skill','policy-text-analysis-skill']:category='policy'
        elif slug in ['academic-copyediting-skill','research-workflow-skill']:category='writing'
        elif any(x in slug for x in ['ppt','slides','storyboard','defense']):category='slides'
        elif any(x in slug for x in ['figure','graphical']):category='figure'
        elif slug=='socialmedicineskills':category='general'
        catalog[slug]=dict(id=slug,label=re.sub(r'^[^\w\u4e00-\u9fff]+','',title[1]).strip(),category=category,file='skills/'+p.name,guide='guides/'+slug+'.html',instructions=text)
    public={k:{n:v[n] for n in ['id','label','category','file','guide']} for k,v in catalog.items()}
    (R/'data/usage-skill-catalog.json').write_text(json.dumps(public,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if analytics_root:
        root=Path(analytics_root).resolve()
        if not (root/'.openai/hosting.json').exists() or not (root/'lib').is_dir():raise ValueError('Choose an existing analytics Site source checkout')
        (root/'lib/skill-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Usage whitelist:',len(catalog),'public documents')
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--analytics-root');a=p.parse_args();build(a.analytics_root)
