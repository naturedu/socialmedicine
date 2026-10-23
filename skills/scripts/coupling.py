"""Binary-reference bibliographic coupling; standard library only.
Input: JSON list with id and reference_dois. Missing references use null.
Output: JSON coverage and pairwise shared counts/cosine. No network calls.
"""
import argparse,json,math,re
from pathlib import Path

def normalize(doi):
    x=re.sub(r'^https?://(?:dx\.)?doi\.org/','',str(doi).strip(),flags=re.I)
    return re.sub(r'^doi:\s*','',x,flags=re.I).casefold()

def compute(rows):
    ids=[str(x['id']) for x in rows]
    if len(ids)!=len(set(ids)):raise ValueError('duplicate document id')
    refs=[None if r.get('reference_dois') is None else {normalize(x) for x in r['reference_dois'] if normalize(x)} for r in rows]
    edges=[]
    for i,a in enumerate(refs):
        for j in range(i+1,len(refs)):
            b=refs[j]
            if a is None or b is None:continue
            n=len(a&b)
            edges.append(dict(source=ids[i],target=ids[j],shared=n,cosine=n/math.sqrt(len(a)*len(b)) if a and b else None))
    return dict(documents=len(rows),reference_records_available=sum(x is not None for x in refs),positive_reference_sets=sum(bool(x) for x in refs),edges=edges)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('input');p.add_argument('output');a=p.parse_args()
    data=compute(json.loads(Path(a.input).read_text(encoding='utf-8-sig')))
    Path(a.output).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
