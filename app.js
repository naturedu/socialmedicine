'use strict';

/* ============ 通用 ============ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

document.getElementById('year').textContent = new Date().getFullYear();

/* ============ 0. 注册与登录（演示：本地模拟验证码与账号） ============ */
const AUTH_KEY = 'socialmedicine-account';
let __code = '';

function genCode() { return String(Math.floor(100000 + Math.random() * 900000)); }
function currentUser() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (_) { return null; } }
function saveUser(u) { localStorage.setItem(AUTH_KEY, JSON.stringify(u)); renderAccountStatus(); }

function renderAccountStatus() {
  const u = currentUser();
  const el = $('#accountStatus');
  if (u) {
    el.hidden = false;
    el.innerHTML = `已登录：<strong>${escapeHtml(u.name)}</strong>（${escapeHtml(u.email)}）${u.org ? ' · ' + escapeHtml(u.org) : ''}。此账号仅保存在本机浏览器，用于复用披露信息。`;
  } else {
    el.hidden = true;
  }
}

function sendCode(inputEl, hintEl) {
  __code = genCode();
  inputEl.value = '';
  hintEl.textContent = `演示版验证码已生成：${__code}（真实版需接入邮件服务）`;
}

$('#sendCode').addEventListener('click', () => sendCode($('#regCode'), $('#codeHint')));
$('#sendCodeLogin').addEventListener('click', () => sendCode($('#loginCode'), $('#codeHint')));

$$('#authTabs .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('#authTabs .tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const isReg = tab.dataset.auth === 'register';
    $('#registerForm').hidden = !isReg;
    $('#loginForm').hidden = isReg;
  });
});

$('#registerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if ($('#regCode').value !== __code) { alert('验证码不正确'); return; }
  saveUser({ name: $('#regName').value.trim(), email: $('#regEmail').value.trim(), org: $('#regOrg').value.trim() });
  alert('注册成功（演示版，数据保存在本机）');
});

$('#loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if ($('#loginCode').value !== __code) { alert('验证码不正确'); return; }
  const u = currentUser();
  if (!u || u.email !== $('#loginEmail').value.trim()) { alert('未找到该邮箱，请先注册'); return; }
  alert('登录成功（演示版）');
});

renderAccountStatus();

/* ============ 1. 披露声明生成器 ============ */
const sceneEn = {
  '构思与大纲': 'conceptualization and outlining',
  '初稿撰写': 'drafting',
  '改写与润色': 'rewriting and polishing',
  '翻译': 'translation',
  '代码与脚本': 'code and scripting',
  '多环节综合使用': 'multiple stages of the work',
};
const degreeEn = {
  '辅助参考': 'supportive (the author completed the primary work)',
  '部分参与': 'partial (the author produced the core content and review)',
  '主要参与': 'substantial (the AI produced most of the content)',
};

$('#discloseForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const tool = $('#toolName').value;
  const scene = $('#discloseScenes').value;
  const degree = $('#discloseDegree').value;
  const checked = $('#discloseFactChecked').checked;

  const zh = `本人在本稿件的写作过程中使用了 ${tool}，用于${scene}，AI 参与程度为「${degree}」。` +
    `本人已对 AI 生成或辅助产出的内容进行了人工核查与修订，并对稿件的观点、论证与结论负全部责任。` +
    (checked ? '稿中事实、引用与数据均已逐项人工核实。' : '');

  const en = `The author used ${tool} for ${sceneEn[scene]}. The AI's involvement was ${degreeEn[degree]}. ` +
    `All AI-assisted content was reviewed and revised by the author, who takes full responsibility for the views, arguments, and conclusions.` +
    (checked ? ' Facts, citations, and data were manually verified.' : '');

  window.__disclose = { zh, en };
  renderDisclosure();
});

function renderDisclosure() {
  const data = window.__disclose;
  if (!data) return;
  const activeTab = $('#discloseTabs .tab.active');
  const lang = activeTab ? activeTab.dataset.lang : 'zh';
  const out = $('#discloseOutput');
  out.innerHTML = `
    <div class="suggestion" style="border-left-color:var(--ok);">
      <span class="note">以下为草稿，请按目标期刊 / 平台 / 客户的具体要求调整后再使用。</span>
    </div>
    <p class="output-text">${escapeHtml(data[lang])}</p>
    <div class="btn-row" style="margin-top:14px;">
      <button type="button" class="btn btn-primary" id="copyDisclose">复制这段文字</button>
    </div>
  `;
  $('#copyDisclose').addEventListener('click', () => {
    copyText(data[lang]);
    $('#copyDisclose').textContent = '已复制 ✓';
  });
}

$$('#discloseTabs .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('#discloseTabs .tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    renderDisclosure();
  });
});

/* ============ 2. AI 检测（中 / English） ============ */
let wbLang = 'zh';

$$('#langTabs .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('#langTabs .tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    wbLang = tab.dataset.lang;
    $('#wbInputLabel').textContent = wbLang === 'zh' ? '原文（中文）' : 'Original text (English)';
    $('#wbInput').placeholder = wbLang === 'zh' ? '粘贴需要检测的文本（建议 300 字以上，结果更稳定）…' : 'Paste the text to analyze (300+ characters recommended)…';
    $('#wbOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「检测痕迹」。</p>';
  });
});

/* ---- 词表 ---- */
const zhPhrases = [
  '值得注意的是', '需要指出的是', '需要强调的是', '综上所述', '总而言之', '总的来说',
  '不难发现', '由此可见', '换句话说', '换言之', '一般来说', '众所周知', '首先，', '其次，',
  '再次，', '最后，', '此外，', '与此同时', '值得关注的是', '这意味着', '从这个意义上说',
  '进一步地', '更进一步', '基于上述',
];
const enPhrases = [
  'It is important to note', 'It is worth noting', 'Moreover', 'Furthermore', 'In addition',
  'In conclusion', 'Overall', 'Additionally', 'Notably', 'Undoubtedly', 'In summary',
  'It should be noted', 'As previously mentioned', 'Firstly', 'Secondly', 'Lastly',
  'delve into', 'tapestry', 'landscape', 'pivotal', 'crucial', 'robust', 'holistic',
  'seamless', 'leverage', 'utilize', 'facilitate', 'underscores', 'a testament to',
  "in today's fast-paced world", 'game-changer', 'cutting-edge',
];

function phraseMatches(text, list) {
  const lower = text.toLowerCase();
  const matched = [];
  let hits = 0;
  for (const p of list) {
    const m = lower.split(p.toLowerCase()).length - 1;
    if (m > 0) { hits += m; matched.push({ p, count: m }); }
  }
  return { hits, matched };
}

/* ---- 中文指标 ---- */
function zhMetrics(text) {
  const sentences = text.split(/[。！？!?；;\n]+/).map((s) => s.trim()).filter((s) => s.length > 1);
  const lens = sentences.map((s) => s.length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
  const cv = avg ? sd / avg : 0;

  const hanzi = text.replace(/[^\u4e00-\u9fff]/g, '');
  const uniqueRatio = hanzi.length ? new Set(hanzi).size / hanzi.length : 0;

  const per1k = (n) => Math.round((n / Math.max(text.length, 1)) * 1000);
  const pm = phraseMatches(text, zhPhrases);
  const dashes = (text.match(/——|—|–/g) || []).length;
  const colons = (text.match(/：|:/g) || []).length;

  const starters = sentences.map((s) => s.slice(0, 2));
  const starterCounts = {};
  starters.forEach((st) => { starterCounts[st] = (starterCounts[st] || 0) + 1; });
  const repeatedStarters = starters.filter((st) => starterCounts[st] > 1).length;
  const starterRep = starters.length ? repeatedStarters / starters.length : 0;

  return { total: text.length, sentences: sentences.length, avg, cv, uniqueRatio, pm, dashes, colons, starterRep, per1k };
}

/* ---- 英文指标 ---- */
function enMetrics(text) {
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 1);
  const lens = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
  const cv = avg ? sd / avg : 0;

  const words = text.split(/\s+/).filter(Boolean);
  const uniqueRatio = words.length ? new Set(words.map((w) => w.toLowerCase())).size / words.length : 0;

  const per1k = (n) => Math.round((n / Math.max(text.length, 1)) * 1000);
  const pm = phraseMatches(text, enPhrases);
  const dashes = (text.match(/—|–/g) || []).length;
  const colons = (text.match(/:/g) || []).length;

  const starters = sentences.map((s) => (s.split(/\s+/)[0] || '').toLowerCase()).filter(Boolean);
  const starterCounts = {};
  starters.forEach((st) => { starterCounts[st] = (starterCounts[st] || 0) + 1; });
  const repeatedStarters = starters.filter((st) => starterCounts[st] > 1).length;
  const starterRep = starters.length ? repeatedStarters / starters.length : 0;

  return { total: text.length, words: words.length, sentences: sentences.length, avg, cv, uniqueRatio, pm, dashes, colons, starterRep, per1k };
}

/* ---- 打分（zh / en 共用结构） ---- */
function scoreMetrics(m, lang) {
  const cvScore = lang === 'zh'
    ? (m.cv < 0.35 ? 25 : m.cv < 0.5 ? 15 : m.cv < 0.65 ? 5 : 0)
    : (m.cv < 0.4 ? 25 : m.cv < 0.55 ? 15 : m.cv < 0.7 ? 5 : 0);
  const phraseDensity = m.per1k(m.pm.hits);
  const phraseScore = Math.min(30, Math.round(phraseDensity * 12));
  const dashDensity = m.per1k(m.dashes);
  const dashScore = Math.min(15, dashDensity * 4);
  const starterScore = m.starterRep > 0.4 ? 15 : m.starterRep > 0.25 ? 8 : 0;
  const uniqueScore = lang === 'zh'
    ? (m.uniqueRatio < 0.32 ? 10 : 0)
    : (m.uniqueRatio < 0.45 ? 10 : 0);
  const total = Math.max(0, Math.min(100, cvScore + phraseScore + dashScore + starterScore + uniqueScore));
  return { cvScore, phraseDensity, phraseScore, dashDensity, dashScore, starterScore, uniqueScore, total };
}

/* ---- 检测按钮 ---- */
$('#wbDetect').addEventListener('click', () => {
  const raw = $('#wbInput').value;
  const out = $('#wbOutput');
  if (raw.trim().length < 60) {
    out.innerHTML = wbLang === 'zh'
      ? '<p class="report-empty">文本太短，难以给出有意义的提示。请粘贴至少 60 字（建议 300 字以上）。</p>'
      : '<p class="report-empty">The text is too short for a meaningful reading. Please paste at least 80 characters (300+ recommended).</p>';
    return;
  }

  if (wbLang === 'zh') {
    const m = zhMetrics(raw);
    const s = scoreMetrics(m, 'zh');
    let band, cls, explain;
    if (s.total >= 60) { band = '偏高'; cls = 'badge-high'; explain = '多项特征接近典型 AI 生成文本。请注意：这仍是概率提示，不构成认定。'; }
    else if (s.total >= 30) { band = '中等'; cls = 'badge-mid'; explain = '部分特征与 AI 文本有重叠，也可能只是规整的人类写作。'; }
    else { band = '较低'; cls = 'badge-low'; explain = '未发现明显指向 AI 的特征。'; }

    const phraseList = m.pm.matched.slice(0, 8).map((x) => `${escapeHtml(x.p)}（${x.count} 次）`).join('、') || '无';
    out.innerHTML = `
      <h3>痕迹检测报告（中文）</h3>
      <p><span class="badge ${cls}">风险 ${band} · 总分 ${s.total}/100</span></p>
      <p>${explain}</p>
      <table class="metric-table">
        <thead><tr><th>指标</th><th>你的值</th><th>得分</th></tr></thead>
        <tbody>
          <tr><td>句长变异系数</td><td>${m.cv.toFixed(2)}（平均句长 ${m.avg.toFixed(0)} 字）</td><td>${s.cvScore}/25</td></tr>
          <tr><td>高频套话密度</td><td>${s.phraseDensity} 处/千字</td><td>${s.phraseScore}/30</td></tr>
          <tr><td>破折号密度</td><td>${s.dashDensity} 处/千字</td><td>${s.dashScore}/15</td></tr>
          <tr><td>句首重复率</td><td>${Math.round(m.starterRep * 100)}%</td><td>${s.starterScore}/15</td></tr>
          <tr><td>用词多样性</td><td>${(m.uniqueRatio * 100).toFixed(1)}%（去重字/汉字）</td><td>${s.uniqueScore}/10</td></tr>
          <tr><td>冒号密度（仅展示）</td><td>${m.per1k(m.colons)} 处/千字</td><td>—</td></tr>
        </tbody>
      </table>
      <h4>命中的套话</h4>
      <p style="font-size:14px;">${phraseList}</p>
      <hr class="rule">
      <p style="color:var(--ink-faint);font-size:13px;">重要说明：本报告为本地启发式统计，<strong>不是 AI 检测结论</strong>，存在误报与漏报，不能用于认定作者是否使用 AI。本工具刻意不提供「改写直到分数降低」的功能。</p>
    `;
  } else {
    const m = enMetrics(raw);
    const s = scoreMetrics(m, 'en');
    let band, cls, explain;
    if (s.total >= 60) { band = 'Elevated'; cls = 'badge-high'; explain = 'Several features resemble typical AI-generated text. This remains a probabilistic hint, not a verdict.'; }
    else if (s.total >= 30) { band = 'Moderate'; cls = 'badge-mid'; explain = 'Some features overlap with AI text; could also be polished human writing.'; }
    else { band = 'Low'; cls = 'badge-low'; explain = 'No features clearly pointing to AI were found.'; }

    const phraseList = m.pm.matched.slice(0, 8).map((x) => `${escapeHtml(x.p)} (${x.count}×)`).join(', ') || 'none';
    out.innerHTML = `
      <h3>Trace detection report (English)</h3>
      <p><span class="badge ${cls}">Risk: ${band} · total ${s.total}/100</span></p>
      <p>${explain}</p>
      <table class="metric-table">
        <thead><tr><th>Metric</th><th>Your value</th><th>Score</th></tr></thead>
        <tbody>
          <tr><td>Sentence-length CV</td><td>${m.cv.toFixed(2)} (avg ${m.avg.toFixed(0)} words)</td><td>${s.cvScore}/25</td></tr>
          <tr><td>Stock-phrase density</td><td>${s.phraseDensity}/1k chars</td><td>${s.phraseScore}/30</td></tr>
          <tr><td>Dash density</td><td>${s.dashDensity}/1k chars</td><td>${s.dashScore}/15</td></tr>
          <tr><td>Repeated openers</td><td>${Math.round(m.starterRep * 100)}%</td><td>${s.starterScore}/15</td></tr>
          <tr><td>Lexical diversity</td><td>${(m.uniqueRatio * 100).toFixed(1)}% (unique/total words)</td><td>${s.uniqueScore}/10</td></tr>
          <tr><td>Colon density (info)</td><td>${m.per1k(m.colons)}/1k chars</td><td>—</td></tr>
        </tbody>
      </table>
      <h4>Matched stock phrases</h4>
      <p style="font-size:14px;">${phraseList}</p>
      <hr class="rule">
      <p style="color:var(--ink-faint);font-size:13px;">Important: this is a local heuristic analysis, <strong>not an AI-detection verdict</strong>; false positives and negatives occur. This tool deliberately offers no "rewrite until the score drops" feature.</p>
    `;
  }
});

$('#wbClear').addEventListener('click', () => {
  $('#wbInput').value = '';
  $('#wbOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「检测痕迹」。检测报告会给出分项打分表。</p>';
});

/* ============ 3. 润色（独立模块，中 / English） ============ */
let polLang = 'zh';

$$('#polLangTabs .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('#polLangTabs .tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    polLang = tab.dataset.lang;
    $('#polInputLabel').textContent = polLang === 'zh' ? '原文（中文）' : 'Original text (English)';
    $('#polInput').placeholder = polLang === 'zh' ? '粘贴需要润色的文本（建议 300 字以上）…' : 'Paste the text to polish (300+ characters recommended)…';
    $('#polOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「简洁化润色」。</p>';
  });
});

const zhRedundantRules = [
  { re: /进行了/g, to: '做了', note: '「进行 + 动词」可简化为动词本身' },
  { re: /通过([^\n，。；]{0,30}?)的方式/g, to: '通过$1', note: '「通过……的方式」删去“的方式”' },
  { re: /在([^\n，。；]{0,30}?)的情况下/g, to: '在$1时', note: '「在……的情况下」可简写' },
  { re: /值得注意的是，/g, to: '注意，', note: '套话可精简' },
  { re: /需要指出的是，/g, to: '', note: '可整体删除，直接陈述观点' },
  { re: /需要强调的是，/g, to: '强调，', note: '套话可精简' },
  { re: /总而言之/g, to: '总之', note: '用词更简洁' },
  { re: /综上所述/g, to: '综上', note: '用词更简洁' },
  { re: /基于上述分析(，|,)?/g, to: '综上', note: '用词更简洁' },
  { re: /可以(能够|会)/g, to: '可$1', note: '书面语可简化' },
  { re: /一般来说/g, to: '一般', note: '用词更简洁' },
];

function isCJK(ch) {
  return /[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/.test(ch);
}

function zhNormalizePunct(text) {
  let changed = 0;
  const map = { ',': '，', '.': '。', ';': '；', ':': '：', '?': '？', '!': '！', '(': '（', ')': '）' };
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (map[c] && (isCJK(text[i - 1] || '') || isCJK(text[i + 1] || ''))) {
      out += map[c]; changed++;
    } else {
      out += c;
    }
  }
  out = out.replace(/[\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]/g, (m) => {
    changed++;
    return String.fromCharCode(m.charCodeAt(0) - 0xfee0);
  });
  return { text: out, changed };
}

function zhNormalizeDash(text) {
  let changed = 0;
  const out = text
    .replace(/--/g, () => { changed++; return '——'; })
    .replace(/(?<!—)—(?!—)/g, () => { changed++; return '——'; });
  return { text: out, changed };
}

function zhApplyRedundant(text) {
  const suggestions = [];
  let out = text;
  for (const rule of zhRedundantRules) {
    const matches = out.match(rule.re);
    if (matches) {
      suggestions.push({ from: matches[0], to: matches[0].replace(rule.re, rule.to), note: rule.note, count: matches.length });
      out = out.replace(rule.re, rule.to);
    }
  }
  return { text: out, suggestions };
}

const enRedundantRules = [
  { re: /\bIt is important to note that\b/gi, to: 'Note that', note: 'Wordy opener' },
  { re: /\bIt is worth noting that\b/gi, to: 'Note that', note: 'Wordy opener' },
  { re: /\bIt should be noted that\b/gi, to: 'Note that', note: 'Wordy opener' },
  { re: /\bIt is evident that\b/gi, to: 'Clearly', note: 'Wordy opener' },
  { re: /\bIt can be seen that\b/gi, to: '', note: 'Can be deleted' },
  { re: /\bDue to the fact that\b/gi, to: 'Because', note: 'Concise alternative' },
  { re: /\bIn order to\b/gi, to: 'To', note: 'Concise alternative' },
  { re: /\bIn the event that\b/gi, to: 'If', note: 'Concise alternative' },
  { re: /\bFor the purpose of\b/gi, to: 'To', note: 'Concise alternative' },
  { re: /\bAt the end of the day\b/gi, to: 'Ultimately', note: 'Concise alternative' },
  { re: /\bThe vast majority of\b/gi, to: 'Most', note: 'Concise alternative' },
  { re: /\bA significant number of\b/gi, to: 'Many', note: 'Concise alternative' },
  { re: /\bWith regard to\b/gi, to: 'About', note: 'Concise alternative' },
  { re: /\bIn light of the fact that\b/gi, to: 'Because', note: 'Concise alternative' },
  { re: /\bAs a matter of fact\b/gi, to: 'In fact', note: 'Concise alternative' },
  { re: /\bIn spite of the fact that\b/gi, to: 'Although', note: 'Concise alternative' },
  { re: /\bPrior to\b/gi, to: 'Before', note: 'Concise alternative' },
  { re: /\bSubsequent to\b/gi, to: 'After', note: 'Concise alternative' },
];

function enPolish(text) {
  const suggestions = [];
  let out = text.replace(/--/g, '—').replace(/[ \t]{2,}/g, ' ');
  const dashChanged = (text.match(/--/g) || []).length;
  let redundantCount = 0;
  for (const rule of enRedundantRules) {
    const matches = out.match(rule.re);
    if (matches) {
      suggestions.push({ from: matches[0], to: matches[0].replace(rule.re, rule.to), note: rule.note, count: matches.length });
      out = out.replace(rule.re, rule.to);
      redundantCount += matches.length;
    }
  }
  const long = out.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).filter(Boolean).length > 30);
  return { text: out, suggestions, dashChanged, redundantCount, long };
}

$('#polPolish').addEventListener('click', () => {
  const raw = $('#polInput').value;
  const out = $('#polOutput');
  if (!raw.trim()) {
    out.innerHTML = '<p class="report-empty">请先粘贴文本。</p>';
    return;
  }

  if (polLang === 'zh') {
    let text = raw;
    const changes = [];
    let totalChanges = 0;
    const r1 = zhNormalizePunct(text);
    text = r1.text;
    if (r1.changed) { changes.push(`全半角标点 / 字母数字规范化：${r1.changed} 处`); totalChanges += r1.changed; }
    const r2 = zhNormalizeDash(text);
    text = r2.text;
    if (r2.changed) { changes.push(`破折号统一为「——」：${r2.changed} 处`); totalChanges += r2.changed; }
    const r3 = zhApplyRedundant(text);
    text = r3.text;
    const redundantTotal = r3.suggestions.reduce((a, s) => a + s.count, 0);
    totalChanges += redundantTotal;
    if (redundantTotal) changes.push(`去冗余表达：${redundantTotal} 处`);

    const sentences = text.split(/[。！？!?]+/).map((s) => s.trim()).filter(Boolean);
    const long = sentences.filter((s) => s.length > 60);

    let html = '<h3>简洁化润色结果（中文）</h3>';
    if (totalChanges === 0 && !long.length) {
      html += '<p style="color:var(--ok);">未发现需要调整的常见问题，文本已经比较规范。</p>';
    } else {
      if (changes.length) html += `<h4>已应用的调整</h4><ul>${changes.map((c) => `<li>${c}</li>`).join('')}</ul>`;
      if (long.length) html += `<h4>长句提示（${long.length} 句，建议拆分）</h4><ul>${long.slice(0, 5).map((s) => `<li>${escapeHtml(s.length > 40 ? s.slice(0, 40) + '…' : s)}</li>`).join('')}</ul>`;
    }
    if (r3.suggestions.length) {
      html += '<hr class="rule"><h4>去冗余建议</h4>';
      html += r3.suggestions.map((s) => `
        <div class="suggestion">
          <div><span class="from">${escapeHtml(s.from)}</span> → <span class="to">${escapeHtml(s.to)}</span></div>
          <div class="note">${escapeHtml(s.note)}（${s.count} 处）</div>
        </div>`).join('');
    }
    html += '<hr class="rule"><h4>结果</h4><p class="output-text">' + escapeHtml(text) + '</p>';
    html += '<div class="btn-row" style="margin-top:14px;"><button type="button" class="btn btn-primary" id="polCopy">复制结果</button></div>';
    out.innerHTML = html;
    $('#polCopy').addEventListener('click', () => { copyText(text); $('#polCopy').textContent = '已复制 ✓'; });
  } else {
    const r = enPolish(raw);
    let html = '<h3>Concise polish result (English)</h3>';
    const changes = [];
    if (r.dashChanged) changes.push(`Normalized double hyphens: ${r.dashChanged}`);
    if (r.redundantCount) changes.push(`Wordy phrases replaced: ${r.redundantCount}`);
    if (!changes.length && !r.long.length) {
      html += '<p style="color:var(--ok);">No common issues found; the text is already fairly concise.</p>';
    } else {
      if (changes.length) html += `<h4>Changes applied</h4><ul>${changes.map((c) => `<li>${c}</li>`).join('')}</ul>`;
      if (r.long.length) html += `<h4>Long sentences (${r.long.length}, consider splitting)</h4><ul>${r.long.slice(0, 5).map((s) => `<li>${escapeHtml(s.length > 50 ? s.slice(0, 50) + '…' : s)}</li>`).join('')}</ul>`;
    }
    if (r.suggestions.length) {
      html += '<hr class="rule"><h4>Suggestions</h4>';
      html += r.suggestions.map((s) => `
        <div class="suggestion">
          <div><span class="from">${escapeHtml(s.from)}</span> → <span class="to">${escapeHtml(s.to)}</span></div>
          <div class="note">${escapeHtml(s.note)}（${s.count}×）</div>
        </div>`).join('');
    }
    html += '<hr class="rule"><h4>Result</h4><p class="output-text">' + escapeHtml(r.text) + '</p>';
    html += '<div class="btn-row" style="margin-top:14px;"><button type="button" class="btn btn-primary" id="polCopy">Copy result</button></div>';
    out.innerHTML = html;
    $('#polCopy').addEventListener('click', () => { copyText(r.text); $('#polCopy').textContent = 'Copied ✓'; });
  }
});

$('#polClear').addEventListener('click', () => {
  $('#polInput').value = '';
  $('#polOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「简洁化润色」。会给出调整清单与修改后全文。</p>';
});

/* ============ 4. 方法学 Skill 库 ============ */
const SKILL_GROUPS = {
  flagship: { label: '总纲旗舰', en: 'flagship · HiAP & proactive health' },
  hecon: { label: '卫生经济学方法', en: 'health economics skills' },
  theory: { label: '社医理论与定性', en: 'medicine theory skills' },
  policy: { label: '政策评估与因果', en: 'policy & causal skills' },
  data: { label: '数据科学与预测', en: 'data & ML skills' },
  stats: { label: '统计与研究设计', en: 'stats & design skills' },
  writing: { label: '写作与润色', en: 'writing skills' },
};

const SKILLS = [
  { name: '主动健康与健康融入万策（总纲旗舰）', file: 'active-health-hiap-skill.md', group: 'flagship', tags: ['旗舰', 'HiAP', '主动健康'], desc: '把健康融入万策、带到每一个人心中：主动健康策略 + 健康影响评估（PAF/集中指数）+ 理论·数据·选题·院校五大板块，学科建设总纲。', icon: '旗舰' },
  { name: '卫生经济学评价教程', file: 'health-economics-tutorial-skill.md', group: 'hecon', tags: ['教程', '卫生经济'], desc: 'CEA/CUA 总纲：研究问题、成本测算、QALY、贴现、ICER、不确定性、CHEERS 2022 报告清单，9 步带代码。', icon: '教程' },
  { name: 'DCE 设计助手', file: 'dce-design-assistant-skill.md', group: 'hecon', tags: ['偏好测量', '卫生经济'], desc: '离散选择实验：正交/D-效率设计步骤 + clogit / mixlogit / lclogit2 潜类别分析，Stata 与 R 双轨。', icon: 'DCE' },
  { name: 'Markov 模型助手', file: 'markov-model-skill.md', group: 'hecon', tags: ['卫生经济', '建模'], desc: '队列模拟成本-效果分析：转移矩阵、半周期校正、贴现、ICER、tornado 与 PSA，Stata/R 全程代码。', icon: 'Markov' },
  { name: '机器学习助手', file: 'machine-learning-skill.md', group: 'data', tags: ['预测建模', '数据科学'], desc: '住院费用预测与风险分层：LASSO/弹性网、随机森林、XGBoost、SHAP 与 TRIPOD 报告。', icon: 'ML' },
  { name: 'DID 双重差分助手', file: 'did-skill.md', group: 'policy', tags: ['因果推断', '政策评估'], desc: '卫生政策效果评估：平行趋势、经典 2×2 DID、多期交错 DID（csdid）、事件研究、安慰剂检验。', icon: 'DID' },
  { name: 'ITS 间断时间序列助手', file: 'its-skill.md', group: 'policy', tags: ['政策评估', '时间序列'], desc: '单序列干预的水平变化与趋势变化：分段回归、Newey-West 自相关校正、反事实图。', icon: 'ITS' },
  { name: 'DDD 三重差分助手', file: 'ddd-skill.md', group: 'policy', tags: ['因果推断', '政策评估'], desc: '双重差分之差：三维交互识别（如集采×医院类型×品种类型），与 DID 的分解对照。', icon: 'DDD' },
  { name: 'Meta 分析助手', file: 'meta-analysis-skill.md', group: 'stats', tags: ['证据综合'], desc: '系统评价效应合并：OR/RR/SMD、固定与随机效应、异质性、森林图、发表偏倚、PRISMA。', icon: 'Meta' },
  { name: '定性方法与结构方程专题', file: 'sem-qca-qualitative-skill.md', group: 'theory', tags: ['质性研究', 'SEM/fsQCA'], desc: '扎根理论 / SEM / 多层SEM / fsQCA：lavaan、QCA 与 Stata sem/gsem/fuzzy 全程代码。', icon: 'SEM' },
  { name: 'socialmedicineskills 方法学速查手册', file: 'references/methods-54.md', group: 'stats', tags: ['速查', '54 条'], desc: '54 个方法速查：适用 / 要点 / Stata-R 核心代码 / 报告要点 / 常见错误；含理论框架 F 类与专题 G 类。', icon: '速查' },
  { name: '学术写作规范润色', file: 'academic-copyediting-skill.md', group: 'writing', tags: ['写作'], desc: '中文学术文本标点、句式、冗余与结构规范；写作质量工具，明确不做检测器规避。', icon: '润色' },
];

const SKILL_BASE = 'https://github.com/naturedu/socialmedicine/blob/main/skills/';

let skillGroupFilter = '';

function renderSkillGroups() {
  const el = $('#skillGroups');
  el.innerHTML = `
    <button type="button" class="chip-btn ${skillGroupFilter === '' ? 'on' : ''}" data-g="">全部</button>
    ${Object.entries(SKILL_GROUPS).map(([k, g]) => `
      <button type="button" class="chip-btn ${skillGroupFilter === k ? 'on' : ''}" data-g="${k}" title="${escapeHtml(g.en)}">
        ${escapeHtml(g.label)}<span class="chip-en">${escapeHtml(g.en)}</span>
      </button>`).join('')}`;
  $$('#skillGroups .chip-btn').forEach((b) => {
    b.addEventListener('click', () => {
      skillGroupFilter = b.dataset.g;
      renderSkillGroups();
      renderSkillCards();
    });
  });
}

function renderSkillCards() {
  const el = $('#skillCards');
  const list = SKILLS.filter((s) => !skillGroupFilter || s.group === skillGroupFilter);
  $('#skillCount').textContent = skillGroupFilter
    ? `${SKILL_GROUPS[skillGroupFilter].label}（${list.length} 份）`
    : `共 ${SKILLS.length} 份深度 Skill`;
  el.innerHTML = list.map((s) => `
    <div class="skill-card">
      <div class="skill-card-top">
        <span class="skill-icon" aria-hidden="true">${escapeHtml(s.icon)}</span>
        <span class="skill-tags"><span class="mini-tag">${escapeHtml(SKILL_GROUPS[s.group].label)}</span>${s.tags.map((t) => `<span class="mini-tag">${escapeHtml(t)}</span>`).join('')}</span>
      </div>
      <h3>${escapeHtml(s.name)}</h3>
      <p>${escapeHtml(s.desc)}</p>
      <div class="skill-card-foot">
        <a href="${SKILL_BASE}${encodeURIComponent(s.file)}" target="_blank" rel="noopener">打开 Skill（GitHub）</a>
        <span class="hint">方法 + Stata/R 代码</span>
      </div>
    </div>`).join('');
}

renderSkillGroups();
renderSkillCards();

/* ---- 方法学速查（50 条） ---- */
const METHOD_CATS = {
  A: 'A 研究设计与偏倚',
  B: 'B 统计分析',
  C: 'C 卫生经济与政策',
  D: 'D 因果推断',
  E: 'E 数据科学',
  F: 'F 理论框架',
  G: 'G 定性与结构方程',
};

const METHODS = [
  { cat: 'A', id: 'A1', name: '横断面研究', use: '一次时点调查患病率与相关因素' },
  { cat: 'A', id: 'A2', name: '病例对照研究', use: '罕见结局回顾性比较暴露史（OR）' },
  { cat: 'A', id: 'A3', name: '队列研究', use: '前瞻随访比较暴露组结局发生率（RR/HR）' },
  { cat: 'A', id: 'A4', name: '随机对照试验 RCT', use: '干预因果评价金标准（ITT、CONSORT）' },
  { cat: 'A', id: 'A5', name: '准实验设计', use: '无法随机时的前后对照/非等效对照' },
  { cat: 'A', id: 'A6', name: '生态学研究', use: '群体水平暴露-结局关联初探（注意生态学谬误）' },
  { cat: 'A', id: 'A7', name: '混合方法研究', use: '定性+定量互补解释机制与背景（joint display）' },
  { cat: 'A', id: 'A8', name: '德尔菲法', use: '专家多轮征询达成指标/方案共识' },
  { cat: 'B', id: 'B1', name: '描述统计与正态性检验', use: '分布概貌与检验方法选择（Shapiro-Wilk）' },
  { cat: 'B', id: 'B2', name: 't 检验与方差分析', use: '两组/多组均值比较' },
  { cat: 'B', id: 'B3', name: '卡方检验与非参数检验', use: '分类关联与偏态数据比较' },
  { cat: 'B', id: 'B4', name: '相关与简单线性回归', use: '两连续变量的线性关系与预测' },
  { cat: 'B', id: 'B5', name: '二元 logistic 回归', use: '二分类结局影响因素与预测（OR）' },
  { cat: 'B', id: 'B6', name: '有序/多项 logistic 回归', use: '等级结局（如健康状况）与多分类结局' },
  { cat: 'B', id: 'B7', name: 'Poisson 与负二项回归', use: '计数结局（住院次数、事件数）' },
  { cat: 'B', id: 'B8', name: '生存分析（KM/Cox）', use: '至事件时间与风险因素（HR）' },
  { cat: 'B', id: 'B9', name: '重复测量与混合效应模型', use: '纵向/聚集数据的个体内相关' },
  { cat: 'B', id: 'B10', name: '主成分分析与因子分析', use: '降维与量表结构效度' },
  { cat: 'C', id: 'C1', name: '成本测算', use: '识别-测量-估值三步与区间估计' },
  { cat: 'C', id: 'C2', name: 'CEA / CUA', use: '增量成本效果比与经济性判断（详见教程）' },
  { cat: 'C', id: 'C3', name: 'QALY / DALY 计算', use: '健康效用与疾病负担指标' },
  { cat: 'C', id: 'C4', name: '预算影响分析 BIA', use: '新干预对医保预算的短期影响' },
  { cat: 'C', id: 'C5', name: '卫生技术评估 HTA', use: '多维度证据的综合决策框架' },
  { cat: 'C', id: 'C6', name: 'SFA / DEA 效率评价', use: '医院与卫生系统技术效率前沿' },
  { cat: 'C', id: 'C7', name: '医保支付标准测算', use: 'DRG/DIP 权重与点值测算思路' },
  { cat: 'C', id: 'C8', name: '公平性（集中指数）', use: '健康与利用不平等测量与分解' },
  { cat: 'D', id: 'D1', name: '倾向得分匹配 PSM', use: '观察性数据的处理-对照平衡' },
  { cat: 'D', id: 'D2', name: '工具变量 IV', use: '内生性下的因果识别（2SLS）' },
  { cat: 'D', id: 'D3', name: '断点回归 RDD', use: '临界值附近的局部因果效应' },
  { cat: 'D', id: 'D4', name: '合成控制法 SCM', use: '单地区政策评估的反事实构造' },
  { cat: 'D', id: 'D5', name: '事件研究法', use: '政策动态效应轨迹' },
  { cat: 'D', id: 'D6', name: 'DID 双重差分', use: '两期面板政策效应（详见 DID skill）' },
  { cat: 'D', id: 'D7', name: 'ITS 间断时间序列', use: '单序列干预水平与趋势变化（详见 ITS skill）' },
  { cat: 'D', id: 'D8', name: 'DDD 三重差分', use: '双重差分之差（详见 DDD skill）' },
  { cat: 'E', id: 'E1', name: '缺失数据与多重插补', use: '减少删失偏倚（MICE）' },
  { cat: 'E', id: 'E2', name: '样本量与统计效能', use: '事前确定最小样本量' },
  { cat: 'E', id: 'E3', name: 'LASSO / 弹性网', use: '高维变量筛选（详见机器学习 skill）' },
  { cat: 'E', id: 'E4', name: '随机森林 / XGBoost', use: '非线性预测建模（详见机器学习 skill）' },
  { cat: 'E', id: 'E5', name: '聚类分析', use: '无监督分组（患者分型、机构分类）' },
  { cat: 'E', id: 'E6', name: '贝叶斯统计入门', use: '先验+数据的后验推断' },
  { cat: 'F', id: 'F1', name: 'Andersen 行为模型', use: '卫生服务利用的决定因素框架' },
  { cat: 'F', id: 'F2', name: 'Grossman 健康需求模型', use: '健康资本与医疗需求' },
  { cat: 'F', id: 'F3', name: '健康信念模型 HBM', use: '个体健康行为的心理动因' },
  { cat: 'F', id: 'F4', name: '计划行为理论 TPB', use: '态度-规范-控制感→行为意向' },
  { cat: 'F', id: 'F5', name: '社会生态学模型', use: '多层次因素嵌套解释健康' },
  { cat: 'F', id: 'F6', name: '健康公平理论', use: 'Rawls 正义与 Sen 可行能力' },
  { cat: 'F', id: 'F7', name: '健康社会决定因素 CSDH', use: '社会梯度与健康不平等' },
  { cat: 'F', id: 'F8', name: '委托代理与供方诱导需求', use: '信息不对称下的医生行为' },
  { cat: 'F', id: 'F9', name: '市场失灵与政府干预', use: '公共品/外部性/信息不对称' },
  { cat: 'F', id: 'F10', name: '制度变迁与路径依赖', use: '医改的制度分析视角' },
  { cat: 'G', id: 'G1', name: '扎根理论', use: '三级编码与理论建构（详见 SEM/fsQCA 专题 skill）' },
  { cat: 'G', id: 'G2', name: '结构方程模型 SEM', use: '潜变量测量与路径（lavaan / sem）' },
  { cat: 'G', id: 'G3', name: '多层/多重嵌套 SEM', use: '嵌套数据（患者-科室-医院）的多层建模' },
  { cat: 'G', id: 'G4', name: 'fsQCA 定性比较分析', use: '组态视角的多路径因果（QCA / fuzzy）' },
];

let methodCatFilter = '';
let methodQuery = '';

function renderMethodCats() {
  const el = $('#methodCats');
  const cats = Object.keys(METHOD_CATS);
  el.innerHTML = `
    <button type="button" class="chip-btn ${methodCatFilter === '' ? 'on' : ''}" data-cat="">全部</button>
    ${cats.map((c) => `<button type="button" class="chip-btn ${methodCatFilter === c ? 'on' : ''}" data-cat="${c}">${escapeHtml(METHOD_CATS[c])}</button>`).join('')}`;
  $$('#methodCats .chip-btn').forEach((b) => {
    b.addEventListener('click', () => {
      methodCatFilter = b.dataset.cat;
      renderMethodCats();
      renderMethodList();
    });
  });
}

function renderMethodList() {
  const q = methodQuery.trim().toLowerCase();
  const list = METHODS.filter((m) => {
    const okCat = !methodCatFilter || m.cat === methodCatFilter;
    const okQ = !q || (m.name + m.use + m.id).toLowerCase().includes(q);
    return okCat && okQ;
  });
  $('#methodCount').textContent = `共 ${list.length} / ${METHODS.length} 条${q ? '（搜索：“' + escapeHtml(methodQuery.trim()) + '”）' : ''}`;
  const el = $('#methodList');
  if (!list.length) {
    el.innerHTML = '<p class="report-empty">没有匹配的方法，换一个关键词试试。</p>';
    return;
  }
  el.innerHTML = list.map((m) => `
    <div class="method-item">
      <span class="method-id">${m.id}</span>
      <span class="method-name">${escapeHtml(m.name)}</span>
      <span class="method-use">${escapeHtml(m.use)}</span>
      <span class="mini-tag cat-${m.cat}">${escapeHtml(METHOD_CATS[m.cat])}</span>
    </div>`).join('');
}

$('#methodSearch').addEventListener('input', (e) => {
  methodQuery = e.target.value;
  renderMethodList();
});

renderMethodCats();
renderMethodList();

/* ============ 5. 全球健康数据库（数据源） ============ */
const DATA_SOURCES = [
  { tag: '国际', name: 'GBD 全球疾病负担结果工具（IHME）', scope: '疾病、伤害与危险因素的负担、DALY/YLD 可视化与下载', url: 'https://vizhub.healthdata.org/gbd-results/' },
  { tag: '国际', name: 'WHO 全球卫生观察站（GHO）', scope: '各国卫生指标、卫生系统与健康目标监测', url: 'https://www.who.int/data/gho' },
  { tag: '国际', name: 'WHO 全球卫生支出数据库（NHA）', scope: '各国卫生总费用、政府/个人/外部筹资构成', url: 'https://apps.who.int/nha/database' },
  { tag: '国际', name: 'WHO 免疫接种数据门户', scope: '各国疫苗接种率与计划免疫进展', url: 'https://immunizationdata.who.int/' },
  { tag: '国际', name: 'WHO 死亡率数据库', scope: '按死因、年龄、性别的各国死亡数据', url: 'https://www.who.int/data/data-collection-tools/who-mortality-database' },
  { tag: '国际', name: '世界银行 HNP 统计', scope: '健康、营养与人口指标（期望寿命、卫生支出占 GDP 等）', url: 'https://databank.worldbank.org/source/health-nutrition-and-population-statistics' },
  { tag: '国际', name: 'Our World in Data', scope: '全球健康与发展的长时段可视化与开放数据', url: 'https://ourworldindata.org/health' },
  { tag: '国际', name: 'OECD 健康统计', scope: 'OECD 国家卫生支出、质量、利用与健康状态', url: 'https://stats.oecd.org/Index.aspx?DataSetCode=HEALTH_STAT' },
  { tag: '国际', name: 'UNICEF Data', scope: '儿童健康、营养、免疫与孕产妇指标', url: 'https://data.unicef.org/' },
  { tag: '国际', name: 'UNAIDS AIDSinfo', scope: '艾滋病流行、检测、治疗与消除目标数据', url: 'https://aidsinfo.unaids.org/' },
  { tag: '国际', name: 'FAO FAOSTAT', scope: '食物安全、营养与农业统计（营养流行病学常用）', url: 'https://www.fao.org/faostat/en/' },
  { tag: '国际', name: '人类死亡率数据库 HMD', scope: '分年龄别死亡率与期望寿命（人口学与精算）', url: 'https://www.mortality.org/' },
  { tag: '国际', name: 'DHS 人口与健康调查', scope: '90+ 国家微观调查：生育、儿童健康、营养、HIV', url: 'https://dhsprogram.com/' },
  { tag: '国际', name: 'IPUMS', scope: '国际人口普查与健康调查微观数据整合平台', url: 'https://www.ipums.org/' },
  { tag: '国际', name: 'healthdata.gov', scope: '美国联邦开放健康数据门户', url: 'https://healthdata.gov/' },
  { tag: '国际', name: 'IHME COVID-19 预估', scope: '疫情住院、死亡与医疗资源使用建模预估', url: 'https://covid19.healthdata.org/' },
  { tag: '中国', name: '国家统计局 · 国家数据', scope: '人口、卫生、经济等宏观年度数据', url: 'https://data.stats.gov.cn/' },
  { tag: '中国', name: '国家卫生健康委员会', scope: '卫生健康统计公报、卫生服务调查与年鉴', url: 'http://www.nhc.gov.cn/' },
  { tag: '中国', name: '国家医疗保障局', scope: '医保基金收支统计公报、DRG/DIP 与集采动态', url: 'https://www.nhsa.gov.cn/' },
  { tag: '中国', name: '公共卫生科学数据中心（中国 CDC）', scope: '传染病、慢病、死因监测与健康危险因素数据', url: 'https://www.phsciencedata.cn/' },
  { tag: '中国', name: 'CHARLS 中国健康与养老追踪调查', scope: '45+ 中老年人群健康、经济与养老微观面板', url: 'https://charls.charlsdata.com/' },
  { tag: '中国', name: 'CFPS 中国家庭追踪调查', scope: '全国代表性家庭面板（健康、经济、教育）', url: 'https://www.isss.pku.edu.cn/cfps/' },
  { tag: '中国', name: 'CLHLS 中国老年健康调查', scope: '高龄老人健康长寿影响因素纵向数据', url: 'https://opendata.pku.edu.cn/' },
  { tag: '中国', name: 'CHNS 中国健康与营养调查', scope: '九省区长期追踪：膳食、健康与卫生服务', url: 'https://www.cpc.unc.edu/projects/china' },
  { tag: '中国', name: 'CGSS 中国综合社会调查', scope: '社会结构、健康与主观福祉全国截面调查', url: 'http://cgss.ruc.edu.cn/' },
];

function renderDataSources() {
  $('#dataGrid').innerHTML = DATA_SOURCES.map((d) => `
    <div class="data-card">
      <div class="data-card-top">
        <span class="mini-tag ${d.tag === '国际' ? 'tag-global' : 'tag-cn'}">${d.tag}</span>
        <h3>${escapeHtml(d.name)}</h3>
      </div>
      <p>${escapeHtml(d.scope)}</p>
      <a href="${escapeHtml(d.url)}" target="_blank" rel="noopener">打开数据库 ↗</a>
    </div>`).join('');
}

renderDataSources();

/* ============ 5.5 院校科普 ============ */
const SCHOOLS = window.SM.institutions.slice(0,12).map(i=>({name:i.name,school:"官方入口导航",type:i.region,focus:i.focus,note:i.status,url:i.url}));

function renderSchools() {
  $('#schoolGrid').innerHTML = SCHOOLS.map((s) => `
    <div class="data-card">
      <div class="data-card-top">
        <span class="mini-tag ${s.type === '公卫' ? 'tag-global' : s.type === '医管' ? 'tag-cn' : ''}">${s.type}</span>
        <h3>${escapeHtml(s.name)}</h3>
      </div>
      <p><strong style="color:var(--ink);">${escapeHtml(s.school)}</strong><br>${escapeHtml(s.focus)}<br><span class="hint">${escapeHtml(s.note)}</span></p>
      <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">学校/院系官网 ↗（院系入口以学校主页导航为准）</a>
    </div>`).join('');
}

renderSchools();

/* ============ 6. 目标期刊查询 ============ */
const JOURNALS = window.SM.journals.map(j => ({name:j.name,issn:j.issn||"待核",area:j.category,pub:j.publisher||"见官方入口",url:j.url}));

let journalCat = '';
let journalQuery = '';

function renderJournalCats() {
  const areas = ['全部', ...new Set(JOURNALS.map((j) => j.area))];
  $('#journalCats').innerHTML = areas.map((a) => `
    <button type="button" class="chip-btn ${journalCat === a ? 'on' : ''}" data-area="${a}">${escapeHtml(a)}</button>`).join('');
  $$('#journalCats .chip-btn').forEach((b) => {
    b.addEventListener('click', () => {
      journalCat = b.dataset.area;
      renderJournalCats();
      renderJournals();
    });
  });
}

function renderJournals() {
  const q = journalQuery.trim().toLowerCase();
  const list = JOURNALS.filter((j) => {
    const okCat = !journalCat || journalCat === '全部' || j.area === journalCat;
    const okQ = !q || (j.name + j.issn + j.area + j.pub).toLowerCase().includes(q);
    return okCat && okQ;
  });
  $('#journalCount').textContent = `共 ${list.length} / ${JOURNALS.length} 种（影响因子与分区请以最新 JCR / 官方为准）`;
  $('#journalBody').innerHTML = list.map((j) => `
    <tr>
      <td><strong>${escapeHtml(j.name)}</strong></td>
      <td>${escapeHtml(j.issn)}</td>
      <td><span class="mini-tag">${escapeHtml(j.area)}</span></td>
      <td>${escapeHtml(j.pub)}</td>
      <td><a href="${escapeHtml(j.url)}" target="_blank" rel="noopener">期刊入口 ↗</a></td>
    </tr>`).join('');
}

$('#journalSearch').addEventListener('input', (e) => {
  journalQuery = e.target.value;
  renderJournals();
});

renderJournalCats();
renderJournals();

/* ============ 6.5 顶刊选刊指南 ============ */
const TOP_JOURNALS = [
  { name: 'Science', tier: '综合旗舰 CNS', focus: '多学科旗舰；卫生政策 Research Article 偏好可复算数据、明确政策工具与分配证据', fit: '政策因果评估（DID/ITS/自然实验）、环境-健康治理、疫情与监测类大问题', note: '对「普适性 + 方法扎实」要求极高；样本案例见本仓库 Science 卫生政策 59 篇分析。', url: 'https://www.science.org/' },
  { name: 'Nature', tier: '综合旗舰 CNS', focus: '多学科旗舰；健康类以机制、大数据与跨学科为主', fit: '基因组监测、健康大数据、生态-健康交叉', note: '编辑初筛严格；重视「为什么现在 + 为什么是 Nature」。', url: 'https://www.nature.com/nature/' },
  { name: 'Cell', tier: '综合旗舰 CNS', focus: '生命科学旗舰；医学机制与组学', fit: '机制研究；社医卫管方向通常不合适，除非机制+人群证据结合', note: '纯政策评估论文一般另投专刊。', url: 'https://www.cell.com/cell/' },
  { name: 'Nature Medicine', tier: '医学旗舰', focus: '转化医学与临床前沿；也发人群健康与卫生体系研究', fit: '临床预测模型、真实世界证据、数字健康试验、疫苗与公卫干预', note: '需要临床/人群影响力与转化价值。', url: 'https://www.nature.com/nm/' },
  { name: 'The New England Journal of Medicine', tier: '医学旗舰', focus: '临床医学最高影响力；卫生政策以 Perspective 与政策研究为主', fit: '政策视角、重大卫生改革评述（研究文章多为临床）', note: '政策实证研究多为小篇幅；原创研究竞争极激烈。', url: 'https://www.nejm.org/' },
  { name: 'The Lancet', tier: '医学旗舰', focus: '全球健康旗舰；发表大量卫生政策、卫生体系与全球健康研究', fit: '全球健康、卫生体系评价、中国卫生改革、疾病负担', note: 'Lancet 子刊（Public Health、Global Health、Regional Health – Western Pacific）是社医卫管友好选择。', url: 'https://www.thelancet.com/' },
  { name: 'JAMA 及 JAMA Health Forum', tier: '医学旗舰', focus: 'JAMA 主刊发重磅政策研究；JAMA Health Forum 专注卫生政策', fit: '美国语境政策研究居多；中国政策需强调普适启示；Health Forum 更友好', note: '「JAMA 子刊」里 Health Forum 是卫生政策专刊。', url: 'https://jamanetwork.com/journals/jama' },
  { name: 'Health Affairs', tier: '卫生政策顶刊', focus: '卫生政策与卫生服务研究旗舰，政策界与学界桥梁', fit: '医保支付改革、药品政策、卫生体系绩效、政策评论', note: '强调政策含义与可读性；短篇与专题特刊多。', url: 'https://www.healthaffairs.org/' },
  { name: 'Social Science & Medicine', tier: '社会医学旗舰', focus: '社会医学、健康社会学、卫生政策与地理健康', fit: '健康社会决定因素、公平性、患者体验、政策过程研究', note: '方法包容（定量/定性/混合）；卷量大、方向广。', url: 'https://www.sciencedirect.com/journal/social-science-and-medicine' },
  { name: 'Nature Communications', tier: '跨学科高影响力', focus: '全学科开放获取；接受扎实但不求「轰动」的完整研究', fit: '基因组监测、多源数据建模、行为干预试验、政策评估实证', note: '开放获取有版面费；评审看重方法严谨与可复现。', url: 'https://www.nature.com/ncomms/' },
  { name: 'Health Economics', tier: '卫生经济旗舰', focus: '卫生经济学理论与应用旗舰', fit: '医保设计、支付方式、卫生服务利用、药物经济学', note: '方法严谨（计量）要求高；与 Journal of Health Economics 并列为卫生经济双旗舰。', url: 'https://onlinelibrary.wiley.com/journal/10991050' },
  { name: 'Journal of Health Economics', tier: '卫生经济旗舰', focus: '卫生经济学理论前沿与识别策略', fit: '因果识别（DID/IV/RDD）、医生行为、保险市场', note: '对识别策略与理论贡献要求最高。', url: 'https://www.sciencedirect.com/journal/journal-of-health-economics' },
  { name: 'npj Digital Medicine', tier: '数字健康旗舰', focus: '数字健康与 AI 医学；开放获取', fit: '移动健康干预、医疗 AI 评测、远程监测、LLM 临床应用', note: '需临床/人群证据与伦理治理考量；Nature Portfolio 出品。', url: 'https://www.nature.com/npjdigitalmed/' },
  { name: 'BMJ 及 BMJ Global Health', tier: '医学与全球健康', focus: 'BMJ 主刊重视「现实可改变」的研究；Global Health 子刊开放获取', fit: '卫生政策、质量改进、全球健康与中低收入国家研究', note: 'BMJ 喜欢对临床/政策有行动含义的研究。', url: 'https://www.bmj.com/' },
  { name: 'BMC Public Health', tier: '开放获取公卫友好', focus: '公共卫生全领域开放获取大刊，方法包容', fit: '横断面、队列、行为干预、健康不平等、中国人群研究', note: '审稿相对友好、容量大；注意版面费与创新性要求。', url: 'https://bmcpublichealth.biomedcentral.com/' },
  { name: 'International Journal for Equity in Health', tier: '开放获取公卫友好', focus: '健康公平与健康社会决定因素专刊，开放获取', fit: '健康不平等测量（集中指数/分解）、公平性政策评估、弱势人群', note: '社医卫管「公平性」选题的对口期刊。', url: 'https://equityhealthj.biomedcentral.com/' },
  { name: 'Globalization and Health', tier: '开放获取公卫友好', focus: '全球化与健康的交叉议题，开放获取', fit: '全球卫生治理、跨国健康影响、卫生外交、贸易与健康', note: '适合把单一国家研究放进全球框架。', url: 'https://globalizationandhealth.biomedcentral.com/' },
  { name: 'Health Policy and Planning', tier: '开放获取公卫友好', focus: '卫生政策与规划，牛津大学出版社，偏中低收入国家', fit: '卫生体系、政策过程、医保改革实施研究', note: '强调政策相关性与可落地启示。', url: 'https://academic.oup.com/heapol' },
  { name: 'International Journal of Health Policy and Management', tier: '开放获取公卫友好', focus: '卫生政策与管理，开放获取，审稿周期较快', fit: '卫生治理、政策分析、卫生体系比较、中国医改案例', note: '中国卫生改革研究发表友好。', url: 'https://www.ijhpm.com/' },
];

function renderTopJournals() {
  const tiers = [...new Set(TOP_JOURNALS.map((j) => j.tier))];
  $('#topJournalGrid').innerHTML = tiers.map((tier) => `
    <div class="top-tier">
      <h3 class="top-tier-title">${escapeHtml(tier)}</h3>
      <div class="data-grid">
        ${TOP_JOURNALS.filter((j) => j.tier === tier).map((j) => `
          <div class="data-card">
            <div class="data-card-top"><h3>${escapeHtml(j.name)}</h3></div>
            <p><strong style="color:var(--accent);">定位：</strong>${escapeHtml(j.focus)}<br>
               <strong style="color:var(--gold);">契合选题：</strong>${escapeHtml(j.fit)}<br>
               <span class="hint">${escapeHtml(j.note)}</span></p>
            <a href="${escapeHtml(j.url)}" target="_blank" rel="noopener">期刊官网 ↗</a>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

renderTopJournals();

/* ============ 6.8 理论研究板块 ============ */
const THEORY_GROUPS = [
  { key: 'social', label: '社会医学与健康行为理论' },
  { key: 'econ', label: '卫生经济学理论' },
  { key: 'mgmt', label: '卫生管理与政策理论' },
  { key: 'china', label: '中国本土政策话语' },
];

const THEORIES = [
  { group: 'social', name: '健康社会决定因素框架（CSDH）', src: 'WHO 社会决定因素委员会，2008', core: '健康不平等根源于日常生活条件与权力、金钱、资源的分配方式。', use: '论文开篇论证结构性成因，为公平性分析定框架。', topic: '某类健康结局的社会梯度与贡献分解' },
  { group: 'social', name: '社会生态学模型', src: 'Bronfenbrenner / McLeroy 等', core: '个体—人际—组织—社区—政策五层嵌套共同塑造健康。', use: '为多水平研究（mixed / 多层 SEM）提供分层变量依据。', topic: '建成环境对居民体力活动的多层次影响' },
  { group: 'social', name: '健康信念模型（HBM）', src: 'Rosenstock', core: '感知易感性、严重性、收益、障碍与自我效能驱动健康行为。', use: '干预设计与问卷条目来源。', topic: '疫苗犹豫、慢病筛查依从的影响因素' },
  { group: 'social', name: '计划行为理论（TPB）', src: 'Ajzen', core: '态度—主观规范—知觉行为控制→行为意向→行为。', use: '用 SEM / lavaan 检验理论结构。', topic: '慢病患者自我管理行为机制' },
  { group: 'social', name: 'Andersen 行为模型', src: 'Andersen', core: '倾向、使能、需要三因素解释卫生服务利用。', use: '就医行为研究的变量框架。', topic: '老年人就医选择与利用公平性' },
  { group: 'econ', name: 'Grossman 健康需求模型', src: 'Grossman', core: '健康是人力资本存量，健康投资与医疗需求内生决定。', use: '医疗需求弹性的理论起点。', topic: '健康投资行为与医疗服务价格弹性' },
  { group: 'econ', name: '委托代理与供方诱导需求', src: 'Arrow / Evans', core: '信息不对称下医生兼具患者代理人与服务供给者双重角色。', use: '支付方式改革研究的理论依据。', topic: 'DRG/DIP 改革对服务量的因果效应' },
  { group: 'econ', name: '市场失灵与政府干预', src: '卫生经济学基础理论', core: '公共品、外部性、信息不对称与逆向选择使市场偏离最优。', use: '医保与公卫制度设计的正当性论证。', topic: '医保市场失灵与制度设计' },
  { group: 'econ', name: '健康公平与正义理论', src: 'Rawls / Sen', core: '机会公平与可行能力视角下的健康正义。', use: '健康不平等的伦理基础。', topic: '健康不平等的测量与政策含义（集中指数/分解）' },
  { group: 'mgmt', name: '制度变迁与路径依赖', src: 'North', core: '制度惯性约束改革路径，变迁是渐进与断裂的叠加。', use: '医改历史分析框架。', topic: 'DRG/DIP 改革的路径依赖与突破' },
  { group: 'mgmt', name: '协同治理与多中心治理', src: 'Ostrom 等', core: '多主体协同、自组织与共同生产超越单一权威。', use: '医共体 / 医联体治理结构分析。', topic: '紧密型县域医共体的治理机制' },
  { group: 'mgmt', name: '激励与组织行为理论', src: '组织行为学', core: '激励相容、职业倦怠与组织承诺塑造服务行为。', use: '医务人员行为研究。', topic: '医务人员薪酬激励与工作投入' },
  { group: 'china', name: '健康中国战略', src: '《"健康中国2030"规划纲要》', core: '把健康融入所有政策，覆盖全人群全生命周期。', use: '论文引言与政策背景必备。', topic: '健康融入万策的落地评估' },
  { group: 'china', name: '主动健康', src: '中国本土概念', core: '个体主动（行为）+ 体系主动（环境、政策、服务与支付）。', use: '行为与体系双重视角的研究设计。', topic: '体医融合、五处方干预评估' },
  { group: 'china', name: '价值医疗与整合型服务体系', src: '国际概念本土化', core: '以健康结果为导向的支付与服务整合。', use: '支付与服务改革研究的框架。', topic: '按价值付费与医防融合' },
  { group: 'social', name: '知信行模式（KAP）', src: '健康教育经典模式', core: '知识→信念/态度→行为的递进链。', use: '健康宣教效果评价的常用框架。', topic: '健康科普对行为改变的分段效应' },
  { group: 'social', name: '保护动机理论（PMT）', src: 'Rogers', core: '威胁评估 + 应对评估共同决定保护行为。', use: '风险沟通与自我防护干预设计。', topic: '传染病防护行为与风险感知' },
  { group: 'social', name: '压力与应对理论', src: 'Lazarus；JD-R 模型', core: '压力是环境要求与个人资源交互的结果；工作要求—资源模型解释职业倦怠。', use: '职业人群心理健康研究框架。', topic: '医务人员职业倦怠与工作资源' },
  { group: 'social', name: '生命历程理论', src: 'Elder 等', core: '早期暴露、关键期与累积效应贯穿一生。', use: '队列与自然实验的时间窗设计。', topic: '生命早期营养环境与成年慢病' },
  { group: 'social', name: '社会网络与社会支持理论', src: 'Berkman & Syme', core: '网络结构与社会支持影响健康行为与结局。', use: '网络干预（朋友提名法等）的理论基础。', topic: '社区健康行为扩散的网络定向干预' },
  { group: 'social', name: '病耻感理论（Stigma）', src: 'Goffman / Link & Phelan', core: '标签、刻板印象与歧视循环阻碍求助与依从。', use: '精神疾病、传染病患者的定性/混合研究。', topic: '慢病病耻感对就医延迟的影响' },
  { group: 'econ', name: '健康生产函数', src: '卫生经济学基础', core: '健康产出由医疗服务、行为、环境与禀赋共同生产。', use: '投入-产出边界的实证设定。', topic: '卫生投入的健康产出效率（SFA/DEA）' },
  { group: 'econ', name: '医疗保险与道德风险', src: 'Arrow；Pauly', core: '参保改变价格与行为：事前道德风险与事后道德风险。', use: '医保政策评估的经典框架。', topic: '门诊统筹对就医行为与费用的影响' },
  { group: 'econ', name: '支付方式与激励相容', src: '卫生经济学', core: '按项目、按人头、按结果支付塑造不同激励。', use: '支付改革实证研究的对照逻辑。', topic: 'DRG/DIP 与按绩效支付的比较评估' },
  { group: 'econ', name: '行为经济学与助推（Nudge）', src: 'Thaler & Sunstein', core: '默认选项、框架与损失厌恶影响健康决策。', use: '低成本行为干预实验设计。', topic: '默认预约、短信提醒对接种率的影响' },
  { group: 'mgmt', name: '多源流理论', src: 'Kingdon', core: '问题流、政策流、政治流在政策之窗汇合。', use: '政策议程与出台时机的过程分析。', topic: '某医保政策为何在此时出台的过程研究' },
  { group: 'mgmt', name: '政策扩散理论', src: '政策科学', core: '政策在地区间的学习、竞争与模仿扩散。', use: '跨地区政策采纳的定量分析。', topic: 'DRG 付费改革在省份间的扩散' },
  { group: 'mgmt', name: '全面质量管理与精益管理', src: '管理科学', core: 'PDCA 循环、消除浪费与持续改进。', use: '医疗质量改进项目设计。', topic: '手术室流程再造对效率与安全的影响' },
  { group: 'mgmt', name: '循证卫生决策', src: 'Evidence-informed policy', core: '用系统综述与本地证据支持政策选择。', use: 'Meta 分析、HTA 的决策接口。', topic: '证据如何进入地方医保目录决策' },
  { group: 'mgmt', name: '组织变革理论', src: 'Lewin', core: '解冻—变革—再冻结三阶段。', use: '医院改革案例的过程分析。', topic: '公立医院绩效改革的组织阻力与化解' },
  { group: 'china', name: '新时代卫生与健康工作方针', src: '全国卫生与健康大会', core: '以基层为重点、改革创新为动力、预防为主、中西医并重、把健康融入所有政策、人民共建共享。', use: '标书与研究背景的标准表述。', topic: '基层卫生服务能力与预防优先的实证' },
  { group: 'china', name: '三医联动', src: '中国医改', core: '医疗、医保、医药协同治理。', use: '多部门政策协同研究的框架。', topic: '集采、支付与医院行为的三医联动评估' },
  { group: 'china', name: '公立医院高质量发展', src: '国务院办公厅文件', core: '三个转变、三个提高：从规模扩张转向提质增效。', use: '医院管理研究的最新政策语境。', topic: '医院运营效率与学科建设的平衡' },
  { group: 'china', name: '分级诊疗与整合型服务', src: '中国医改', core: '基层首诊、双向转诊、医联体医共体建设。', use: '服务体系研究的制度背景。', topic: '医共体对县域就诊格局的因果效应' },
];

function renderTheories() {
  $('#theoryGrid').innerHTML = THEORY_GROUPS.map((g) => `
    <div class="top-tier">
      <h3 class="top-tier-title">${escapeHtml(g.label)}</h3>
      <div class="data-grid">
        ${THEORIES.filter((t) => t.group === g.key).map((t) => `
          <div class="data-card">
            <div class="data-card-top">
              <h3>${escapeHtml(t.name)}</h3>
              <span class="mini-tag tag-cn">${escapeHtml(t.src)}</span>
            </div>
            <p><strong style="color:var(--accent);">核心：</strong>${escapeHtml(t.core)}<br>
               <strong style="color:var(--gold);">论文用法：</strong>${escapeHtml(t.use)}<br>
               <span class="hint">选题示例：${escapeHtml(t.topic)}</span></p>
          </div>`).join('')}
      </div>
    </div>`).join('');
}

renderTheories();

/* ============ 工具函数 ============ */
function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (_) {}
  document.body.removeChild(ta);
}
