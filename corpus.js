/* corpus.js —— 把「CSSCI 语料库」接进检测工作台（中 / English 两条路径）
   两个入口：
   1) 从 papers.html 跳转而来：index.html?feed=1&lang=zh|en#workbench
      正文优先取自 sessionStorage（无长度限制），取不到再退回 URL 的 q 参数。
   2) 页内「抽一条中文摘要 / 抽一条英文摘要」按钮：按需懒加载 papers-data.js，
      随机取一条语料填进输入框并直接触发检测。 */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  var data = null;
  try { data = JSON.parse(sessionStorage.getItem('px-feed') || 'null'); } catch (e) { data = null; }
  var incoming = params.get('feed')
    ? { text: (data && data.text) || params.get('q') || '', lang: (data && data.lang) || params.get('lang') || 'zh', meta: data }
    : null;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ---------- 载入语料（懒加载，不用就不下载） ---------- */
  var loading = false, queue = [];
  function withPapers(cb) {
    if (window.PAPERS && window.PAPERS.length) return cb(window.PAPERS);
    queue.push(cb);
    if (loading) return;
    loading = true;
    var s = document.createElement('script');
    s.src = 'papers-data.js';
    s.onload = function () { loading = false; var q = queue; queue = []; q.forEach(function (f) { f(window.PAPERS || []); }); };
    s.onerror = function () { loading = false; queue = []; toast('语料库加载失败，请刷新重试'); };
    document.body.appendChild(s);
  }

  /* ---------- 往工作台投喂文本 ---------- */
  function feed(text, lang, note) {
    if (!text) return;
    var tab = document.querySelector('#langTabs .tab[data-lang="' + lang + '"]');
    if (tab) tab.click();
    var ta = document.getElementById('wbInput');
    if (!ta) return;
    ta.value = text;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    if (note) {
      var out = document.getElementById('wbOutput');
      if (out) {
        var tip = out.parentNode.querySelector('.corpus-note');
        if (!tip) {
          tip = document.createElement('p');
          tip.className = 'hint corpus-note';
          out.parentNode.insertBefore(tip, out);
        }
        tip.textContent = note;
      }
    }
    var btn = document.getElementById('wbDetect');
    if (btn) btn.click();
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = 'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);' +
      'background:#1f1d1a;color:#fff;padding:10px 20px;border-radius:999px;font-size:13.5px;z-index:99;';
    document.body.appendChild(el);
    setTimeout(function () { el.remove(); }, 2000);
  }

  ready(function () {
    /* 1) 外部跳转进来的文本 */
    if (incoming && incoming.text) {
      try { sessionStorage.removeItem('px-feed'); } catch (e) { }
      var meta = incoming.meta;
      var note = '';
      if (meta && meta.title) {
        note = '来源：《' + meta.journal + '》' + meta.title;
        if (meta.note) note += ' —— ' + meta.note;
      }
      setTimeout(function () {
        feed(incoming.text, incoming.lang, note);
        var wb = document.getElementById('workbench');
        if (wb) wb.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 90);
    }

    /* 2) 页内抽一条语料 */
    function sample(want) {
      withPapers(function (list) {
        if (!list.length) return;
        // 英文抽取优先选「有英文摘要」的条目，实在没有才退回英文题名
        var pool;
        if (want === 'en') {
          pool = list.filter(function (p) { return p.abstractEn && p.abstractEn.length > 200; });
          if (!pool.length) pool = list.filter(function (p) { return p.titleEn; });
        } else {
          pool = list.filter(function (p) { return p.abstract; });
        }
        if (!pool.length) pool = list;
        var p = pool[Math.floor(Math.random() * pool.length)];
        var text = want === 'en'
          ? (p.abstractEn || p.titleEn)
          : (p.abstract || p.title);
        var note = '语料：《' + p.journal + '》' + p.year + ' 年第 ' + p.issue + ' 期 · ' + p.title;
        if (want === 'en' && !p.abstractEn) note += '（本条仅有英文题名，检测只反映标题层面）';
        feed(text, want, note);
      });
    }

    var bz = document.getElementById('sampleZh');
    var be = document.getElementById('sampleEn');
    if (bz) bz.addEventListener('click', function () { sample('zh'); });
    if (be) be.addEventListener('click', function () { sample('en'); });
  });
})();
