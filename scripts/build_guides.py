"""Rebuild static reading pages: pip install -r requirements-docs.txt."""
import html,re,os
from urllib.parse import urlparse,unquote
from pathlib import Path
import markdown

ROOT=Path(__file__).resolve().parents[1]
def strip_frontmatter(text):
    while text.startswith('---\n'):
        match=re.match(r'---\n[\s\S]*?\n---\n',text)
        if not match:break
        text=text[match.end():].lstrip()
    return text

def build():
    (ROOT/'guides').mkdir(exist_ok=True)
    for path in sorted((ROOT/'skills').rglob('*.md')):
        output=ROOT/'guides'/path.relative_to(ROOT/'skills').with_suffix('.html')
        output.parent.mkdir(parents=True,exist_ok=True)
        text=strip_frontmatter(path.read_text(encoding='utf-8-sig'))
        text=re.sub(r'^(### ([A-J]\d+) .+)$',lambda m:f'<span id="method-{m[2].lower()}"></span>\n\n'+m[1],text,flags=re.M)
        def resolve_link(match):
            raw=match[1];url=urlparse(raw)
            if url.scheme or url.netloc or not url.path:return match[0]
            target=(path.parent/unquote(url.path)).resolve()
            if not target.exists():return match[0]
            if target.suffix=='.md' and target.is_relative_to(ROOT/'skills'):
                target=ROOT/'guides'/target.relative_to(ROOT/'skills').with_suffix('.html')
            relative=os.path.relpath(target,output.parent).replace('\\','/')
            return ']('+relative+('#'+url.fragment if url.fragment else '')+')'
        text=re.sub(r'\]\(([^)]+)\)',resolve_link,text)
        md=markdown.Markdown(extensions=['fenced_code','tables','toc','sane_lists'],extension_configs={'toc':{'toc_depth':'2-3'}})
        content=md.convert(text)
        title=re.search(r'^# (.+)$',text,re.M)
        title=title[1] if title else path.stem
        rootrel=os.path.relpath(ROOT,output.parent).replace('\\','/')
        sourcerel=os.path.relpath(path,output.parent).replace('\\','/')
        page=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} · 普贤</title><link rel="stylesheet" href="{rootrel}/guide.css"></head><body><header><a class="back" href="{rootrel}/index.html#methods">← 方法工作台</a><a href="{rootrel}/database-skills.html">🌱 数据库</a><a href="{rootrel}/guides/method-map.html">🧭 逻辑地图</a><a href="{sourcerel}" download>下载 Markdown</a></header><main><aside aria-label="章节目录">{md.toc}</aside><article>{content}<p class="note">普贤 · 社医卫管方法库 · 教学参数与代码接口需结合实际数据、软件版本和研究设计核对。</p></article></main><script defer src="{rootrel}/tracker.js?v=20261029complete1"></script><script type="module" src="{rootrel}/skill-usage.mjs?v=20261029complete1"></script></body></html>'''
        if path.stem in ['standardized-patient-skill','implementation-science-skill']:
            page=re.sub(r'(<a href="[^"]+\.(?:R|do|csv)")>',r'\1 download>',page)
        output.write_text(page,encoding='utf-8')
    print('Built',len(list((ROOT/'skills').rglob('*.md'))),'reading pages')

if __name__=='__main__':build()
