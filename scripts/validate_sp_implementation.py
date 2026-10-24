"""Run the two self-contained R simulations and record their exact content hash."""
from pathlib import Path
import argparse,subprocess,json,hashlib,shutil,datetime
R=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--rscript',default=shutil.which('Rscript'));args=p.parse_args()
if not args.rscript:raise SystemExit('Supply --rscript with an installed Rscript executable')
version=subprocess.run([args.rscript,'--version'],capture_output=True,text=True,check=True)
rows=[]
for stem in ['standardized_patient','implementation_science']:
 for ext in ['R','do']:
  rel=f'skills/scripts/{stem}_demo.{ext}';path=R/rel
  row=dict(script=rel,sha256=hashlib.sha256(path.read_text(encoding='utf-8').encode('utf-8')).hexdigest(),hashNormalization='UTF-8 with LF line endings')
  if ext=='R':
   run=subprocess.run([args.rscript,'--vanilla',str(path)],capture_output=True,text=True,check=True)
   assert 'PASS:' in run.stdout
   row.update(status='passed',runtime=(version.stdout+version.stderr).strip(),output=run.stdout.strip(),scope='Teaching simulation and internal assertions only; no real data validation')
  else:row.update(status='not_run',scope='Stata teaching template; no Stata execution in this release')
  rows.append(row)
report=dict(checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(),scripts=rows)
(R/'data/sp-implementation-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PASS: two R simulations; two Stata templates marked not_run')
