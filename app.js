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

/* ============ 1. 透明化自检 ============ */
const usageLabels = {
  brainstorm: '头脑风暴 / 选题',
  outline: '拟定大纲',
  draft: '撰写初稿',
  rewrite: '改写 / 扩写',
  polish: '润色 / 校对',
  translate: '翻译',
  code: '代码 / 脚本',
  data: '数据整理 / 分析',
  image: '生成图片 / 图表',
};

function computeDisclosureLevel(usages, involvement) {
  let score = 0;
  if (usages.includes('draft') || usages.includes('image')) score += 3;
  if (usages.includes('rewrite') || usages.includes('translate') || usages.includes('code') || usages.includes('data')) score += 2;
  if (usages.includes('outline') || usages.includes('brainstorm') || usages.includes('polish')) score += 1;
  if (involvement === 'high') score += 2;
  else if (involvement === 'mid') score += 1;

  if (score >= 5) return { level: 'high', label: '需充分披露', cls: 'badge-high' };
  if (score >= 3) return { level: 'mid', label: '建议披露', cls: 'badge-mid' };
  return { level: 'low', label: '可简要说明', cls: 'badge-low' };
}

$('#checkForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const usages = $$('input[name="usage"]:checked').map((i) => i.value);
  const involvement = $('input[name="involvement"]:checked').value;
  const humanReview = $('#humanReview').checked;

  const body = $('#reportBody');
  const empty = $('#reportEmpty');
  empty.hidden = true;
  body.hidden = false;

  const level = computeDisclosureLevel(usages, involvement);
  const invLabel = { low: '仅辅助参考', mid: '部分参与', high: '主要参与' }[involvement];

  const lines = usages.length ? usages.map((u) => `<li>${usageLabels[u]}</li>`).join('') : '<li>未选择（视为未使用 AI）</li>';

  body.innerHTML = `
    <h3>透明化报告</h3>
    <p><span class="badge ${level.cls}">${level.label}</span></p>
    <h4>你使用了 AI 的环节</h4>
    <ul>${lines}</ul>
    <h4>人工参与程度</h4>
    <p>${invLabel}${humanReview ? ' · 已做事实核查与人工修订' : ' · 尚未完成人工核查（建议完成后再提交）'}</p>
    <hr class="rule">
    <h4>建议向读者 / 编辑说明的内容</h4>
    <p>在「致谢」「方法」或投稿系统的 AI 使用声明栏中，写明：使用了什么工具、做了哪些事、人工如何把关。上方已为你生成一份可直接使用的披露声明草稿。</p>
    <p style="color:var(--ink-faint);font-size:13px;">本报告不是 AI 检测结果，不判断文本「是否为 AI 所写」，只帮你整理需要披露的信息。</p>
  `;
});

/* ============ 2. 披露声明生成器 ============ */
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

/* ============ 3. 编辑审阅清单 ============ */
const STORE_KEY = 'tracehonest-checklist';
const checklistBoxes = $$('#reviewChecklist input[type="checkbox"]');

function loadChecklist() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    checklistBoxes.forEach((box) => {
      const key = box.closest('.checklist-col').querySelector('h3').textContent + '|' + box.nextSibling.textContent.trim();
      box.checked = saved.includes(key);
    });
  } catch (_) {}
}
function saveChecklist() {
  const keys = checklistBoxes.filter((b) => b.checked).map((box) =>
    box.closest('.checklist-col').querySelector('h3').textContent + '|' + box.nextSibling.textContent.trim());
  localStorage.setItem(STORE_KEY, JSON.stringify(keys));
}
function updateProgress() {
  const total = checklistBoxes.length;
  const done = checklistBoxes.filter((b) => b.checked).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $('#progressText').textContent = `${done} / ${total} 项已完成`;
  $('#progressPct').textContent = `${pct}%`;
  $('#progressFill').style.width = `${pct}%`;
}
checklistBoxes.forEach((b) => b.addEventListener('change', () => { saveChecklist(); updateProgress(); }));
loadChecklist();
updateProgress();

/* ============ 4. 检测与润色工作台（中 / English） ============ */
let wbLang = 'zh';

$$('#langTabs .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('#langTabs .tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    wbLang = tab.dataset.lang;
    $('#wbInputLabel').textContent = wbLang === 'zh' ? '原文（中文）' : 'Original text (English)';
    $('#wbInput').placeholder = wbLang === 'zh' ? '粘贴需要检测或润色的中文文本…' : 'Paste the English text to analyze or polish…';
    $('#wbOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「检测痕迹」或「简洁化润色」。</p>';
  });
});

/* ---- 中文：检测 ---- */
const zhPhrases = [
  '值得注意的是', '需要指出的是', '需要强调的是', '综上所述', '总而言之', '总的来说',
  '不难发现', '由此可见', '换句话说', '换言之', '一般来说', '众所周知', '首先，', '其次，',
  '再次，', '最后，', '此外，', '与此同时', '值得关注的是', '这意味着', '从这个意义上说',
  '进一步地', '更进一步', '基于上述',
];

function zhMetrics(text) {
  const sentences = text.split(/[。！？!?；;\n]+/).map((s) => s.trim()).filter((s) => s.length > 1);
  const lens = sentences.map((s) => s.length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
  const cv = avg ? sd / avg : 0;

  const hanzi = text.replace(/[^\u4e00-\u9fff]/g, '');
  const uniqueRatio = hanzi.length ? new Set(hanzi).size / hanzi.length : 0;

  const per1k = (n) => Math.round((n / Math.max(text.length, 1)) * 1000);

  let phraseHits = 0;
  const phraseTypes = [];
  for (const p of zhPhrases) {
    const m = text.split(p).length - 1;
    if (m > 0) { phraseHits += m; phraseTypes.push(p); }
  }

  const dashes = (text.match(/——|—|–/g) || []).length;
  const colons = (text.match(/：|:/g) || []).length;

  const starters = sentences.map((s) => s.slice(0, 2));
  const starterCounts = {};
  starters.forEach((st) => { starterCounts[st] = (starterCounts[st] || 0) + 1; });
  const repeatedStarters = starters.filter((st) => starterCounts[st] > 1).length;
  const starterRep = starters.length ? repeatedStarters / starters.length : 0;

  return { total: text.length, sentences: sentences.length, avg, sd, cv, uniqueRatio, phraseHits, phraseTypes, dashes, colons, starterRep, per1k };
}

/* ---- English：检测 ---- */
const enPhrases = [
  'It is important to note', 'It is worth noting', 'Moreover', 'Furthermore', 'In addition',
  'In conclusion', 'Overall', 'Additionally', 'Notably', 'Undoubtedly', 'In summary',
  'It should be noted', 'As previously mentioned', 'Firstly', 'Secondly', 'Lastly',
  'delve into', 'tapestry', 'landscape', 'pivotal', 'crucial', 'robust', 'holistic',
  'seamless', 'leverage', 'utilize', 'facilitate', 'underscores', 'a testament to',
  "in today's fast-paced world", 'game-changer', 'cutting-edge',
];

function enMetrics(text) {
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 1);
  const lens = sentences.map((s) => s.split(/\s+/).filter(Boolean).length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
  const cv = avg ? sd / avg : 0;

  const words = text.split(/\s+/).filter(Boolean);
  const uniqueRatio = words.length ? new Set(words.map((w) => w.toLowerCase())).size / words.length : 0;

  const per1k = (n) => Math.round((n / Math.max(text.length, 1)) * 1000);

  const lower = text.toLowerCase();
  let phraseHits = 0;
  const phraseTypes = [];
  for (const p of enPhrases) {
    const m = lower.split(p.toLowerCase()).length - 1;
    if (m > 0) { phraseHits += m; phraseTypes.push(p); }
  }

  const dashes = (text.match(/—|–/g) || []).length;
  const colons = (text.match(/:/g) || []).length;

  const starters = sentences.map((s) => (s.split(/\s+/)[0] || '').toLowerCase()).filter(Boolean);
  const starterCounts = {};
  starters.forEach((st) => { starterCounts[st] = (starterCounts[st] || 0) + 1; });
  const repeatedStarters = starters.filter((st) => starterCounts[st] > 1).length;
  const starterRep = starters.length ? repeatedStarters / starters.length : 0;

  return { total: text.length, words: words.length, sentences: sentences.length, avg, sd, cv, uniqueRatio, phraseHits, phraseTypes, dashes, colons, starterRep, per1k };
}

/* ---- 中文：润色 ---- */
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

/* ---- English：润色 ---- */
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

/* ---- 工作台按钮 ---- */
function wbTooShort() {
  const min = wbLang === 'zh' ? 60 : 80;
  $('#wbOutput').innerHTML = wbLang === 'zh'
    ? '<p class="report-empty">文本太短，难以给出有意义的提示。请粘贴至少 60 字（建议 300 字以上）。</p>'
    : '<p class="report-empty">The text is too short for a meaningful reading. Please paste at least 80 characters (300+ recommended).</p>';
  void min;
}

$('#wbDetect').addEventListener('click', () => {
  const raw = $('#wbInput').value;
  const out = $('#wbOutput');
  if (raw.trim().length < 60) { wbTooShort(); return; }

  if (wbLang === 'zh') {
    const m = zhMetrics(raw);
    let score = 0;
    const notes = [];
    if (m.cv < 0.35) { score += 25; notes.push('句长非常均匀（变异系数 ' + m.cv.toFixed(2) + '），是常见的 AI 文本特征之一；人类写作句长通常起伏更大。'); }
    else if (m.cv < 0.5) { score += 15; notes.push('句长较均匀（变异系数 ' + m.cv.toFixed(2) + '），略偏 AI 风格。'); }
    else if (m.cv < 0.65) { score += 5; notes.push('句长有一定起伏，接近常见人类写作。'); }
    else { notes.push('句长起伏明显，这一项不指向 AI。'); }
    const phraseDensity = m.per1k(m.phraseHits);
    score += Math.min(30, phraseDensity * 12);
    if (m.phraseHits > 0) notes.push('命中 ' + m.phraseHits + ' 处高频套话（如「' + m.phraseTypes.slice(0, 3).join('」「') + '」等），密度约 ' + phraseDensity + ' 处/千字。');
    const dashDensity = m.per1k(m.dashes);
    score += Math.min(15, dashDensity * 4);
    if (dashDensity > 3) notes.push('破折号/连字符密度较高（' + dashDensity + ' 处/千字）。');
    if (m.starterRep > 0.4) { score += 15; notes.push('句首重复率高（' + Math.round(m.starterRep * 100) + '%），句式较单一。'); }
    else if (m.starterRep > 0.25) { score += 8; }
    if (m.uniqueRatio < 0.32) { score += 10; notes.push('用词重复度偏高。'); }
    score = Math.max(0, Math.min(100, Math.round(score)));

    let band, cls, explain;
    if (score >= 60) { band = '偏高'; cls = 'badge-high'; explain = '多项特征接近典型 AI 生成文本。请注意：这仍是概率提示，不构成认定。'; }
    else if (score >= 30) { band = '中等'; cls = 'badge-mid'; explain = '部分特征与 AI 文本有重叠，也可能只是规整的人类写作。'; }
    else { band = '较低'; cls = 'badge-low'; explain = '未发现明显指向 AI 的特征。'; }

    out.innerHTML = `
      <h3>痕迹风险提示（中文）</h3>
      <p><span class="badge ${cls}">风险 ${band} · 启发式得分 ${score}/100</span></p>
      <p>${explain}</p>
      <h4>观察到的情况</h4>
      <ul>${notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('') || '<li>无明显异常特征。</li>'}</ul>
      <h4>基本指标</h4>
      <ul>
        <li>文本长度：${m.total} 字符 · ${m.sentences} 句</li>
        <li>平均句长：${m.avg.toFixed(1)} 字（变异系数 ${m.cv.toFixed(2)}）</li>
        <li>用词多样性（去重字/汉字数）：${(m.uniqueRatio * 100).toFixed(1)}%</li>
        <li>套话密度：${phraseDensity} 处/千字 · 破折号：${dashDensity} 处/千字 · 冒号：${m.per1k(m.colons)} 处/千字</li>
      </ul>
      <hr class="rule">
      <p style="color:var(--ink-faint);font-size:13px;">重要说明：以上为本地启发式特征统计，<strong>不是 AI 检测结论</strong>，存在误报与漏报，不能用于认定作者是否使用 AI。本工具刻意不提供「改写直到分数降低」的功能。</p>
    `;
  } else {
    const m = enMetrics(raw);
    let score = 0;
    const notes = [];
    if (m.cv < 0.4) { score += 25; notes.push('Sentence lengths are very uniform (CV ' + m.cv.toFixed(2) + '), a common trait of AI text; human writing tends to vary more.'); }
    else if (m.cv < 0.55) { score += 15; notes.push('Sentence lengths are fairly uniform (CV ' + m.cv.toFixed(2) + ').'); }
    else if (m.cv < 0.7) { score += 5; }
    else { notes.push('Sentence length varies noticeably; this metric does not point to AI.'); }
    const phraseDensity = m.per1k(m.phraseHits);
    score += Math.min(30, phraseDensity * 12);
    if (m.phraseHits > 0) notes.push('Matched ' + m.phraseHits + ' stock phrases (e.g. "' + m.phraseTypes.slice(0, 3).join('", "') + '"), about ' + phraseDensity + ' per 1k chars.');
    const dashDensity = m.per1k(m.dashes);
    score += Math.min(15, dashDensity * 4);
    if (dashDensity > 3) notes.push('Em/en-dash density is high (' + dashDensity + ' per 1k chars).');
    if (m.starterRep > 0.4) { score += 15; notes.push('High rate of repeated sentence openers (' + Math.round(m.starterRep * 100) + '%).'); }
    else if (m.starterRep > 0.25) { score += 8; }
    if (m.uniqueRatio < 0.45) { score += 10; notes.push('Lexical diversity is on the low side.'); }
    score = Math.max(0, Math.min(100, Math.round(score)));

    let band, cls, explain;
    if (score >= 60) { band = 'Elevated'; cls = 'badge-high'; explain = 'Several features resemble typical AI-generated text. This remains a probabilistic hint, not a verdict.'; }
    else if (score >= 30) { band = 'Moderate'; cls = 'badge-mid'; explain = 'Some features overlap with AI text; could also be polished human writing.'; }
    else { band = 'Low'; cls = 'badge-low'; explain = 'No features clearly pointing to AI were found.'; }

    out.innerHTML = `
      <h3>Trace risk report (English)</h3>
      <p><span class="badge ${cls}">Risk: ${band} · heuristic score ${score}/100</span></p>
      <p>${explain}</p>
      <h4>Observations</h4>
      <ul>${notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('') || '<li>No notable anomalies.</li>'}</ul>
      <h4>Basic metrics</h4>
      <ul>
        <li>Length: ${m.total} characters · ${m.words} words · ${m.sentences} sentences</li>
        <li>Avg sentence length: ${m.avg.toFixed(1)} words (CV ${m.cv.toFixed(2)})</li>
        <li>Lexical diversity (unique words / total): ${(m.uniqueRatio * 100).toFixed(1)}%</li>
        <li>Stock phrases: ${phraseDensity}/1k · dashes: ${dashDensity}/1k · colons: ${m.per1k(m.colons)}/1k</li>
      </ul>
      <hr class="rule">
      <p style="color:var(--ink-faint);font-size:13px;">Important: this is a local heuristic analysis, <strong>not an AI-detection verdict</strong>; false positives and negatives occur. This tool deliberately offers no "rewrite until the score drops" feature.</p>
    `;
  }
});

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
  $('#wbOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「检测痕迹」或「简洁化润色」。</p>';
});

/* ============ 5. 工具箱面板切换 ============ */
$$('#toolTabs .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('#toolTabs .tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const tool = tab.dataset.tool;
    ['check', 'disclose', 'review'].forEach((k) => {
      $('#panel-' + k).hidden = k !== tool;
    });
  });
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
