// Portable task composition only: no fetching, tracking, model calls, or private input.
const REFERENCE_LABELS = {
  'advanced-methods': '进阶研究方法',
  bibliometrics: '文献计量口径',
  'catalog-location': '资源目录',
  'clinical-methods': '医学与卫管方法扩展',
  'evidence-workflow': '证据与语料工作流',
  'journal-selection': '选刊流程与边界',
  'journal-writing': '期刊写作模式',
  'method-authorities': '方法来源对应表',
  'methods-54': '原有方法参考手册',
  'microsimulation-methods': '微观模拟方法',
  'microsimulation-sources': '微观模拟来源',
  'policy-and-grants': '政策与项目口径',
  'policy-timeline-publishing': '政策时间线与公众图文',
  'public-topics': '公开主题库',
  'research-record-curation': '研究记录压缩与方法沉淀',
  'visual-skill-sources': '科研视觉方法来源',
};

function siteBase(root) {
  try {
    const url = new URL(root);
    if (!['http:', 'https:', 'file:'].includes(url.protocol)) return null;
    url.search = ''; url.hash = '';
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url;
  } catch { return null; }
}

function sameSitePath(value, base) {
  try {
    const url = new URL(value, base);
    return url.protocol === base.protocol && url.origin === base.origin &&
      url.pathname.startsWith(base.pathname) ? url.pathname : null;
  } catch { return null; }
}

export function resolveSkillContext(href, root, catalog) {
  const base = siteBase(root);
  if (!base || !catalog || typeof catalog !== 'object') return null;
  const path = sameSitePath(href, base);
  if (!path) return null;
  for (const [id, info] of Object.entries(catalog)) {
    if (!info || typeof info !== 'object') continue;
    if ([info.file, info.guide].some(file => typeof file === 'string' &&
        file && sameSitePath(file, base) === path)) return {id};
  }
  if (!Object.hasOwn(catalog, 'socialmedicineskills')) return null;
  for (const [slug, label] of Object.entries(REFERENCE_LABELS)) {
    const file = `skills/references/${slug}.md`;
    if ([file, `guides/references/${slug}.html`].some(value =>
      sameSitePath(value, base) === path)) {
      return {id: 'socialmedicineskills', contextFile: file, contextLabel: label};
    }
  }
  if (['skills/methods-89.md', 'guides/methods-89.html'].some(value =>
    sameSitePath(value, base) === path)) {
    return {id: 'socialmedicineskills', contextFile: 'skills/methods-89.md', contextLabel: '原有方法与代码手册'};
  }
  return null;
}

function publicSource(file, root) {
  if (typeof file !== 'string' || !file.trim()) return null;
  try {
    const url = new URL(file, siteBase(root) || undefined);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function rewriteOrdinaryLinks(text, source) {
  // Conservative inline-link grammar: leave images, escaped links, reference-style
  // links, and complex unbracketed destinations intact instead of corrupting them.
  return text.replace(/(?<!!)(?<!\\)(\[[^\]\n]+\]\()([ \t]*)(<[^>\n]*>|[^\s()<>]+)((?:[ \t]+(?:"[^"\n]*"|'[^'\n]*'))?[ \t]*\))/g,
    (whole, label, space, destination, suffix) => {
      const angled = destination.startsWith('<');
      const target = angled ? destination.slice(1, -1) : destination;
      if (!target || /\\|[\u0000-\u001f]/.test(target) || /^[a-z][a-z0-9+.-]*:/i.test(target)) return whole;
      try {
        const url = new URL(target, source);
        if (!['http:', 'https:'].includes(url.protocol)) return whole;
        const absolute = angled ? `<${url.href}>` : url.href.replace(/\(/g, '%28').replace(/\)/g, '%29');
        return label + space + absolute + suffix;
      } catch { return whole; }
    });
}

function outsideInlineCode(text, source) {
  let output = '', cursor = 0;
  const runs = /`+/g;
  let opening;
  while ((opening = runs.exec(text))) {
    let close = text.indexOf(opening[0], runs.lastIndex);
    while (close !== -1 && (text[close - 1] === '`' || text[close + opening[0].length] === '`')) {
      close = text.indexOf(opening[0], close + 1);
    }
    if (close === -1) continue;
    output += rewriteOrdinaryLinks(text.slice(cursor, opening.index), source);
    cursor = close + opening[0].length;
    output += text.slice(opening.index, cursor);
    runs.lastIndex = cursor;
  }
  return output + rewriteOrdinaryLinks(text.slice(cursor), source);
}

export function resolveMarkdownLinks(text, sourceUrl) {
  if (typeof text !== 'string') return '';
  const source = publicSource(sourceUrl);
  if (!source) return text;
  let output = '', pending = '', fence = null;
  for (const line of text.match(/[^\n]*(?:\n|$)/g).filter(Boolean)) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(line);
    if (fence) {
      output += line;
      if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
    } else if (marker) {
      output += outsideInlineCode(pending, source) + line; pending = '';
      fence = {char: marker[1][0], length: marker[1].length};
    } else pending += line;
  }
  return output + outsideInlineCode(pending, source);
}

const hasText = value => typeof value === 'string' && value.trim().length > 0;
function fieldText(value) {
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
}
const sourceNote = source => source ? `来源：${source}` : '来源：未提供可用的公开源文件地址；不推测出处。';

export function buildSkillTask({info = {}, platformLabel = '未指定平台', mainText, contextText, contextLabel, contextFile, method, siteRoot} = {}) {
  const parts = [
    `请使用“${info.label || info.id || '研究方法'}”协助开展研究。目标平台：${platformLabel}。`,
    '研究问题、数据版本、变量定义与交付物需由使用者另行补充。先核对适用条件，不补造样本、文献或结果。以下仅整理已提供的公开说明，不表示已读取外部链接全文，也不表示目标平台已经执行。',
  ];
  const mainSource = publicSource(info.file, siteRoot);
  if (hasText(mainText)) {
    parts.push('【主 Skill 正文】\n' + resolveMarkdownLinks(mainText, mainSource) + '\n\n' + sourceNote(mainSource));
  } else {
    parts.push('【主 Skill 正文未提供】\n以下可用信息不构成完整的主 Skill 文档。\n' + sourceNote(mainSource));
  }
  if (hasText(contextText) || contextFile || contextLabel) {
    const source = publicSource(contextFile, siteRoot);
    const body = hasText(contextText) ? resolveMarkdownLinks(contextText, source) : '参考正文未提供；仅列出可用出处，不表示已经阅读。';
    parts.push(`【参考上下文：${contextLabel || '所选参考材料'}】\n${body}\n\n${sourceNote(source)}`);
  }
  if (method && typeof method === 'object') {
    const source = publicSource(method.source, siteRoot);
    const heading = [method.id, method.name].map(fieldText).filter(Boolean).join(' · ') || '所选方法';
    const fields = [['研究问题', method.question], ['数据要求', method.data], ['方法正文', method.content], ['报告重点', method.report], ['常见误区', method.pitfall]];
    const body = fields.map(([label, value]) => [label, fieldText(value)]).filter(([, value]) => hasText(value))
      .map(([label, value]) => `${label}：\n${resolveMarkdownLinks(value, source)}`).join('\n\n');
    parts.push(`【方法上下文：${heading}】\n${body || '尚未提供方法正文或说明字段。'}\n\n${sourceNote(source)}`);
  }
  return parts.join('\n\n');
}
