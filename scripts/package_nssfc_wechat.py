"""Package the static WeChat article, four figures and redacted source tables."""
from pathlib import Path
import json,re,shutil,zipfile

ROOT=Path(__file__).resolve().parents[1]

def main(output):
    output.mkdir(parents=True,exist_ok=True)
    article=(ROOT/'nssfc-wechat.html').read_text(encoding='utf-8')
    markdown=(ROOT/'nssfc-wechat.md').read_text(encoding='utf-8')
    reps=json.loads((ROOT/'data/nssfc-wechat-figures/representatives.json').read_text(encoding='utf-8'))
    assert len(reps)==33
    forbidden={'id','principal','project_code','locator','pi','name','serial'}
    assert all(not (forbidden&set(r)) for r in reps)
    assert not re.search(r'\b\d{2}[A-Z&]{2,}\d{3}\b',markdown)
    assert '批准号' not in markdown and '定位：' not in markdown
    event_section=markdown.split('![2016—2026健康中国相关政策与立项热点事件线]')[1].split('## 机构图')[0]
    assert not re.search(r'^- ',event_section,re.M),'Remove duplicated event list beneath figure 1'
    figzip=ROOT/'downloads/nssfc-wechat-figures.zip'
    with zipfile.ZipFile(figzip,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted((ROOT/'assets/nssfc-figures').iterdir()):z.write(p,'图表/'+p.name)
        for p in sorted((ROOT/'data/nssfc-wechat-figures').iterdir()):z.write(p,'源数据/'+p.name)
        z.writestr('说明.txt','机构图、热力图、主题荟萃图、热点事件线；PNG 300dpi、SVG与PDF。\n33项正式立项示例不含PI姓名、批准号、内部编号或名单行号。\n2026年度名单缺失，不以零值表示；共现非因果，主题可交叉。\n政策事件官网链接保留在源数据events.json；项目官网来源在representatives.csv。\n复现脚本：https://github.com/naturedu/socialmedicine/blob/main/scripts/build_nssfc_wechat_figures.py\n')
    mapping={
      'shots/nssfc-cover.png':'国社科Skills_公众号封面.png',
      'shots/nssfc-promo.png':'国社科Skills_公众号宣传长图.png',
      'assets/nssfc-figures/institutions.png':'国社科_机构分布图.png',
      'assets/nssfc-figures/heatmap.png':'国社科_主题热力图.png',
      'assets/nssfc-figures/synthesis.png':'国社科_主题荟萃图.png',
      'assets/nssfc-figures/timeline.png':'国社科_热点事件线.png',
      'downloads/nssfc-wechat-figures.zip':'国社科_图表与来源.zip',
      'downloads/nssfc-project-synthesis.zip':'国社科立项荟萃与分析_Skills.zip',
    }
    for src,dest in mapping.items():
        shutil.copyfile(ROOT/src,output/dest)
        article=article.replace(src,dest);markdown=markdown.replace(src,dest)
    article=article.replace('href="nssfc-projects.html"','href="https://naturedu.github.io/socialmedicine/nssfc-projects.html"')
    article=article.replace('href="nssfc-wechat.md"','href="国社科Skills_公众号宣传稿.md"')
    article=article.replace('href="data/nssfc-wechat-figures/figure-qa.json"','href="https://naturedu.github.io/socialmedicine/data/nssfc-wechat-figures/figure-qa.json"')
    (output/'国社科Skills_公众号静态图文.html').write_text(article,encoding='utf-8')
    (output/'国社科Skills_公众号宣传稿.md').write_text(markdown,encoding='utf-8')
    kit=output/'国社科Skills_公众号宣传素材包.zip'
    with zipfile.ZipFile(kit,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for name in [*mapping.values(),'国社科Skills_公众号静态图文.html','国社科Skills_公众号宣传稿.md']:z.write(output/name,name)
        z.writestr('先读我.txt','公众号静态素材：大字号、加字距、加留白。\n含33项立项示例（2016—2026每年3项），无PI、批准号、内部ID和行号。\n图1之后重复事件列表已删除；事件官网来源见图表ZIP。\n封面、宣传长图、机构图、热力图、荟萃图、事件线可单独上传微信公众号。\n图表ZIP另含SVG、PDF及脱敏源数据。正文HTML可本地浏览。\n阅读原文：https://naturedu.github.io/socialmedicine/nssfc-projects.html\n本素材未向微信公众号发送或发布。\n')
    for p in [figzip,kit]:
        with zipfile.ZipFile(p) as z:assert z.testzip() is None
    shutil.copyfile(kit,ROOT/'downloads/nssfc-wechat-kit.zip')
    print(json.dumps(dict(representatives=len(reps),figures=4,redacted=True,kit=str(kit),bytes=kit.stat().st_size),ensure_ascii=False))

if __name__=='__main__':
    import argparse
    ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);main(ap.parse_args().output)
