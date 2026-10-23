"""Package the twelve public visual skills as self-contained installable folders."""
from pathlib import Path
import json,zipfile
R=Path(__file__).resolve().parents[1]

def build():
    rows=json.loads((R/'data/visual-skills.json').read_text(encoding='utf-8'))
    quality=R/'skills/figure-ppt-quality-skill.md'
    source=R/'skills/references/visual-skill-sources.md'
    with zipfile.ZipFile(R/'data/figure-ppt-skills.zip','w',zipfile.ZIP_DEFLATED) as z:
        z.write(R/'LICENSE','LICENSE')
        z.writestr('使用说明.txt','''普贤社会医学小助手 · 画图与PPT 12份技能

每个目录含SKILL.md，可按所用AI工具的技能安装方式安装对应目录。
每份均保留实际引用的质量手册、来源说明与本库原创辅助脚本，离开网站也可阅读。
脚本依赖：绘图需matplotlib；PPT生成与检查需python-pptx（及其Pillow依赖）。
不会自动安装依赖或调用外部服务。图片生成和专用重建软件为可选独立工具，本包不包含其软件、额度或账号。
本包不含私人对话、研究数据、未发表稿件、账户配置或原论文图片。
完整入口：https://naturedu.github.io/socialmedicine/visual-skills.html
''')
        for e in rows:
            base=e['id']+'/'
            z.write(R/'skills'/(e['guide']+'.md'),base+'SKILL.md')
            z.write(quality,base+'figure-ppt-quality-skill.md')
            z.write(source,base+'references/visual-skill-sources.md')
            for name in ['plot_effects.py','build_editable_deck.py','audit_slides.py']:
                z.write(R/'skills/scripts'/name,base+'scripts/'+name)
    with zipfile.ZipFile(R/'data/figure-ppt-skills.zip') as z:
        assert len([n for n in z.namelist() if n.endswith('/SKILL.md')])==len(rows)
        assert z.testzip() is None
    print('PACKAGED',len(rows),'self-contained visual skills')

if __name__=='__main__':build()
