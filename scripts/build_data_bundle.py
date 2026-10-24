"""Regenerate static browser data from public JSON catalogues."""
from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
def data(keys):return {k:json.loads((r/'data'/f'{k}.json').read_text(encoding='utf-8')) for k in keys}
def js(x):return json.dumps(x,ensure_ascii=False).replace('</','<\\/')
keys=['library','journals','institutions','figures','methods','code-library','tools','insurance-timeline','sources','journal-rules','scope-audit']
(r/'assets/catalog.js').write_text('window.SM = '+js(data(keys))+';\n',encoding='utf-8')
print('Updated browser catalogues.')
