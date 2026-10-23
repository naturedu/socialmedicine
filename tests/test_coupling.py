from pathlib import Path
import importlib.util,unittest
p=Path(__file__).resolve().parents[1]/'skills/scripts/coupling.py'
spec=importlib.util.spec_from_file_location('coupling',p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class CouplingTest(unittest.TestCase):
 def test_known_overlap_and_missing(self):
  x=m.compute([{'id':'a','reference_dois':['10.1/A','https://doi.org/10.1/a','10.1/b']},{'id':'b','reference_dois':['doi:10.1/A','10.1/c']},{'id':'missing','reference_dois':None},{'id':'empty','reference_dois':[]}])
  self.assertEqual(x['reference_records_available'],3);self.assertEqual(x['positive_reference_sets'],2)
  edge=x['edges'][0];self.assertEqual(edge['shared'],1);self.assertAlmostEqual(edge['cosine'],0.5)
  self.assertTrue(all(e['source']!='missing' and e['target']!='missing' for e in x['edges']))
  self.assertIsNone(x['edges'][1]['cosine'])
 def test_duplicate_ids(self):
  with self.assertRaises(ValueError):m.compute([{'id':1},{'id':'1'}])
if __name__=='__main__':unittest.main()
