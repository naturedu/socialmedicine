"""Build a redacted NSFC analysis and reusable Skill archive."""
from pathlib import Path
import json,shutil,zipfile
import markdown
ROOT=Path(__file__).resolve().parents[1]

def main():
 skill=ROOT/'skills/nsfc-health-synthesis';(skill/'scripts').mkdir(exist_ok=True)
 shutil.copyfile(ROOT/'scripts/build_nsfc_health.py',skill/'scripts/build_nsfc_health.py')
 report=(ROOT/'data/nsfc-health-report.md').read_text(encoding='utf-8')
 body=markdown.markdown(report.replace('<','&lt;').replace('>','&gt;'),extensions=['tables'])
 style='body{max-width:1040px;margin:40px auto;padding:0 22px;background:#fafaf6;color:#223b30;font:15px/1.9 system-ui,Microsoft YaHei,sans-serif}h1,h2{color:#174735}h2{margin-top:36px}table{border-collapse:collapse;width:100%;font-size:13px}td,th{padding:10px;border:1px solid #d9e2d4;text-align:left}th{background:#edf2e5}a{color:#246449}code{overflow-wrap:anywhere;font-size:11px}@media(max-width:720px){table{display:block;overflow-x:auto}}@media print{body{background:white}h2{break-after:avoid}}'
 rendered='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>国自然经管健康项目分析报告</title><style>'+style+'</style><a href="https://naturedu.github.io/socialmedicine/nsfc-health.html">打开交互分析</a><main>'+body+'</main></html>'
 (ROOT/'data/nsfc-health-report.html').write_text(rendered,encoding='utf-8')
 rows=json.loads((ROOT/'data/nsfc-health-projects.json').read_text(encoding='utf-8'))
 assert all(not ({'principal','project_code','serial','amount','pi','name'}&r.keys()) for r in rows)
 with zipfile.ZipFile(ROOT/'downloads/nsfc-health-analysis.zip','w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for p in sorted((ROOT/'data').glob('nsfc-health-*')):
   if p.suffix in ['.json','.csv','.md','.html']:z.write(p,'data/'+p.name)
  for p in sorted(skill.rglob('*')):
   if p.is_file() and '__pycache__' not in p.parts:z.write(p,'nsfc-health-synthesis/'+p.relative_to(skill).as_posix())
  z.write(ROOT/'LICENSE','nsfc-health-synthesis/LICENSE')
  z.writestr('先读我.txt','打开data/nsfc-health-report.html阅读报告，CSV与JSON为脱敏汇编。\n实际国自然条目覆盖2010—2025年；第三方汇编未逐项官方核验，非全国全量。\n公开包不含原工作簿、申请书、姓名、批准号、经费或本地路径。\nnsfc-health-synthesis可作为独立Skill目录使用；脚本需本地清单、openpyxl与xlrd。\n在线交互：https://naturedu.github.io/socialmedicine/nsfc-health.html\n')
 print('Packaged NSFC redacted analysis:',len(rows),'records')

if __name__=='__main__':main()
