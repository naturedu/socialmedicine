import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('topics', ROOT/'scripts/build_public_topics.py')
topics = importlib.util.module_from_spec(spec)
spec.loader.exec_module(topics)


class PublicTopicTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = topics.read(ROOT/'data/public-topic-records.json')
        cls.rows = cls.payload['records']
        cls.analysis = topics.read(ROOT/'data/public-topic-analysis.json')

    def test_unique_records_and_cns_scope(self):
        self.assertEqual(len({r['id'] for r in self.rows}), len(self.rows))
        papers = [r for r in self.rows if r['collection'] != 'gates']
        dois = [r['doi'] for r in papers if r['doi']]
        self.assertEqual(len(dois), len(set(dois)))
        counts = self.analysis['collections']
        self.assertEqual(counts['gates']['total'], 1455)
        self.assertEqual(self.analysis['cnsMain']['total'], 55)
        self.assertEqual(self.analysis['cnsRelated']['total'], 10)
        self.assertEqual(counts['management']['analyzed'], 29)
        self.assertEqual(counts['management']['excludedBookReviews'], 7)

    def test_denominators_and_representative_sources(self):
        by_id = {r['id']: r for r in self.rows}
        groups = list(self.analysis['collections'].values()) + list(self.analysis['gatesPortfolios'].values())
        for group in groups:
            self.assertEqual(sum(t['count'] for t in group['primaryTopics']), group['analyzed'])
            for theme in group['primaryTopics']:
                for rid in theme['exampleIds']:
                    self.assertEqual(by_id[rid]['primaryTopic'], theme['name'])
                    self.assertTrue(by_id[rid]['analysisEligible'])
        self.assertGreater(sum(x['total'] for x in self.analysis['gatesPortfolios'].values()), 1455)

    def test_public_field_allowlist(self):
        allowed = {'id','collection','portfolios','journal','authors','publicationType','analysisEligible','doi','sourceUrl',
            'sourceLabel','verification','title','titleZh','organization','date','country','amountUSD','officialTopics',
            'division','scopeNote','regionServed','year','keywords','journalGroup','citation','relevance',
            'primaryTopic','topics','topicEvidence'}
        for row in self.rows:
            self.assertFalse(set(row)-allowed, row['id'])
            self.assertRegex(row['sourceUrl'], r'^https?://')
        raw = json.dumps(self.payload, ensure_ascii=False)
        self.assertNotRegex(raw, r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}')
        for private in ['C:\\\\Users', 'local_file', 'wxid_', 'api_key', 'access_token', '个人申请书正文']:
            self.assertNotIn(private, raw)

    def test_word_boundaries_and_reproducibility(self):
        self.assertFalse(topics.matches('mental', 'experimental environmental'))
        self.assertFalse(topics.matches('ai', 'Shanghai'))
        self.assertTrue(topics.matches('mental health', 'Mental health policy'))
        rules = topics.read(ROOT/'data/public-topic-taxonomy.json')
        for row in self.rows:
            fresh = topics.classify(dict(row), rules)
            self.assertEqual(row['primaryTopic'], fresh['primaryTopic'])
            self.assertEqual(row['topicEvidence'], fresh['topicEvidence'])


if __name__ == '__main__':
    unittest.main()
