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
  const lang = $('.tab.active').dataset.lang;
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

$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
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

/* ============ 4. 中文学术排版润色助手 ============ */
const redundantRules = [
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

function normalizePunct(text) {
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
  // 全角字母数字 → 半角
  out = out.replace(/[\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]/g, (m) => {
    changed++;
    return String.fromCharCode(m.charCodeAt(0) - 0xfee0);
  });
  return { text: out, changed };
}

function normalizeDash(text) {
  let changed = 0;
  let out = text
    .replace(/--/g, () => { changed++; return '——'; })
    .replace(/(?<!—)—(?!—)/g, () => { changed++; return '——'; });
  return { text: out, changed };
}

function applyRedundant(text) {
  const suggestions = [];
  let out = text;
  for (const rule of redundantRules) {
    const matches = out.match(rule.re);
    if (matches) {
      suggestions.push({
        from: matches[0],
        to: matches[0].replace(rule.re, rule.to),
        note: rule.note,
        count: matches.length,
      });
      out = out.replace(rule.re, rule.to);
    }
  }
  return { text: out, suggestions };
}

function sentenceStats(text) {
  const sentences = text.split(/[。！？!?]+/).map((s) => s.trim()).filter(Boolean);
  const long = sentences.filter((s) => s.length > 60);
  const total = sentences.length;
  const avg = total ? Math.round(sentences.reduce((a, s) => a + s.length, 0) / total) : 0;
  return { sentences, long, total, avg };
}

$('#polishRun').addEventListener('click', () => {
  const raw = $('#polishInput').value;
  const out = $('#polishOutput');
  const statsEl = $('#polishStats');
  if (!raw.trim()) {
    out.innerHTML = '<p class="report-empty">请先粘贴文本。</p>';
    statsEl.hidden = true;
    return;
  }

  const doPunct = $('#optPunct').checked;
  const doDash = $('#optDash').checked;
  const doRedundant = $('#optRedundant').checked;

  let text = raw;
  let changes = [];
  let totalChanges = 0;

  if (doPunct) {
    const r = normalizePunct(text);
    text = r.text;
    if (r.changed) { changes.push(`全半角标点 / 字母数字规范化：${r.changed} 处`); totalChanges += r.changed; }
  }
  if (doDash) {
    const r = normalizeDash(text);
    text = r.text;
    if (r.changed) { changes.push(`破折号统一为「——」：${r.changed} 处`); totalChanges += r.changed; }
  }

  let suggestions = [];
  if (doRedundant) {
    const r = applyRedundant(text);
    text = r.text;
    suggestions = r.suggestions;
    totalChanges += suggestions.reduce((a, s) => a + s.count, 0);
    if (suggestions.length) changes.push(`去冗余表达：${suggestions.reduce((a, s) => a + s.count, 0)} 处`);
  }

  const stats = sentenceStats(text);

  let html = '<h3>规范化结果</h3>';
  if (totalChanges === 0 && !stats.long.length) {
    html += '<p style="color:var(--ok);">未发现需要调整的常见问题，文本已经比较规范。</p>';
  } else {
    if (changes.length) html += `<h4>已应用的调整</h4><ul>${changes.map((c) => `<li>${c}</li>`).join('')}</ul>`;
    if (stats.long.length) html += `<h4>长句提示（${stats.long.length} 句，建议拆分）</h4><ul>${stats.long.slice(0, 5).map((s) => `<li>${escapeHtml(s.length > 40 ? s.slice(0, 40) + '…' : s)}</li>`).join('')}</ul>`;
  }

  if (suggestions.length) {
    html += '<hr class="rule"><h4>去冗余建议</h4>';
    html += suggestions.map((s) => `
      <div class="suggestion">
        <div><span class="from">${escapeHtml(s.from)}</span> → <span class="to">${escapeHtml(s.to)}</span></div>
        <div class="note">${escapeHtml(s.note)}（${s.count} 处）</div>
      </div>`).join('');
  }

  html += '<hr class="rule"><h4>结果</h4><p class="output-text">' + escapeHtml(text) + '</p>';
  html += '<div class="btn-row" style="margin-top:14px;"><button type="button" class="btn btn-primary" id="copyPolish">复制结果</button></div>';

  out.innerHTML = html;
  $('#copyPolish').addEventListener('click', () => { copyText(text); $('#copyPolish').textContent = '已复制 ✓'; });

  statsEl.hidden = false;
  statsEl.innerHTML = `
    <div class="stat"><b>${text.length}</b><span>规范化后字符数</span></div>
    <div class="stat"><b>${stats.total}</b><span>句子数</span></div>
    <div class="stat"><b>${stats.avg}</b><span>平均句长（字）</span></div>
    <div class="stat"><b>${totalChanges}</b><span>调整处数</span></div>
  `;

  window.__polishText = text;
});

$('#polishClear').addEventListener('click', () => {
  $('#polishInput').value = '';
  $('#polishOutput').innerHTML = '<p class="report-empty">粘贴文本后点击「分析并规范化」，结果与修改建议会显示在这里。</p>';
  $('#polishStats').hidden = true;
});

/* ============ 5. AI 痕迹风险提示（本地启发式，概率性） ============ */
const aiPhrases = [
  '值得注意的是', '需要指出的是', '需要强调的是', '综上所述', '总而言之', '总的来说',
  '不难发现', '由此可见', '换句话说', '换言之', '一般来说', '众所周知', '首先，', '其次，',
  '再次，', '最后，', '此外，', '与此同时', '值得关注的是', '这意味着', '从这个意义上说',
  '进一步地', '更进一步', '基于上述', 'It is important to note', 'Moreover', 'Furthermore',
  'In addition', 'In conclusion', 'Overall', 'It is worth noting',
];

function detectMetrics(text) {
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
  for (const p of aiPhrases) {
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

$('#detectRun').addEventListener('click', () => {
  const raw = $('#detectInput').value;
  const out = $('#detectOutput');
  if (raw.trim().length < 60) {
    out.innerHTML = '<p class="report-empty">文本太短，难以给出有意义的提示。请粘贴至少 60 字（建议 300 字以上，结果更稳定）。</p>';
    return;
  }

  const m = detectMetrics(raw);

  let score = 0;
  const notes = [];

  if (m.cv < 0.35) { score += 25; notes.push('句长非常均匀（变异系数 ' + m.cv.toFixed(2) + '），是常见的 AI 文本特征之一；人类写作句长通常起伏更大。'); }
  else if (m.cv < 0.5) { score += 15; notes.push('句长较均匀（变异系数 ' + m.cv.toFixed(2) + '），略偏 AI 风格。'); }
  else if (m.cv < 0.65) { score += 5; notes.push('句长有一定起伏，接近常见人类写作。'); }
  else { notes.push('句长起伏明显，这一项不指向 AI。'); }

  const phraseDensity = m.per1k(m.phraseHits);
  score += Math.min(30, phraseDensity * 12);
  if (m.phraseHits > 0) {
    notes.push('命中 ' + m.phraseHits + ' 处高频套话（如「' + m.phraseTypes.slice(0, 3).join('」「') + '」等），密度约 ' + phraseDensity + ' 处/千字。');
  }

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
    <h3>痕迹风险提示</h3>
    <p><span class="badge ${cls}">风险 ${band} · 启发式得分 ${score}/100</span></p>
    <p>${explain}</p>
    <h4>观察到的情况</h4>
    <ul>${notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('') || '<li>无明显异常特征。</li>'}</ul>
    <h4>基本指标</h4>
    <ul>
      <li>文本长度：${m.total} 字符 · ${m.sentences} 句</li>
      <li>平均句长：${m.avg.toFixed(1)} 字（标准差 ${m.sd.toFixed(1)}，变异系数 ${m.cv.toFixed(2)}）</li>
      <li>用词多样性（去重字/汉字数）：${(m.uniqueRatio * 100).toFixed(1)}%</li>
      <li>套话密度：${phraseDensity} 处/千字 · 破折号密度：${dashDensity} 处/千字 · 冒号密度：${m.per1k(m.colons)} 处/千字</li>
    </ul>
    <hr class="rule">
    <p style="color:var(--ink-faint);font-size:13px;">
      重要说明：以上为本地启发式特征统计，<strong>不是 AI 检测结论</strong>，存在误报与漏报，不能用于认定作者是否使用 AI。
      本工具刻意不提供「改写直到分数降低」的功能；若你在写作中使用了 AI，建议使用上方「披露声明生成器」如实说明。
    </p>
  `;
});

/* ============ 工具函数 ============ */
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
