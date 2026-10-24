"""Grant summaries must not expose detail datasets or bundles."""
import importlib.util,json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class SummaryOnlyTests(unittest.TestCase):
 def test_no_detail_endpoints(self):
  for pattern in ['data/*projects.json','data/*projects.csv','data/archive/*nssf*','downloads/nsfc*','downloads/nssfc*','assets/grants.js']:
   self.assertEqual(list(ROOT.glob(pattern)),[],pattern)
 def test_summary_pages_do_not_ship_data_or_download_controls(self):
  for name in ['nssfc-projects.html','nsfc-health.html','grants.html','prediction-models.html']:
   s=(ROOT/name).read_text(encoding='utf-8')
   for forbidden in [' download','fetch(','.csv"','.zip"','project_code','principal','baidunetdisk','wxid_']:
    self.assertNotIn(forbidden,s,name)
   self.assertIn('<main',s)
 def test_index_contains_only_summary_routes(self):
  data=json.loads((ROOT/'data/material-index.json').read_text(encoding='utf-8'))
  self.assertFalse(any(r['collection'] in ['nsfc-health-projects','nssf-projects','moe-projects'] for r in data['records']))
  rows=[r for r in data['records'] if r['collection']=='summary-pages']
  self.assertEqual(len(rows),4)
  for r in rows:self.assertEqual(set(r['details']),{'title','summary','url'})
 def test_package_catalogue_excludes_grants(self):
  spec=importlib.util.spec_from_file_location('bundle',ROOT/'scripts/build_socialmedicine_bundle.py')
  mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
  self.assertFalse(any('project' in key or 'nsfc' in key or 'nssfc' in key for key in mod.CATALOGUES))
if __name__=='__main__':unittest.main()
