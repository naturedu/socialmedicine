"""Conservative allowlist scanner; reports locations, never matched content."""
import argparse
import json
import re
from pathlib import Path, PurePosixPath

TEXT_EXTENSIONS = {'.md', '.txt', '.py', '.js', '.mjs', '.json', '.yaml', '.yml', '.toml', '.csv', '.tsv', '.rst', '.ps1'}
FORBIDDEN_PARTS = {'.git', '.env', 'auth.json', 'cookies', 'sessions', 'archived_sessions', 'backups', 'node_modules', '__pycache__'}
RULES = {
    'private-user-path': re.compile(r'(?:[A-Za-z]:[\\/]+Users[\\/]+[^\s"\'<>]+|/(?:Users|home)/[^\s/]+/)'),
    'email-address': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'),
    'mobile-number': re.compile(r'(?<!\d)1[3-9]\d{9}(?!\d)'),
    'credential-token': re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})\b'),
    'private-key': re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    'credential-assignment': re.compile(r'(?i)\b(?:api_key|access_token|refresh_token|password|client_secret)\s*[:=]\s*[\"\'][A-Za-z0-9_./+=-]{16,}[\"\']'),
    'signed-url-secret': re.compile(r'(?i)[?&](?:access_token|api_key|signature|x-amz-signature|x-signature)=[A-Za-z0-9%_+/=-]{12,}'),
}


def scan(root, entries):
    root = Path(root).resolve(strict=True)
    if not root.is_dir() or not isinstance(entries, list) or not entries or any(not isinstance(x, str) for x in entries):
        raise ValueError('Manifest must be a nonempty JSON array of relative file paths')
    findings = []
    checked = 0
    for index, entry in enumerate(entries):
        relative = PurePosixPath(entry.replace('\\', '/'))
        # Invalid names are represented by index so an absolute private path is not echoed.
        if relative.is_absolute() or '..' in relative.parts or ':' in entry or any(p.lower() in FORBIDDEN_PARTS for p in relative.parts):
            findings.append({'entry': index, 'rule': 'unsafe-manifest-path'})
            continue
        p = root.joinpath(*relative.parts)
        chain = [root.joinpath(*relative.parts[:n]) for n in range(1, len(relative.parts)+1)]
        if any(q.is_symlink() or (hasattr(q, 'is_junction') and q.is_junction()) for q in chain):
            findings.append({'entry': index, 'rule': 'linked-file'})
            continue
        try:
            p.resolve(strict=True).relative_to(root)
            if not p.is_file() or p.suffix.lower() not in TEXT_EXTENSIONS or p.stat().st_size > 2_000_000:
                raise ValueError()
            content = p.read_text(encoding='utf-8-sig')
            if '\x00' in content:
                raise ValueError()
        except (OSError, ValueError, UnicodeError):
            findings.append({'entry': index, 'rule': 'unreadable-or-unreviewed-file-type'})
            continue
        checked += 1
        for rule, pattern in RULES.items():
            for match in pattern.finditer(content):
                findings.append({'entry': index, 'line': content.count('\n', 0, match.start())+1, 'rule': rule})
        for rule, pattern in RULES.items():
            if pattern.search(entry):
                findings.append({'entry': index, 'rule': 'filename-'+rule})
    return {'checked_files': checked, 'manifest_entries': len(entries), 'findings': findings,
            'scope': 'Heuristic allowlist scan only; requires human review of meaning, provenance and git diff'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True)
    parser.add_argument('--manifest', required=True)
    args = parser.parse_args()
    try:
        entries = json.loads(Path(args.manifest).read_text(encoding='utf-8-sig'))
        report = scan(args.root, entries)
    except (OSError, ValueError, UnicodeError):
        parser.exit(2, 'Invalid root or manifest.\n')
    print(json.dumps(report, ensure_ascii=True, indent=2))
    return 1 if report['findings'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
