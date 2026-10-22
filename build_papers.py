# -*- coding: utf-8 -*-
"""
build_papers.py —— 生成「CSSCI 论文语料库」（中英对照版）

数据来源：国家哲学社会科学文献中心（ncpssd.org）公开题录（含摘要）
抓取脚本：_tmp/harvest_ncp.js（浏览器内调用 /searchHandler/search）

选取规则（用户确认）：
  1. 三刊最新一期「全收」；
  2. 不足 100 篇则按期往回补；
  3. 最后一期按刊轮转取，保证三刊均衡。

输出：
  papers-data.js     给 pages 用（window.PAPERS），可直接 file:// 打开
  data/papers.json   机器可读
  data/papers.md     纯文本语料（中英对照，便于直接投喂润色流程）
"""
import json, re, os, io, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RAW_DEFAULT = os.path.normpath(os.path.join(HERE, '..', '_tmp', 'ncp_raw.json'))
TARGET = 100

JOURNALS = ['中国社会科学', '管理世界', '社会科学']
JOURNAL_EN = {
    '中国社会科学': 'Social Sciences in China',
    '管理世界': 'Management World',
    '社会科学': 'Journal of Social Sciences',
}

CJK = re.compile(r'[\u4e00-\u9fff]')
ADDR_TAIL = re.compile(r'[，,]\s*[\u4e00-\u9fff]{2,8}\s*\d{6}\s*$')
# 非论文条目（公告、启事、目录、更正等）不入语料库
NON_PAPER = re.compile(r'公告|启事|声明|征稿|稿约|征订|目录|更正|致谢|编后记|卷首语|编者按$|稿酬|启事')


def load_raw(path):
    with io.open(path, encoding='utf-8') as f:
        return json.load(f)


def split_authors(creator):
    """'吴新叶[1,2];汪子策[1]' -> [('吴新叶', ['1','2']), ...]"""
    out = []
    for part in (creator or '').split(';'):
        part = part.strip()
        if not part:
            continue
        m = re.match(r'^(.*?)\[([\d,\s]+)\]$', part)
        if m:
            name = m.group(1).strip()
            idx = [x.strip() for x in m.group(2).split(',') if x.strip()]
        else:
            name, idx = part, []
        out.append((name, idx))
    return out


def split_affils(institutions):
    """'[1]同济大学政治与国际关系学院;[2]同济大学...' -> {'1': '...', '2': '...'}"""
    d = {}
    if not institutions:
        return d
    for part in institutions.split(';'):
        part = part.strip()
        m = re.match(r'^\[([\d,\s]+)\](.*)$', part)
        if not m:
            if part:
                d.setdefault('1', part)
            continue
        val = ADDR_TAIL.sub('', m.group(2).strip())
        for k in m.group(1).split(','):
            d[k.strip()] = val
    return d


def en_title(row):
    for t in (row.get('title_auto') or []):
        if isinstance(t, str) and len(t) > 6 and not CJK.search(t):
            return t.strip()
    t = (row.get('title_en') or '').strip()
    if t and not CJK.search(t):
        return t
    return ''


def en_keywords(row):
    raw = (row.get('keyword_en') or '').strip()
    if not raw:
        return []
    parts = re.split(r'[;；]', raw)
    return [p.strip() for p in parts if p.strip()]


def is_real_abstract(text, title):
    t = (text or '').strip()
    if len(t) < 80:
        return False
    if t == title:
        return False
    return True


def build_record(row):
    jn = row['cbw_name']
    year, num = row['years'], row['num']
    title = (row.get('title') or '').strip()
    authors, affils = [], []
    amap = split_affils(row.get('institutions'))
    for name, idx in split_authors(row.get('creator')):
        if name not in authors:
            authors.append(name)
        for k in idx:
            a = amap.get(k)
            if a and a not in affils:
                affils.append(a)
    if not affils and amap:
        affils = list(dict.fromkeys(amap.values()))

    kw_raw = (row.get('subject') or '').strip()
    keywords = [k.strip() for k in re.split(r'[;；]', kw_raw) if k.strip() and k.strip() != '无']

    abs_zh = (row.get('remark') or '').strip()
    if not is_real_abstract(abs_zh, title):
        abs_zh = ''
    abs_en = (row.get('remark_en') or '').strip()
    if len(abs_en) < 120 or CJK.search(abs_en[:80]):
        abs_en = ''

    bp, ep = (row.get('beginpage') or '').strip(), (row.get('endpage') or '').strip()
    pages = bp if (not ep or ep == bp) else '%s-%s' % (bp, ep)

    url = ''
    if row.get('encryptedUrl'):
        url = 'https://www.ncpssd.org/Literature/secure/articleinfo?params=' + row['encryptedUrl']

    cite_authors = ', '.join(authors) if authors else '佚名'
    cite = '%s. %s[J]. %s, %s(%s): %s.' % (
        cite_authors, title, jn, year, num, pages or '')

    return {
        'id': row.get('id') or '',
        'journal': jn,
        'journalEn': JOURNAL_EN.get(jn, ''),
        'year': year,
        'issue': num,
        'authors': authors,
        'affils': affils,
        'title': title,
        'titleEn': en_title(row),
        'keywords': keywords,
        'keywordsEn': en_keywords(row),
        'abstract': abs_zh,
        'abstractEn': abs_en,
        'pages': pages,
        'doi': (row.get('doi') or '').strip(),
        'url': url,
        'cite': cite,
        'lenZh': len(abs_zh),
        'lenEn': len(abs_en),
    }


def issue_key(rec):
    return (int(rec['year']), int(rec['issue']))


def select(by_journal):
    """最新一期全收 → 逐年往回补 → 最后一期按刊轮转。"""
    # 每刊按期分组
    issues = {}
    for jn, rows in by_journal.items():
        groups = {}
        for r in rows:
            rec = build_record(r)
            if not rec['title']:
                continue
            # 剔除公告、启事、目录等非论文条目
            if NON_PAPER.search(rec['title']):
                continue
            if not rec['abstract'] and rec['pages'] and '-' not in rec['pages']:
                continue
            groups.setdefault((rec['year'], rec['issue']), []).append(rec)
        for k in groups:
            groups[k].sort(key=lambda x: (int(re.split(r'[^\d]', x['pages'] or '0')[0] or 0), x['title']))
        issues[jn] = [groups[k] for k in sorted(groups, key=lambda s: (int(s[0]), int(s[1])), reverse=True)]

    picked, meta = [], {}
    # 阶段一：三刊最新一期「全收」
    for jn in JOURNALS:
        if not issues.get(jn):
            continue
        lst = issues[jn][0]
        picked.extend(lst)
        meta[jn] = {'latestIssue': '%s年第%s期' % (lst[0]['year'], lst[0]['issue']), 'full': 1}

    # 阶段二：按「同期」整轮回溯 —— 同 depth 的三刊该期全部纳入，
    #        若整轮装不下，则转为该轮内按刊轮转补齐（保证三刊均衡）
    depth = 1
    while len(picked) < TARGET and depth < 12:
        block = []
        present = []
        for jn in JOURNALS:
            lst_all = issues.get(jn) or []
            if depth < len(lst_all):
                block.extend(lst_all[depth])
                present.append(jn)
        if not block:
            break
        if len(picked) + len(block) <= TARGET:
            picked.extend(block)
            for jn in present:
                meta[jn]['full'] = meta[jn].get('full', 1) + 1
                meta[jn]['lastFull'] = '%s年第%s期' % (issues[jn][depth][0]['year'], issues[jn][depth][0]['issue'])
        else:
            # 轮转：第 1 篇取各刊第 1 篇，第 2 篇取各刊第 2 篇……
            idx, guard = 0, 0
            while len(picked) < TARGET and guard < 500:
                guard += 1
                for jn in present:
                    lst = issues[jn][depth]
                    if idx < len(lst) and len(picked) < TARGET:
                        picked.append(lst[idx])
                        meta[jn]['partial'] = '%s年第%s期' % (lst[idx]['year'], lst[idx]['issue'])
                idx += 1
                if idx >= max(len(issues[jn][depth]) for jn in present):
                    break
        depth += 1

    # 去重 + 排序
    seen, uniq = set(), []
    for r in picked:
        if r['id'] in seen:
            continue
        seen.add(r['id'])
        uniq.append(r)
    uniq.sort(key=lambda r: (JOURNALS.index(r['journal']), -int(r['year']), -int(r['issue']), r['pages']))
    return uniq[:TARGET], meta


def main():
    raw_path = sys.argv[1] if len(sys.argv) > 1 else RAW_DEFAULT
    by_journal = load_raw(raw_path)
    papers, meta = select(by_journal)
    print('选中 %d 篇' % len(papers))
    for jn in JOURNALS:
        sub = [p for p in papers if p['journal'] == jn]
        if not sub:
            continue
        iss = sorted({(p['year'], p['issue']) for p in sub}, reverse=True)
        print('  %-6s %3d 篇 | 期次 %s' % (jn, len(sub), ' / '.join('%s年%s期' % i for i in iss)))

    zh_no_abs = [p for p in papers if not p['abstract']]
    en_title = [p for p in papers if p['titleEn']]
    print('摘要覆盖 %d/%d ；英文题名 %d/%d ；英文摘要 %d' % (
        len(papers) - len(zh_no_abs), len(papers), len(en_title), len(papers),
        len([p for p in papers if p['abstractEn']])))

    # 1) papers-data.js
    payload = json.dumps(papers, ensure_ascii=False, separators=(',', ':'))
    with io.open(os.path.join(HERE, 'papers-data.js'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* 自动生成，请勿手改。数据源：国家哲学社会科学文献中心公开题录。\n')
        f.write('   生成脚本：build_papers.py ｜ %d 篇 ｜ 三刊：%s */\n' % (len(papers), '、'.join(JOURNALS)))
        f.write('window.PAPERS = ' + payload + ';\n')

    # 2) data/papers.json
    ddir = os.path.join(HERE, 'data')
    os.makedirs(ddir, exist_ok=True)
    with io.open(os.path.join(ddir, 'papers.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump({'generated': '2026-10-22', 'source': 'ncpssd.org', 'journals': JOURNALS,
                   'count': len(papers), 'papers': papers}, f, ensure_ascii=False, indent=1)

    # 3) data/papers.md —— 中英对照纯文本语料
    with io.open(os.path.join(ddir, 'papers.md'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('# CSSCI 论文语料库（中英对照）\n\n')
        f.write('> %d 篇 ｜ 《中国社会科学》《管理世界》《社会科学》 ｜ 数据源：国家哲学社会科学文献中心公开题录\n\n' % len(papers))
        for i, p in enumerate(papers, 1):
            f.write('## %02d. %s\n\n' % (i, p['title']))
            if p['titleEn']:
                f.write('**EN**：%s\n\n' % p['titleEn'])
            f.write('- 刊名：%s（%s） %s年第%s期，第%s页\n' % (p['journal'], p['journalEn'], p['year'], p['issue'], p['pages']))
            f.write('- 作者：%s\n' % ('、'.join(p['authors']) or '—'))
            if p['affils']:
                f.write('- 单位：%s\n' % ('；'.join(p['affils'])))
            if p['keywords']:
                f.write('- 关键词：%s\n' % ('；'.join(p['keywords'])))
            if p['keywordsEn']:
                f.write('- Keywords：%s\n' % ('; '.join(p['keywordsEn'])))
            f.write('\n')
            if p['abstract']:
                f.write('**摘要**　%s\n\n' % p['abstract'])
            if p['abstractEn']:
                f.write('**Abstract**　%s\n\n' % p['abstractEn'])
            f.write('`%s`\n\n---\n\n' % p['cite'])
    print('已写出 papers-data.js / data/papers.json / data/papers.md')
    return meta


if __name__ == '__main__':
    main()
