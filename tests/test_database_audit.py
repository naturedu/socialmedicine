import tempfile,unittest,importlib.util,json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit_panel',R/'skills/scripts/audit_panel.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)

class DatabaseAuditTests(unittest.TestCase):
    def test_character_ids_duplicates_missing_and_no_identifier_output(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'test.csv';p.write_text('pid,year,x\n001,2018,a\n001,2020,b\n1,2018,c\n001,2020,d\n,2020,e\n002,,f\n',encoding='utf-8')
            a=m.audit(p,'pid','year')
        self.assertEqual(a['unique_people'],2)
        self.assertEqual(a['duplicate_keys'],1)
        self.assertEqual(a['missing_id'],1);self.assertEqual(a['missing_time'],1)
        self.assertEqual(a['people_by_unique_occasions'],{1:1,2:1})
        self.assertNotIn('001',json.dumps(a));self.assertFalse(a['complete_unique_keys'])
    def test_catalogue_routes_and_source_keys(self):
        cards=json.loads((R/'data/database-skills.json').read_text(encoding='utf-8'))
        refs=json.loads((R/'data/database-sources.json').read_text(encoding='utf-8'))
        self.assertEqual(len(cards),20)
        self.assertEqual(len({d['id'] for d in cards}),len(cards))
        keys={s['id'] for s in refs}
        for c in cards:
            self.assertTrue(set(c['source_ids'])<=keys)
            self.assertTrue((R/'skills'/(c['guide']+'.md')).exists())
            self.assertTrue((R/'guides'/(c['guide']+'.html')).exists())
            self.assertGreaterEqual(len(c['workflow']),4)

if __name__=='__main__':unittest.main()
