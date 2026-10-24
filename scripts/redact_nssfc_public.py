"""Remove NSSFC grant identifiers and people from current public datasets in place.

Run the catalogue/index builders afterwards. No unredacted backups are published.
"""
import argparse
import csv
import json
from pathlib import Path
from build_nssfc import public_record, PUBLIC_REDACTION

ROOT=Path(__file__).resolve().parents[1]

def main(root=ROOT):
 def read(name):return json.loads((root/'data'/name).read_text(encoding='utf-8-sig'))
 def write(name,value):(root/'data'/name).write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 counts={}
 for name in ['nssf-projects.json','archive/nssf-unverified-2026-10-23.json','health-projects.json']:
  rows=read(name)
  rows=[public_record(r) if name!='health-projects.json' or r.get('funder')=='国社科' else r for r in rows]
  assert len({r['id'] for r in rows})==len(rows),'Public identity collision'
  write(name,rows);counts[name]=len(rows)
  if name.startswith('archive/'):continue
  target=root/'data'/name.replace('.json','.csv')
  # Preserve education-ministry fields, leaving them blank for NSSFC rows.
  fields=list(dict.fromkeys(k for r in rows for k in r))
  with target.open('w',encoding='utf-8-sig',newline='') as f:
   writer=csv.DictWriter(f,fields);writer.writeheader()
   writer.writerows({k:'；'.join(v) if isinstance(v,list) else v for k,v in r.items()} for r in rows)
 rules=read('nssfc-methodology.json');rules['publicRedaction']=PUBLIC_REDACTION;write('nssfc-methodology.json',rules)
 audit=read('nssfc-extraction-audit.json')
 for old,new in [('duplicateIds','duplicateCount'),('conflicts','conflictCount')]:
  if old in audit:audit[new]=len(audit.pop(old))
 write('nssfc-extraction-audit.json',audit)
 audit=read('project-extraction-audit.json')
 for row in audit:
  if row.get('provider')=='国社科':
   for key in ['firstSerial','lastSerial','missingSerials']:row.pop(key,None)
 write('project-extraction-audit.json',audit)
 print(json.dumps({'redacted':counts},ensure_ascii=False))

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--root',type=Path,default=ROOT)
 main(parser.parse_args().root)
