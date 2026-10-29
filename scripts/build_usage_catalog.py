"""Build the finite public skill whitelist; optionally update the analytics source.

python scripts/build_usage_catalog.py [--analytics-root /absolute/source/checkout]
Only public skill documents are used; no participant data or local history.
"""
import argparse,json,re,shutil
from pathlib import Path
R=Path(__file__).resolve().parents[1]
def tracker_text(path, skill_ids, platform_ids):
    """Replace only the two finite whitelist declarations, preserving line endings."""
    text=path.read_bytes().decode('utf-8')
    for name, values in [('skillIds',skill_ids),('platforms',platform_ids)]:
        pattern=rf'(?m)^([ \t]*)const {name}=new Set\([^\r\n]*\);([ \t]*)(\r?)$'
        text,count=re.subn(pattern,lambda m:f'{m[1]}const {name}=new Set({json.dumps(values,ensure_ascii=False)});{m[2]}{m[3]}',text)
        if count!=1:raise ValueError(f'Expected exactly one {name} whitelist in {path.name}')
    return text

def build(analytics_root=None):
    root=Path(analytics_root).resolve() if analytics_root else None
    if root and (not (root/'.openai/hosting.json').exists() or not (root/'lib').is_dir()):
        raise ValueError('Choose an existing analytics Site source checkout')
    platform_file=R/'data/usage-platforms.json'
    platforms=json.loads(platform_file.read_text(encoding='utf-8'))
    if not isinstance(platforms,dict) or not platforms:raise ValueError('Platforms must be a nonempty object')
    for key,value in platforms.items():
        if not re.fullmatch('[a-z]+',key) or not isinstance(value,dict) or not isinstance(value.get('label'),str) or not value['label'].strip():
            raise ValueError('Invalid platform definition')
        if value.get('url') is not None and (not isinstance(value['url'],str) or not value['url'].startswith('https://')):
            raise ValueError('Platform URLs must be HTTPS or null')
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
        elif slug in ['academic-copyediting-skill','research-workflow-skill','research-public-posts-skill']:category='writing'
        elif any(x in slug for x in ['ppt','slides','storyboard','defense']):category='slides'
        elif any(x in slug for x in ['figure','graphical']):category='figure'
        elif slug=='socialmedicineskills':category='general'
        catalog[slug]=dict(id=slug,label=re.sub(r'^[^\w\u4e00-\u9fff]+','',title[1]).strip(),category=category,file='skills/'+p.name,guide='guides/'+slug+'.html',instructions=text)
    public={k:{n:v[n] for n in ['id','label','category','file','guide']} for k,v in catalog.items()}
    trackers=[R/'tracker.js']+([root/'public/tracker.js'] if root else [])
    rewritten={path:tracker_text(path,list(catalog),list(platforms)) for path in trackers}
    (R/'data/usage-skill-catalog.json').write_text(json.dumps(public,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    if root:
        (root/'lib/skill-catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        shutil.copyfile(platform_file,root/'lib/usage-platforms.json')
        shutil.copyfile(R/'skill-task-core.mjs',root/'lib/skill-task-core.mjs')
    for path,text in rewritten.items():path.write_bytes(text.encode('utf-8'))
    print('Usage whitelist:',len(catalog),'public documents;',len(platforms),'platforms')
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--analytics-root');a=p.parse_args();build(a.analytics_root)
