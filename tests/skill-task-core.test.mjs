import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveSkillContext, resolveMarkdownLinks, buildSkillTask} from '../skill-task-core.mjs';

const siteRoot = 'https://naturedu.github.io/socialmedicine/';
const catalog = {
  socialmedicineskills: {id: 'socialmedicineskills', label: '社医卫管', file: 'skills/socialmedicineskills.md', guide: 'guides/socialmedicineskills.html'},
  'custom-skill': {id: 'custom-skill', file: 'skills/renamed.md', guide: 'guides/renamed.html'},
};

test('matches catalog file/guide exactly, not a guessed slug', () => {
  assert.deepEqual(resolveSkillContext('guides/renamed.html?view=all#section', siteRoot, catalog), {id: 'custom-skill'});
  assert.deepEqual(resolveSkillContext('skills/renamed.md', new URL(siteRoot), catalog), {id: 'custom-skill'});
  assert.equal(resolveSkillContext('guides/custom-skill.html', siteRoot, catalog), null);
});

test('nested clinical references become main-skill context, with a finite whitelist', () => {
  const expected = {id: 'socialmedicineskills', contextFile: 'skills/references/clinical-methods.md', contextLabel: '医学与卫管方法扩展'};
  assert.deepEqual(resolveSkillContext(siteRoot + 'guides/references/clinical-methods.html#A11', siteRoot, catalog), expected);
  assert.deepEqual(resolveSkillContext('skills/references/clinical-methods.md', siteRoot, catalog), expected);
  assert.equal(resolveSkillContext('guides/references/private-notes.html', siteRoot, catalog), null);
  assert.equal(resolveSkillContext('guides/references/clinical-methods.html', siteRoot, {}), null);
  assert.equal(resolveSkillContext('skills/methods-89.md', siteRoot, catalog)?.contextFile, 'skills/methods-89.md');
});

test('rejects cross-origin and outside-root lookalikes', () => {
  for (const href of [
    'https://example.org/socialmedicine/guides/renamed.html',
    'https://naturedu.github.io/another/guides/renamed.html',
    '../guides/renamed.html',
    'javascript:alert(1)',
  ]) assert.equal(resolveSkillContext(href, siteRoot, catalog), null);
});

test('whitelisted reference files actually exist in the public source tree', () => {
  for (const slug of ['advanced-methods', 'bibliometrics', 'catalog-location', 'clinical-methods', 'evidence-workflow', 'journal-selection', 'journal-writing', 'method-authorities', 'methods-54', 'microsimulation-methods', 'microsimulation-sources', 'policy-and-grants', 'policy-timeline-publishing', 'public-topics', 'research-record-curation', 'visual-skill-sources']) {
    const resolved = resolveSkillContext(`guides/references/${slug}.html`, siteRoot, catalog);
    assert.ok(readFileSync(new URL('../' + resolved.contextFile, import.meta.url), 'utf8').length > 0);
  }
});

test('rewrites ordinary relative links, preserving labels, titles and absolute links', () => {
  const source = siteRoot + 'skills/references/clinical-methods.md';
  const text = '[上级](../method-map.md) [本节](#case) [带标题](./methods-54.md "手册") [官网](https://example.org/a) [空格](<../a b.md>)';
  const result = resolveMarkdownLinks(text, source);
  assert.equal(result, `[上级](${siteRoot}skills/method-map.md) [本节](${source}#case) [带标题](${siteRoot}skills/references/methods-54.md "手册") [官网](https://example.org/a) [空格](<${siteRoot}skills/a%20b.md>)`);
  assert.equal(resolveMarkdownLinks('[无来源](./file.md)', undefined), '[无来源](./file.md)');
});

test('does not rewrite images, fenced or inline code, escaped or reference-style links', () => {
  const protectedText = '![图](image.svg)\n`[代码](./code.md)`\n``[内含`代码](../code.md)``\n\\[转义](./x.md)\n[参考][ref]\n[ref]: ./file.md\n```md\n[围栏](./code.md)\n```\n~~~\n[另一个围栏](./code.md)\n~~~\n';
  assert.equal(resolveMarkdownLinks(protectedText, siteRoot + 'skills/main.md'), protectedText);
});

test('keeps full main/reference/method content, including long tails and structured fields', () => {
  const mainText = '主正文开头\n' + '主说明'.repeat(12000) + '\n主正文结尾';
  const contextText = '参考开头\n' + '上下文'.repeat(12000) + '\n参考结尾';
  const content = '方法开头\n' + '方法'.repeat(12000) + '\n方法结尾';
  const method = {id: 'A11', name: '病例交叉', question: '研究问题原文', data: {unit: '人', fields: ['时间', '暴露']}, content, report: ['效应', '区间'], pitfall: '时间混杂', source: 'skills/references/clinical-methods.md'};
  const task = buildSkillTask({info: catalog.socialmedicineskills, platformLabel: 'Codex', mainText, contextText, contextLabel: '临床方法', contextFile: method.source, method, siteRoot});
  assert.ok(task.includes(mainText)); assert.ok(task.includes(contextText)); assert.ok(task.includes(content));
  assert.ok(task.includes(JSON.stringify(method.data, null, 2)));
  assert.ok(task.includes(JSON.stringify(method.report, null, 2)));
  assert.ok(task.includes('A11 · 病例交叉')); assert.ok(task.includes('时间混杂'));
  assert.ok(task.includes('来源：' + siteRoot + catalog.socialmedicineskills.file));
  assert.equal(task.split('来源：' + siteRoot + method.source).length - 1, 2);
});

test('each block resolves links against its own true source', () => {
  const task = buildSkillTask({info: catalog.socialmedicineskills, mainText: '[框架](method-map.md)', contextText: '[手册](methods-54.md)', contextFile: 'skills/references/clinical-methods.md', method: {name: '说明', content: '[入口](../methods.html)', source: 'guides/medical-ai-evaluation-skill.html'}, siteRoot});
  for (const path of ['skills/method-map.md', 'skills/references/methods-54.md', 'methods.html']) assert.ok(task.includes(siteRoot + path));
});

test('missing source/body never fabricates a file or claims to provide a complete document', () => {
  const task = buildSkillTask({info: {id: 'unknown'}, contextFile: 'skills/references/clinical-methods.md', method: {id: 'X1', name: '只有名称'}, siteRoot});
  assert.ok(task.includes('主 Skill 正文未提供'));
  assert.ok(task.includes('不构成完整的主 Skill 文档'));
  assert.ok(task.includes('参考正文未提供'));
  assert.ok(task.includes('未提供可用的公开源文件地址'));
  assert.ok(!task.includes('/skills/unknown.md'));
  assert.ok(!task.includes('【Skill完整说明】'));
  assert.ok(!buildSkillTask({info: {file: 'file:///private/main.md'}, mainText: '已有正文', siteRoot}).includes('file:///'));
});
