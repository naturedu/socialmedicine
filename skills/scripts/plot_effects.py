"""Plot supplied estimates and intervals; never fit a statistical model."""
import argparse, csv, hashlib, json, math
from pathlib import Path

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('csv',type=Path)
    p.add_argument('--out',required=True,type=Path,help='Output prefix without extension')
    p.add_argument('--scale',choices=['difference','ratio'],default='difference')
    p.add_argument('--label',default='Estimate (95% CI)')
    p.add_argument('--font',help='Installed font family for labels')
    a=p.parse_args()
    with a.csv.open(encoding='utf-8-sig',newline='') as f:
        r=csv.DictReader(f)
        if not {'label','estimate','lower','upper'}<=set(r.fieldnames or []):
            p.error('CSV requires label,estimate,lower,upper')
        rows=list(r)
    if not rows:p.error('CSV contains no estimates')
    for i,r in enumerate(rows,2):
        try:v=[float(r[k]) for k in ['lower','estimate','upper']]
        except (TypeError,ValueError):p.error(f'Invalid number at CSV line {i}')
        if not all(math.isfinite(x) for x in v) or not v[0]<=v[1]<=v[2]:
            p.error(f'Interval must be finite and contain estimate at line {i}')
        if a.scale=='ratio' and min(v)<=0:p.error(f'Ratio scale requires positive values at line {i}')
        if not r['label'].strip():p.error(f'Missing label at line {i}')
        r.update(zip(['lower','estimate','upper'],v))
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.rcParams.update({'svg.fonttype':'none','pdf.fonttype':42,'font.size':10})
    if a.font:plt.rcParams['font.family']=a.font
    height=max(2.4,.38*len(rows)+1.3)
    fig,ax=plt.subplots(figsize=(7.0,height),layout='constrained')
    for i,r in enumerate(rows):
        ax.errorbar(r['estimate'],i,xerr=[[r['estimate']-r['lower']],[r['upper']-r['estimate']]],
                    fmt='o',color='#21665a',capsize=3,markersize=5,linewidth=1.2)
    ax.set_yticks(range(len(rows)),[r['label'] for r in rows]);ax.invert_yaxis()
    ax.axvline(1 if a.scale=='ratio' else 0,color='#777777',ls='--',lw=.8)
    if a.scale=='ratio':ax.set_xscale('log')
    ax.set_xlabel(a.label)
    ax.spines[['top','right','left']].set_visible(False)
    ax.tick_params(axis='y',length=0)
    a.out.parent.mkdir(parents=True,exist_ok=True)
    for ext in ['svg','pdf','png']:fig.savefig(Path(str(a.out)+'.'+ext),dpi=300)
    plt.close(fig)
    report={'input_sha256':hashlib.sha256(a.csv.read_bytes()).hexdigest(),'rows':len(rows),
            'scale':a.scale,'label':a.label,'model_fitted':False,'matplotlib':matplotlib.__version__,
            'validation':'Finite, ordered intervals checked; scientific meaning requires author review.'}
    Path(str(a.out)+'.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Exported {len(rows)} supplied estimates to SVG/PDF/PNG; no model fitted.')

if __name__=='__main__':main()
