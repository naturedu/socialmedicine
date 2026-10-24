"""Import public metadata through explicit fields; rebuild descriptive topic counts.

First import accepts local source paths, which are never written into the catalogue.
Subsequent runs need only the checked-in public-topic-records.json and taxonomy.
"""
import argparse
import collections
import csv
import hashlib
import io
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DAY = '2026-10-24'
GATES_URL = 'https://www.gatesfoundation.org/about/committed-grants'


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def save(name, data):
    (ROOT / 'data' / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def csv_rows(path):
    return list(csv.DictReader(io.StringIO(Path(path).read_text(encoding='utf-8-sig').rstrip('\x00'))))


def clean(value):
    if isinstance(value, list):
        return [clean(x) for x in value]
    if not isinstance(value, str):
        return value
    return re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '[联系信息已省略]', value).strip()


def normalize_doi(value):
    return re.sub(r'^https?://(?:dx\.)?doi\.org/', '', str(value or '').strip(), flags=re.I).lower()


def source_fingerprint(path, label):
    return {'label': label, 'sha256': hashlib.sha256(Path(path).read_bytes()).hexdigest()}


def ingest(args):
    records = {}
    sources = []

    def grant(row, portfolio):
        gid = row['id']
        if gid not in records:
            records[gid] = dict(id=gid, collection='gates', portfolios=[], journal='', authors=[],
                publicationType='资助承诺', analysisEligible=True, doi='', sourceUrl=GATES_URL,
                sourceLabel='Gates Foundation Committed Grants，2026-10-14 快照',
                verification='官方公开用途与承诺字段；不是拨款或成效；未逐项复核项目详情')
        rec = records[gid]
        for key in ['title', 'titleZh', 'organization', 'date', 'country', 'amountUSD', 'officialTopics', 'division', 'scopeNote', 'regionServed']:
            if row.get(key) not in (None, ''):
                rec[key] = clean(row[key])
        if portfolio not in rec['portfolios']:
            rec['portfolios'].append(portfolio)
        rec['year'] = int(rec['date'][:4])

    for x in read(args.legacy_grants):
        grant(dict(id=x['id'], title=x['title'], organization=x['organization'], date=x['date'],
            country=x['country'], amountUSD=int(float(x['amount'])), officialTopics=x['category'],
            division=x.get('division', ''), scopeNote=x.get('scope', '')), '全球社医卫管候选')
    sources.append(source_fingerprint(args.legacy_grants, '既有全球社医卫管候选索引（990条）'))
    for x in csv_rows(args.china_recipients):
        grant(dict(id=x['GRANT ID'], title=x['PURPOSE'], organization=x['GRANTEE'], date=x['DATE COMMITTED'],
            country=x['GRANTEE COUNTRY'], amountUSD=int(float(x['AMOUNT COMMITTED'])), officialTopics=x['TOPIC'],
            division=x['DIVISION'], regionServed=x['REGION SERVED']), '中国机构公开资助')
    sources.append(source_fingerprint(args.china_recipients, '中国机构公开资助快照（472条）'))
    for x in csv_rows(args.china_grants):
        grant(dict(id=x['award_id'], title=x['title'], titleZh=x['title_zh'], organization=x['institution'],
            date=x['commitment_date'], country=x['grantee_country'], amountUSD=int(float(x['amount'])),
            officialTopics=x['subject'], division=x['division'], scopeNote=x['china_related'], regionServed=x['geography']),
            '中国相关健康政策管理（2016—2025）')
    sources.append(source_fingerprint(args.china_grants, '中国相关健康政策管理已整理子集（192条）'))

    # Article-level deduplication: do not count full-text chunks as separate papers.
    seen = {}

    def paper(x, collection, provenance):
        doi = normalize_doi(x.get('doi'))
        title = x.get('title', '').strip()
        key = doi or re.sub(r'\W', '', title).casefold()
        if not title or key in seen:
            return
        journal = x.get('journal', '')
        if journal.lower() == 'nature health':
            journal = 'Nature Health'
        author = x.get('authors', [])
        if isinstance(author, str):
            author = [a.strip() for a in author.split(';') if a.strip()]
        book_review = collection == 'management' and bool(re.search(r'[—－-]评|——评', title))
        rid = ('MW-' if collection == 'management' else 'CNS-') + hashlib.sha256(key.encode()).hexdigest()[:12]
        rec = dict(id=rid, collection=collection, title=clean(title), titleZh=clean(x.get('titleZh', '')),
            journal=journal, authors=clean(author), year=int(x.get('year', 0)), doi=doi,
            sourceUrl=clean(x.get('sourceUrl') or x.get('url') or ('https://doi.org/' + doi)),
            sourceLabel=provenance, keywords=clean(x.get('keywords', [])),
            verification=clean(x.get('verification') or '继承既有公开题录；本轮未重新逐篇核验全文和正式栏目'),
            publicationType='书评线索（按题名识别）' if book_review else x.get('type', '题录；正式栏目待核'),
            analysisEligible=not book_review, journalGroup='主刊' if journal in ['Cell', 'Nature', 'Science'] else '相关期刊',
            citation=clean(x.get('citation') or x.get('cite') or ''), portfolios=[])
        if collection == 'management':
            rec['journalGroup'] = '管理世界'
            rec['relevance'] = '社医卫管直接相关' if re.search(r'医疗|药品|医保|社会保险|社保|养老保险|健康', title) else '管理与经济学参照'
        if journal == 'Cell':
            rec['relevance'] = '方法与转化研究参照；不作为卫生管理政策效果证据'
        seen[key] = rid
        records[rid] = rec

    for x in read(ROOT / 'data/library.json'):
        if x['journal'] in ['Nature', 'Science', 'Cell', 'Nature Medicine', 'npj Digital Medicine']:
            paper(x, 'cns', x.get('provenance', '既有专题文献索引'))
    for x in read(ROOT / 'data/studio-library.json'):
        j = x.get('journal', '').lower()
        if j.startswith(('nature', 'science', 'cell', 'npj ')):
            paper(x, 'cns', '既有工作台公开题录；按 DOI / 题名去重正文分块')
    archive = read(ROOT / 'data/archive/cssci-100.json')
    if isinstance(archive, dict):
        archive = archive['papers']
    for x in archive:
        if x.get('journal') == '管理世界':
            paper(x, 'management', '既有 NSSD 公开题录归档；2026年6—8期所收录样本')
    for x in read(args.cell_metadata):
        x['type'] = 'Article（出版者页面）'
        x['verification'] = '2026-10-24：Crossref 题名、期刊、年份、DOI与出版者页面交叉核对；未完成全文审读'
        paper(x, 'cns', 'Cell / Elsevier 出版者页面与 Crossref 注册元数据')
    payload = {'updated': DAY, 'sourceSnapshot': '2026-10-14', 'sourceFingerprints': sources,
        'privacy': '仅公开学术及机构字段；未导入私人联系人、邮箱、电话、本机路径、聊天、稿件、申请书。',
        'records': list(records.values())}
    save('public-topic-records.json', payload)
    return payload


def matches(term, text):
    if re.search('[\u4e00-\u9fff]', term):
        return term in text
    return bool(re.search(r'(?<![a-z])' + re.escape(term.lower()) + r'(?![a-z])', text.lower()))


def classify(row, taxonomy):
    rules = taxonomy['management' if row['collection'] == 'management' else 'health']
    keywords = row.get('keywords', [])
    if isinstance(keywords, list):
        keywords = ' '.join(keywords)
    title = row['title'] + ' ' + row.get('titleZh', '')
    extra = keywords + ' ' + row.get('officialTopics', '')
    ranked = []
    for rank, rule in enumerate(rules):
        hits = [t for t in rule['terms'] if matches(t, title + ' ' + extra)]
        score = sum(3 * matches(t, title) + matches(t, extra) for t in rule['terms'])
        if hits:
            ranked.append((score, -rank, rule['name'], hits))
    ranked.sort(reverse=True)
    row['primaryTopic'] = ranked[0][2] if ranked else '其他／待人工复核'
    row['topics'] = [r[2] for r in ranked] or ['其他／待人工复核']
    row['topicEvidence'] = {r[2]: r[3] for r in ranked}
    return row


def summarize(rows):
    eligible = [r for r in rows if r['analysisEligible']]
    count = len(eligible)
    primary = collections.Counter(r['primaryTopic'] for r in eligible)
    topics = []
    for name, n in primary.most_common():
        subset = [r for r in eligible if r['primaryTopic'] == name]
        topics.append({'name': name, 'count': n, 'percent': round(n / count * 100, 1) if count else 0,
            'exampleIds': [r['id'] for r in sorted(subset, key=lambda r: r['year'], reverse=True)[:3]]})
    return {'total': len(rows), 'analyzed': count, 'excludedBookReviews': len(rows)-count,
        'primaryTopics': topics, 'yearCounts': dict(sorted(collections.Counter(str(r['year']) for r in eligible).items())),
        'journals': dict(collections.Counter(r.get('journal') for r in rows if r.get('journal'))),
        'amountUSD': sum(r.get('amountUSD', 0) for r in rows) if rows and rows[0]['collection'] == 'gates' else None}


def build(args):
    payload = ingest(args) if args.legacy_grants else read(ROOT / 'data/public-topic-records.json')
    taxonomy = read(ROOT / 'data/public-topic-taxonomy.json')
    payload['records'] = [classify(r, taxonomy) for r in payload['records']]
    payload['records'].sort(key=lambda r: (r['collection'], -r['year'], r['id']))
    save('public-topic-records.json', payload)
    analysis = {'updated': DAY, 'method': '公开题名／项目用途与关键词的规则编码；标题命中权重3、关键词权重1；同分按公开词表顺序。一个互斥主主题用于构成统计，多标签仅辅助检索。',
        'limits': ['统计分母为本站收录样本，不代表全球资助全库或期刊全部发文。',
            'CNS主刊与相关期刊分开；Cell条目为方法参照，不补造卫生管理研究。',
            '管理世界书评线索保留检索，但不计入默认主题构成；正式栏目仍须回访原刊。',
            '2026年是不完整年度，早期年份也有选择性覆盖；不能由频次变化推断学科趋势。',
            '资助金额为美元承诺额；受资助机构所在地不等于服务地，不代表拨款或成效。'],
        'collections': {}, 'gatesPortfolios': {}}
    for key in ['gates', 'cns', 'management']:
        rows = [r for r in payload['records'] if r['collection'] == key]
        analysis['collections'][key] = summarize(rows)
        if key == 'cns':
            analysis['cnsMain'] = summarize([r for r in rows if r['journalGroup'] == '主刊'])
            analysis['cnsRelated'] = summarize([r for r in rows if r['journalGroup'] == '相关期刊'])
    for name in sorted({p for r in payload['records'] for p in r.get('portfolios', [])}):
        analysis['gatesPortfolios'][name] = summarize([r for r in payload['records'] if name in r.get('portfolios', [])])
    save('public-topic-analysis.json', analysis)
    print(json.dumps({k: {f:v[f] for f in ['total','analyzed','excludedBookReviews']} for k,v in analysis['collections'].items()}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['legacy-grants', 'china-grants', 'china-recipients', 'cell-metadata']:
        parser.add_argument('--' + name, type=Path)
    args = parser.parse_args()
    if args.legacy_grants and not all([args.china_grants, args.china_recipients, args.cell_metadata]):
        parser.error('A first import requires all four source paths.')
    build(args)
