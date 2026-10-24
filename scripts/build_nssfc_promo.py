"""Build the approved-project skill pack and static WeChat article.

Developer dependencies: qrcode, markdown. PNG exports are rendered and visually
checked in the browser from nssfc-cover.html and nssfc-poster.html.
"""
from pathlib import Path
import shutil,zipfile,re,json
from collections import Counter
import markdown,qrcode
from qrcode.image.svg import SvgPathImage

ROOT=Path(__file__).resolve().parents[1]
SKILL=ROOT/'skills/nssfc-project-synthesis'

def add_evidence(text):
    folder=ROOT/'data/nssfc-wechat-figures'
    if not (folder/'representatives.json').exists():return text
    reps=json.loads((folder/'representatives.json').read_text(encoding='utf-8'))
    events=json.loads((folder/'events.json').read_text(encoding='utf-8'))
    block=['<!-- evidence:start -->',f'## 2016—2026：{len(reps)}项代表性立项选读','',
      '每年选取3项健康中国相关议题的正式立项，展示题名、机构、类别和官网来源。按年份与议题选读，不据此推断同年政策对项目的因果影响。','']
    last_year=None
    for r in reps:
        if r['date']!=last_year:
            block+=['',f'### {r["date"]}年',''];last_year=r['date']
        block += [f'- **{r["reading_theme"]}**：《{r["title"]}》。{r["organization"]}；{r["project_type"]}。[官网来源]({r["notice"]}) · [正式名单]({r["source"]})。']
    block += ['', '**2026年示例来自已核实的重大专项，不能把它当作年度重点、一般、青年名单完整公布。**',
      '', '## 热点事件线：把政策背景与立项记录放在一起','',
      '![2016—2026健康中国相关政策与立项热点事件线](assets/nssfc-figures/timeline.png)','',
      '']
    block += ['', '## 机构图：哪些责任单位在本库中出现较多？','',
      '![卫生健康题名项目机构分布图](assets/nssfc-figures/institutions.png)','',
      '*图2｜卫生健康题名子集2,659项，涉及579个机构名称；展示频次前12个责任单位。每个项目全计数，学院、附属医院及历史校名不自动归并。*','',
      '在当前覆盖中，北京大学45项、上海交通大学41项、中山大学37项。机构频次适合寻找团队和阅读线索，不能替代质量排名或申报成功率。','',
      '## 热力图：逐年观察七类健康研究议题','',
      '![2016—2026年度正式立项主题热力图](assets/nssfc-figures/heatmap.png)','',
      '*图3｜仅使用已核对全国条数的年度重点、一般、青年批次。格内为卫生健康题名子集中各主题的项目数，颜色为每千项全学科年度立项的命中频次。主题可交叉；2026灰格表示缺失，不表示零立项。*','',
      '在本图卫生健康子集的年度批次中，公共卫生与应急题名由2019年的8项增至2020年的85项，2021年83项、2022年73项。时间上与疫情应对背景并列阅读，不能据此估计事件的因果效应。2026已取得的重大专项不混入年度比较。上一节跨时期频次来自领域主库；本图限定卫生健康题名子集，数值应按图注范围阅读。','',
      '## 荟萃图：研究主题如何交叉标注？','',
      '![健康中国相关研究主题荟萃图](assets/nssfc-figures/synthesis.png)','',
      '*图4｜节点面积表示主题项目数，边宽表示同题共现数，仅绘制共现至少10项的主题对。位置仅用于排版。部分共同标注源于词表规则重叠，不表示已验证跨领域机制；这不是效应量Meta分析。*','',
      '七组主题将健康服务、保障、公共卫生、老龄照护、生育托育、心理健康与健康公平放在同一张阅读地图中。图中联系需要回到原题名和项目成果继续核验。','',
      '[下载四张图、可编辑SVG/PDF和不含PI姓名的源数据](downloads/nssfc-wechat-figures.zip) · [查看代表项目与图表口径](data/nssfc-wechat-figures/figure-qa.json)','',
      '<!-- evidence:end -->']
    rendered='\n'.join(block)
    if '<!-- evidence:start -->' in text:
        text=re.sub(r'<!-- evidence:start -->[\s\S]*?<!-- evidence:end -->',lambda _:rendered,text)
    else:text=text.replace('## 使用本 Skills，就能完成怎样的荟萃？',rendered+'\n\n## 使用本 Skills，就能完成怎样的荟萃？')
    text=text.replace('每条记录保留项目年度、题名、责任单位、公开负责人、名单定位以及官网公告或存档、附件链接。原名单公开批准号的，照原文保留；没有提供的，留空说明。',
      '本期仅展示项目年份、题名、责任单位、类别与官网来源。')
    text=text.replace('本期展示项目年度、题名、责任单位、类别、名单定位和官网来源，不展示PI人名。原名单公开批准号的，照原文保留；没有提供的，留空说明。','本期仅展示项目年份、题名、责任单位、类别与官网来源。')
    text=text.replace('、附件与名单定位','与附件来源').replace('及来源定位与缺口','及来源与缺口').replace('保留来源定位与缺口','保留来源与缺口')
    return text

def main():
    rows=json.loads((ROOT/'data/nssf-projects.json').read_text(encoding='utf-8'))
    health=[r for r in rows if r['health_core']]
    themes=Counter(t for r in health for t in r['topics'])
    assert len(rows)==4471 and len(health)==2659,'Review promotion snapshot counts before rebuilding'
    for topic,count in {'老龄养老与长期照护':1073,'医疗卫生服务与医改':426,'公共卫生与应急':353,'健康公平与社会决定因素':203,'医疗保障与支付改革':107,'心理健康与社会心理服务':90}.items():
        assert themes[topic]==count,(topic,themes[topic],count)
    (SKILL/'scripts').mkdir(exist_ok=True)
    (SKILL/'data').mkdir(exist_ok=True)
    for filename in ['nssfc_extract.py','build_nssfc.py']:
        shutil.copyfile(ROOT/'scripts'/filename,SKILL/'scripts'/filename)
    shutil.copyfile(ROOT/'data/nssfc-source-files.json',SKILL/'data/nssfc-source-files.json')
    if (ROOT/'LICENSE').exists():shutil.copyfile(ROOT/'LICENSE',SKILL/'LICENSE')
    (ROOT/'downloads').mkdir(exist_ok=True)
    target=ROOT/'downloads/nssfc-project-synthesis.zip'
    with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p in sorted(SKILL.rglob('*')):
            if p.is_file() and '__pycache__' not in p.parts:
                info=zipfile.ZipInfo(str(p.relative_to(SKILL.parent)).replace('\\','/'),date_time=(2026,10,24,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED
                z.writestr(info,p.read_bytes())
    with zipfile.ZipFile(target) as z:assert z.testzip() is None
    qr=qrcode.QRCode(box_size=6,border=3,error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data('https://naturedu.github.io/socialmedicine/nssfc-projects.html');qr.make(fit=True)
    qr.make_image(image_factory=SvgPathImage).save(ROOT/'assets/nssfc-qr.svg')
    source=add_evidence((ROOT/'nssfc-wechat.md').read_text(encoding='utf-8'))
    (ROOT/'nssfc-wechat.md').write_text(source,encoding='utf-8')
    body=markdown.markdown(source,extensions=['fenced_code','sane_lists'])
    styles={'h1':'font-size:31px;line-height:1.65;letter-spacing:1.2px;color:#163e35;margin:30px 0 24px;',
      'h2':'font-size:24px;color:#163e35;line-height:1.75;letter-spacing:1px;margin:42px 0 24px;border-bottom:1px solid #dde2d0;padding-bottom:14px;',
      'h3':'font-size:22px;color:#285441;line-height:1.8;letter-spacing:1px;margin:34px 0 18px;',
      'p':'font-size:19px;line-height:2.05;letter-spacing:.8px;margin:22px 0;color:#364c3e;',
      'li':'font-size:19px;line-height:2.05;letter-spacing:.8px;margin:22px 0;color:#364c3e;',
      'ul':'padding-left:22px;margin:24px 0;',
      'ol':'padding-left:24px;margin:24px 0;',
      'a':'color:#226648;text-decoration:underline;overflow-wrap:anywhere;',
      'blockquote':'background:#eff1e4;border-left:3px solid #a48a4f;padding:12px 22px;margin:28px 0;',
      'code':'font-size:13px;overflow-wrap:anywhere;color:#486342;',
      'img':'width:calc(100% + 48px);max-width:calc(100% + 48px);height:auto;display:block;margin:26px -24px 18px;',
      'em':'font-style:normal;font-size:16px;line-height:2;letter-spacing:.6px;color:#6a796b;'}
    for tag,style in styles.items():body=re.sub('<'+tag+r'(\s[^>]*)?>',lambda m:'<'+tag+(m.group(1) or '').rstrip().removesuffix('/')+' style="'+style+'">',body)
    body=re.sub(r'(<img\b[^>]*src="([^"]+)"[^>]*>)',lambda m:'<a href="'+m[2]+'" target="_blank" rel="noopener" aria-label="查看高清图" style="display:block;text-decoration:none">'+m[1]+'</a>',body)
    nav='<nav style="max-width:677px;margin:20px auto;padding:16px 36px;font:15px/2 sans-serif;letter-spacing:.6px"><a href="nssfc-projects.html">← 立项图谱</a> · <a href="shots/nssfc-promo.png" download>下载宣传长图</a> · <a href="shots/nssfc-cover.png" download>下载封面</a> · <a href="nssfc-wechat.md" download>下载文案</a></nav>'
    cover='<img src="shots/nssfc-cover.png" alt="国社科立项荟萃，看健康中国建设" style="width:100%;height:auto;display:block">'
    article='<article style="max-width:677px;margin:auto;background:#fffdf7;font-family:Microsoft YaHei,sans-serif">'+cover+'<div style="padding:18px 38px 40px">'+body+'</div></article>'
    (ROOT/'nssfc-wechat.html').write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>国社科立项荟萃 · 健康中国建设研究布局</title></head><body style="margin:0;background:#f4f4ed">'+nav+article+'</body></html>\n',encoding='utf-8')
    print('Built static WeChat article, QR and skill pack:',target.stat().st_size,'bytes')

if __name__=='__main__':main()
