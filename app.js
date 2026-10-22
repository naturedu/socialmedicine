'use strict';

/* ============ 通用 ============ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

document.getElementById('year').textContent = new Date().getFullYear();

/* ============ 0. 注册与登录（演示：本地模拟验证码与账号） ============ */
const AUTH_KEY = 'tracehonest-account';
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

/* ============ 2. 检测与润色工作台（中 / English） ============ */
let wbLang = 'zh';

$$('#langTabs .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('#langTabs .tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    wbLang = tab.dataset.lang;
    $('#wbInputLabel').textContent = wbLang === 'zh' ? '原文（中文）' : 'Original text (English)';
    $('#wbInput').placeholder = wbLang === 'zh' ? '粘贴需要检测或润色的文本（建议 300 字以上，结果更稳定）…' : 'Paste the text to analyze or polish (300+ characters recommended)…';
    $('#wbOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「检测痕迹」或「简洁化润色」。</p>';
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

/* ---- 润色按钮 ---- */
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

$('#wbPolish').addEventListener('click', () => {
  const raw = $('#wbInput').value;
  const out = $('#wbOutput');
  if (!raw.trim()) {
    out.innerHTML = '<p class="report-empty">请先粘贴文本。</p>';
    return;
  }

  if (wbLang === 'zh') {
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
    html += '<div class="btn-row" style="margin-top:14px;"><button type="button" class="btn btn-primary" id="wbCopy">复制结果</button></div>';
    out.innerHTML = html;
    $('#wbCopy').addEventListener('click', () => { copyText(text); $('#wbCopy').textContent = '已复制 ✓'; });
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
    html += '<div class="btn-row" style="margin-top:14px;"><button type="button" class="btn btn-primary" id="wbCopy">Copy result</button></div>';
    out.innerHTML = html;
    $('#wbCopy').addEventListener('click', () => { copyText(r.text); $('#wbCopy').textContent = 'Copied ✓'; });
  }
});

$('#wbClear').addEventListener('click', () => {
  $('#wbInput').value = '';
  $('#wbOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「检测痕迹」或「简洁化润色」。检测报告会给出分项打分表。</p>';
});

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
