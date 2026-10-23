"""CSV metadata/panel audit; never emits participant keys or values.

Usage: python audit_panel.py input.csv --id person_id --time year --out audit.json
Without --time, checks one-record-per-person structure instead of a panel.
"""
import argparse,csv,json
from collections import Counter
from pathlib import Path

def audit(path,id_col,time_col=None,encoding='utf-8-sig'):
    rows=0;missing_id=0;missing_time=0;seen=set();duplicates=0;people=set();occasions=Counter()
    with Path(path).open(encoding=encoding,newline='') as f:
        reader=csv.DictReader(f)
        columns=reader.fieldnames or []
        for col in [id_col]+([time_col] if time_col else []):
            if col not in columns:raise ValueError('Required column not found: '+col)
        for row in reader:
            rows+=1;pid=row[id_col].strip();time=row[time_col].strip() if time_col else None
            if not pid:missing_id+=1
            if time_col and not time:missing_time+=1
            # Missing keys do not count as valid panel duplicates or people.
            if not pid or (time_col and not time):continue
            key=(pid,time)
            if key in seen:duplicates+=1
            else:seen.add(key);occasions[pid]+=1
            people.add(pid)
    return dict(format='metadata-only audit',rows=rows,columns=columns,
                key_columns=[id_col]+([time_col] if time_col else []),
                missing_id=missing_id,missing_time=missing_time,duplicate_keys=duplicates,
                unique_people=len(people),unique_complete_keys=len(seen),
                people_by_unique_occasions=dict(sorted(Counter(occasions.values()).items())),
                complete_unique_keys=(missing_id==0 and missing_time==0 and duplicates==0),
                note='IDs read as strings; no participant values exported. Not a codebook, weighting, linkage validity or measurement audit.')

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('input');p.add_argument('--id',required=True);p.add_argument('--time');p.add_argument('--out',required=True);p.add_argument('--encoding',default='utf-8-sig');a=p.parse_args()
    source=Path(a.input).resolve();target=Path(a.out).resolve()
    if source==target:raise ValueError('Output must differ from input')
    if target.exists():raise FileExistsError('Output exists; choose a new audit output path')
    result=audit(source,a.id,a.time,a.encoding)
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Wrote metadata-only audit; complete_unique_keys='+str(result['complete_unique_keys']))

if __name__=='__main__':main()
