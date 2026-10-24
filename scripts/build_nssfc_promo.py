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
    body=markdown.markdown((ROOT/'nssfc-wechat.md').read_text(encoding='utf-8'),extensions=['fenced_code','sane_lists'])
    styles={'h1':'font-size:28px;line-height:1.5;letter-spacing:1px;color:#163e35;margin:26px 0 18px;',
      'h2':'font-size:21px;color:#163e35;line-height:1.6;margin:32px 0 16px;border-bottom:1px solid #dde2d0;padding-bottom:10px;',
      'p':'font-size:16px;line-height:2;margin:14px 0;color:#364c3e;',
      'li':'font-size:16px;line-height:2;margin:12px 0;color:#364c3e;',
      'a':'color:#226648;text-decoration:underline;overflow-wrap:anywhere;',
      'blockquote':'background:#eff1e4;border-left:3px solid #a48a4f;padding:8px 20px;margin:20px 0;',
      'code':'font-size:13px;overflow-wrap:anywhere;color:#486342;'}
    for tag,style in styles.items():body=re.sub('<'+tag+r'(\s[^>]*)?>',lambda m:'<'+tag+(m.group(1) or '')+' style="'+style+'">',body)
    nav='<nav style="max-width:677px;margin:18px auto;padding:12px 20px;font:14px/2 sans-serif"><a href="nssfc-projects.html">← 立项图谱</a> · <a href="shots/nssfc-promo.png" download>下载宣传长图</a> · <a href="shots/nssfc-cover.png" download>下载封面</a> · <a href="nssfc-wechat.md" download>下载文案</a></nav>'
    cover='<img src="shots/nssfc-cover.png" alt="国社科立项荟萃，看健康中国建设" style="width:100%;height:auto;display:block">'
    article='<article style="max-width:677px;margin:auto;background:#fffdf7;font-family:Microsoft YaHei,sans-serif">'+cover+'<div style="padding:12px 28px 30px">'+body+'</div></article>'
    (ROOT/'nssfc-wechat.html').write_text('<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>国社科立项荟萃 · 健康中国建设研究布局</title></head><body style="margin:0;background:#f4f4ed">'+nav+article+'</body></html>\n',encoding='utf-8')
    print('Built static WeChat article, QR and skill pack:',target.stat().st_size,'bytes')

if __name__=='__main__':main()
