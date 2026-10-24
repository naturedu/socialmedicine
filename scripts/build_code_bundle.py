"""Bundle current full skills and every indexed code snippet with execution notes."""
from pathlib import Path
import json,re,zipfile
R=Path(__file__).resolve().parents[1]
def build():
    codes=json.loads((R/'data/code-library.json').read_text(encoding='utf-8'))
    destination=R/'data/method-code-library.zip'
    with zipfile.ZipFile(destination,'w',zipfile.ZIP_DEFLATED) as z:
        z.writestr('README.txt',f'''普贤社会医学方法与数据库代码包

当前索引{len(codes)}段教学代码，完整Skill及支持资源在skills/。
snippets/保存每段代码；data/code-library.json和CSV保留原始来源行号、上下文和执行状态。
原有代码与新增数据库接口均保留。混合或不完整片段必须结合完整Skill审读，不能批量直接执行。
R/Stata示例未逐项运行，不表示已对真实数据完成验证；变量、权重、版本和识别假设需先核对。
不含受访者微观数据或私人聊天。网页：https://naturedu.github.io/socialmedicine/
''')
        for p in (R/'skills').rglob('*'):
            if p.is_file() and '__pycache__' not in p.parts and p.suffix!='.pyc':z.write(p,p.relative_to(R))
        for name in ['code-library.json','code-library.csv','standardized-patient-data-dictionary.csv','implementation-science-data-dictionary.csv','sp-implementation-sources.json','sp-implementation-validation.json']:z.write(R/'data'/name,'data/'+name)
        for i,c in enumerate(codes,1):
            ext={'r':'R','stata':'do','python':'py'}.get(c['language'].lower(),'txt')
            label=re.sub(r'[^A-Za-z0-9_-]','_',c['id'])
            z.writestr(f'snippets/{i:03d}-{label}.{ext}',c['code'])
    with zipfile.ZipFile(destination) as z:
        assert len([n for n in z.namelist() if n.startswith('snippets/')])==len(codes)
        assert 'skills/nhanes-database-skill.md' in z.namelist()
    print('BUNDLED',len(codes),'snippets and current skills')
if __name__=='__main__':build()
