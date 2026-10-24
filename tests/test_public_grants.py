"""Privacy and filtering invariants using synthetic identifiers only."""
import importlib.util,json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from build_nssfc import public_record
from build_nsfc_health import health_labels

class PublicGrantsTests(unittest.TestCase):
 def test_whitelist_and_idempotence(self):
  raw=dict(id='SECRET-GRANT',principal='PRIVATE-PERSON',project_code='SECRET-CODE',serial=99,table_row=99,title='医保支付研究',date='2024',organization='示例大学',source='https://example.org/list.pdf',unexpected='PRIVATE-EXTRA')
  clean=public_record(raw)
  for k in ['principal','project_code','serial','table_row','unexpected']:self.assertNotIn(k,clean)
  self.assertEqual(clean,public_record(clean));self.assertTrue(clean['id'].startswith('nssfc-public-'))
  self.assertNotIn('SECRET',json.dumps(clean));self.assertNotIn('PRIVATE',json.dumps(clean))
  changed={**raw,'principal':'ANOTHER-PERSON','project_code':'ANOTHER-CODE','id':'ANOTHER-ID'}
  self.assertEqual(clean['id'],public_record(changed)['id'])
 def test_title_boundaries(self):
  for t in ['机械系统故障传播与健康评价','基于多模态数据的高端装备剩余寿命预测','消费者采纳产品的心理机制','金融市场健康发展研究']:
   self.assertIsNone(health_labels(t),t)
  for t in ['医保支付方式改革','社区慢性病健康管理研究','城乡养老服务供给','糖尿病患者行为干预','心理健康平台治理']:
   self.assertIsNotNone(health_labels(t),t)
 def test_current_public_datasets(self):
  def read(f):return json.loads((ROOT/'data'/f).read_text(encoding='utf8'))
  for filename in ['nssf-projects.json','archive/nssf-unverified-2026-10-23.json','health-projects.json','nsfc-health-projects.json']:
   rows=read(filename)
   for r in rows:
    if filename=='health-projects.json' and r['funder']!='国社科':continue
    self.assertFalse({'principal','project_code','serial','table_row','name','pi','amount'}&r.keys(),filename)
    self.assertRegex(r['id'],r'^(nssfc|nsfc)-public-[a-f0-9]{24}$')
  rows=read('nsfc-health-projects.json');a=read('nsfc-health-analysis.json')
  self.assertEqual(len(rows),a['projects']);self.assertEqual(len(set(r['id'] for r in rows)),len(rows))
  self.assertEqual(a['inputRows'],a['uniqueCompilationRows']+a['duplicateRows']+a['conflictingRowsExcluded'])
  self.assertEqual(sum(x['healthRecords'] or 0 for x in a['annual']),len(rows))
  self.assertTrue(all(x['healthRecords'] is None for x in a['annual'] if x['year']<2010))
  for x in a['changes']:
   self.assertAlmostEqual(x['beforePercent'],100*x['before']/x['beforeDenominator'],places=2)
   self.assertAlmostEqual(x['afterPercent'],100*x['after']/x['afterDenominator'],places=2)

if __name__=='__main__':unittest.main()
