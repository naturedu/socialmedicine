# 普贤 (Puxian) · AI 学术检查助手

面向作者与编辑的 **AI 写作透明化工具**。让 AI 的使用「被看见」，而不是「被隐藏」。

## 功能

- **检测与润色工作台（核心）**：中 / English 一键切换。检测为 6 项指标加权打分（句长变异系数、套话密度、破折号密度、句首重复、用词多样性、冒号密度），每一项展示「你的值 / 参考区间 / 得分」，总分 100 可复核；页面附完整计分规则与已知局限说明（检测是概率性提示，不是结论）。润色做简洁化：标点规范、破折号统一、去冗余、长句提示，定位为写作质量工具，不针对任何 AI 检测器优化。
- **注册与登录（演示版）**：姓名、邮箱、验证码、机构。验证码为前端模拟，账号保存在浏览器本地；接真实后端需另配邮件服务与数据库。
- **披露声明生成器**：按工具、环节、参与程度生成中 / 英文披露声明草稿。
- **CSSCI 论文语料库（中英对照，100 篇）**：`papers.html`。《中国社会科学》《管理世界》《社会科学》2026 年最新三期，中文摘要与英文题名逐条对照，可按「中英对照 / 中文 / English」三态浏览、检索、筛选，一键「送入工作台」直接做中文或英文检测；首页工作台也提供「抽一条中文摘要 / 抽一条英文摘要」的随机取样。语料是检测的**输入素材**，不是范本，不提供全文下载。
- **可复用 Skill**：`skills/academic-copyediting-skill.md` 是一份可移植的「学术写作规范润色」提示词定义，可喂给任何大语言模型使用；定位为写作质量工具，明确不做检测器规避。

## 本地运行

纯静态页面，无构建步骤。直接打开 `index.html`，或用任意静态服务器：

```bash
python -m http.server 8000
# 或
npx serve .
```

## 部署到 GitHub Pages

1. 推送本仓库到 GitHub。
2. 仓库 Settings → Pages → Source 选 `main` 分支、`/ (root)`，保存。
3. 稍等片刻，访问 `https://<用户名>.github.io/<仓库名>/`。

## 语料库的生成与更新

```
python build_papers.py            # 读取抓取结果，生成 papers-data.js / data/papers.json / data/papers.md
```

- 数据源：**国家哲学社会科学文献中心**（ncpssd.org）公开题录，含题名、作者与单位、刊名年期、页码范围、关键词、中文摘要、英文题名，部分条目含英文摘要。
- 选取规则：三刊**最新一期全收** → 按同期往回补 → 最后一期按刊轮转补齐，收满 100 篇。
- 已剔除公告、启事、目录、更正等非论文条目。
- 字段：`journal / year / issue / authors / affils / title / titleEn / keywords / keywordsEn / abstract / abstractEn / pages / doi / url / cite`，`cite` 为可直接用的 GB/T 7714 著录。
- **著作权归原刊与作者**，本仓库仅存题录与摘要用于写作检测参照；如需全文请循原刊渠道。

## 定位与边界

本工具 **不** 提供：去 AI 水印、规避 AI 检测、把 AI 生成内容伪装成人类原创等功能。检测器是概率判断，存在误报；可靠的做法是保留来源信息、如实披露使用情况、做好人工把关。

## 技术栈

原生 HTML / CSS / JavaScript，无依赖，无构建。

## 引用与署名 / Citation

本工具免费开源（MIT）。若在论文或报告中使用了本工具，请按以下格式引用：

中文：杜思娴. 普贤（Puxian）：AI 学术检查助手 [EB/OL]. (2026). https://naturedu.github.io/tracehonest/.

English: Du, S. (2026). *Puxian: An AI academic transparency assistant* [Web application]. https://naturedu.github.io/tracehonest/.

作者 / Author：杜思娴 (Du Sixian) · dusixian16@163.com
