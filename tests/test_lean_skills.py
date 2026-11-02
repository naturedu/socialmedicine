import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT/path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


scanner = load('release_scanner', 'skills/privacy-safe-skill-distillation/scripts/scan_release.py')
audit = load('skill_inventory', 'skills/codex-performance-audit/scripts/inventory.py')


class ReleaseSafety(unittest.TestCase):
    def test_detects_secrets_without_echoing_them(self):
        with tempfile.TemporaryDirectory() as d:
            secret = 'gh' + 'p_' + 'a'*36
            personal_path = 'C:' + '/' + 'Users/' + 'example-person/private.txt'
            Path(d, 'draft.md').write_text(secret+'\n'+personal_path, encoding='utf-8')
            report = scanner.scan(d, ['draft.md'])
            self.assertEqual({'credential-token', 'private-user-path'}, {x['rule'] for x in report['findings']})
            self.assertNotIn(secret, json.dumps(report))
            self.assertNotIn(personal_path, json.dumps(report))

    def test_traversal_and_binary_fail_closed(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d, 'example.md').write_bytes(b'\x00\x01')
            report = scanner.scan(d, ['../outside.md', 'example.md'])
            self.assertEqual(2, len(report['findings']))
            self.assertEqual(0, report['checked_files'])

    def test_clean_files_and_inventory_counts(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d, 'example-skill')
            folder.mkdir()
            raw = '---\nname: example-skill\ndescription: Test metadata only\n---\n# Example\n'
            (folder/'SKILL.md').write_text(raw, encoding='utf-8')
            report = scanner.scan(d, ['example-skill/SKILL.md'])
            self.assertEqual([], report['findings'])
            result = audit.inventory([d, d])
            self.assertEqual(1, result['skill_count'])
            self.assertNotIn(d, json.dumps(result))

    def test_symlink_is_not_followed(self):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            (root/'source.md').write_text('safe', encoding='utf-8')
            try:
                (root/'link.md').symlink_to(root/'source.md')
            except OSError:
                self.skipTest('Symlink creation not available')
            result = scanner.scan(root, ['link.md'])
            self.assertEqual('linked-file', result['findings'][0]['rule'])


if __name__ == '__main__':
    unittest.main()
