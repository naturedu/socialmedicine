"""Package the public, original microsimulation skill without local source data."""
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
FILES = {
    'SKILL.md': 'skills/microsimulation-studio.md',
    'references/microsimulation-methods.md': 'skills/references/microsimulation-methods.md',
    'references/microsimulation-sources.md': 'skills/references/microsimulation-sources.md',
    'scripts/microsimulation_demo.R': 'skills/scripts/microsimulation_demo.R',
    'scripts/validate_microsimulation.R': 'skills/scripts/validate_microsimulation.R',
    'scripts/microsimulation_demo.do': 'skills/scripts/microsimulation_demo.do',
    'LICENSE': 'LICENSE',
}

def build():
    destination = ROOT / 'data/microsimulation-skill.zip'
    with zipfile.ZipFile(destination, 'w', zipfile.ZIP_DEFLATED) as z:
        for target, source in FILES.items():
            data = (ROOT / source).read_text(encoding='utf-8')
            if target.startswith('references/'):
                data = data.replace('../microsimulation-studio.md', '../SKILL.md')
            info = zipfile.ZipInfo('microsimulation/' + target, (2026, 10, 24, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            z.writestr(info, data.encode('utf-8'))
    with zipfile.ZipFile(destination) as z:
        assert z.testzip() is None
        assert len(z.namelist()) == len(FILES)
    print('PACKAGED original microsimulation skill:', len(FILES), 'files')

if __name__ == '__main__':
    build()
