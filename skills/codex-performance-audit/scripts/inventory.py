"""Read SKILL.md metadata and emit aggregate sizes, never prompt text or paths."""
import argparse
import json
import os
import re
from pathlib import Path


def inventory(roots):
    entries = []
    seen = set()
    errors = 0
    for root in roots:
        root = Path(root).resolve(strict=True)
        if not root.is_dir():
            raise ValueError('Each root must be a directory')
        def failed(_error):
            nonlocal errors
            errors += 1
        for current, dirs, files in os.walk(root, followlinks=False, onerror=failed):
            dirs[:] = [d for d in dirs if d not in {'.git', '.system', 'node_modules', '__pycache__'} and not (Path(current)/d).is_symlink()]
            if 'SKILL.md' not in files:
                continue
            p = Path(current)/'SKILL.md'
            if p.is_symlink() or p.resolve() in seen:
                continue
            seen.add(p.resolve())
            try:
                raw = p.read_bytes()
                text = raw.decode('utf-8-sig').replace('\r\n', '\n')
                front = re.match(r'^---\s*\n(.*?)\n---(?:\n|$)', text, re.S)
                desc = re.search(r'^description:\s*(.*?)(?=\n[^\s]|\Z)', front.group(1), re.M | re.S) if front else None
                entries.append((len(raw), len(desc.group(1)) if desc else 0, len(text.splitlines())))
            except (OSError, UnicodeError):
                errors += 1
    return {
        'skill_count': len(entries),
        'entrypoint_bytes': sum(x[0] for x in entries),
        'description_source_characters': sum(x[1] for x in entries),
        'entrypoints_over_250_lines': sum(x[2] > 250 for x in entries),
        'unreadable_entries_or_directories': errors,
        'scope': 'SKILL.md only; excludes .system and symlinks; sizes are not live context tokens',
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', action='append', required=True, help='Explicit skills root; may repeat')
    args = parser.parse_args()
    try:
        result = inventory(args.root)
    except (OSError, ValueError):
        parser.exit(2, 'Cannot read one of the supplied roots.\n')
    print(json.dumps(result, ensure_ascii=True, indent=2))
    return 1 if result['unreadable_entries_or_directories'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
