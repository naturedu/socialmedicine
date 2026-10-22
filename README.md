# 普贤——社医卫管科研助手

**socialmedicine & healtheconomics** · 开源 · MIT

面向**社会医学与卫生事业管理 / 卫生经济学**研究者的开源科研工作台，像海浪一样温柔：从选题、方法学到投稿，按「产品模块」组织，每个模块能完成的事不同。

> 在线使用：<https://naturedu.github.io/socialmedicine/> ｜ 仓库：<https://github.com/naturedu/socialmedicine>

## 适合谁

- 社会医学与卫生事业管理、卫生经济学、卫生政策方向的**研究生与青年研究者**：选题、方法学速查、数据分析代码、投稿导航一条龙；
- 需要**可复现方法学模板**的课题组：每份 Skill 都是「方法 + Stata/R 代码」，可直接照做；
- 使用 AI 辅助写作、希望**如实披露**的作者：检测、润色与披露生成器配套。

## 设计理念

1. **透明可复核**：AI 检测每一项打分都有依据与参考区间；方法学代码可运行、可复现。
2. **每步方法 + 代码**：所有 Skill 遵循统一结构（用途 → 边界 → 方法 + 代码 → 错误清单 → 报告模板）。
3. **定位诚实**：不提供检测器规避、不伪装 AI 内容；方法是模板，结论由研究者负责。

## 产品模块总览

| 模块 | 能做什么 | 入口 |
| --- | --- | --- |
| 选题与基金 | 国自然 / 国社科 / 教育部 / 卫健委课题申报导航 + 选题三步法 | 首页「选题基金」 |
| AI 检测助手 | 6 项指标启发式打分（中 / English），可复核 | 首页「AI检测」 |
| 润色 | 独立写作质量模块：标点、破折号、去冗余、长句提示 | 首页「润色」 |
| 方法学 Skill 库 | 六大产品分组、10 份深度 Skill + 54 条速查手册 | 首页「方法学」 |
| 全球健康数据库 | GBD / WHO / 世界银行 / CHARLS 等 25 个数据源导航 | 首页「数据源」 |
| 顶刊查询 | 45+ 期刊（含中文核心）按方向筛选 | 首页「顶刊」 |
| CSSCI 语料库 | 100 篇中英对照题录与摘要，可送入工作台 | `papers.html` |
| 披露声明生成器 | 中 / English 披露草稿一键生成 | 首页「披露」 |

## 模块一 · 选题与基金（国自然等）

- **国家自然科学基金（NSFC）**：面上 / 青年 / 地区项目。社医卫管可投管理科学部（G04 宏观管理与政策、健康管理方向）或医学部（H30 预防医学下属卫生管理与政策方向）；年龄与限项规定以当年指南为准。
- **国家社会科学基金**：年度项目（重点/一般/青年）、西部项目；社会学、人口学、应用经济（健康经济）、管理学（卫生管理）均可申报。
- **教育部人文社会科学**：规划基金 / 青年基金 / 专项，周期短、结项灵活。
- **行业与省级课题**：国家卫健委委托课题、省卫健委软科学、省医保局课题、省社科基金。
- **选题三步法**：① 找缺口（顶刊综述的 future research）→ ② 定问题（PICO / 组态视角）→ ③ 配方法（用 socialmedicineskills 速查手册按数据形态选方法、写技术路线）。

## 模块二 · AI 检测助手

6 项指标加权打分（总分 100）：句长变异系数（25）、高频套话密度（30）、破折号密度（15）、句首重复率（15）、用词多样性（10）、冒号密度（仅展示）。每一项展示「你的值 / 参考区间 / 得分」，完整计分规则公开在页面内。

**已知局限（如实说明）**：本地启发式统计，不是「水印验证」；存在误报与漏报，不能用于认定作者身份。本工具刻意不提供「改写直到分数降低」的功能。

## 模块三 · 润色（独立模块）

与检测分开的写作质量工具：全半角标点规范化、破折号统一、去冗余表达、长句提示。**不针对任何 AI 检测器优化**，不修改事实与引用。完整规则见 [skills/academic-copyediting-skill.md](skills/academic-copyediting-skill.md)。

## 模块四 · 方法学 Skill 库（核心）

### 六大产品分组

| 分组 | 英文关键词 | 内容 |
| --- | --- | --- |
| 卫生经济学方法 | health economics skills | CEA/CUA 教程、DCE 设计助手、Markov 模型助手 |
| 社医理论与定性 | medicine theory skills | 扎根理论 / SEM / 多层SEM / fsQCA 专题 + 理论框架 F 类（Andersen、Grossman、TPB 等 10 个） |
| 政策评估与因果 | policy & causal skills | DID、ITS、DDD + 因果推断 D 类速查（PSM/IV/RDD/SCM） |
| 数据科学与预测 | data & ML skills | 机器学习（LASSO/RF/XGBoost/SHAP）+ E 类速查 |
| 统计与研究设计 | stats & design skills | Meta 分析 + A/B 类速查（研究设计、统计分析 18 个方法） |
| 写作与润色 | writing skills | 学术写作规范润色 |

### 10 份深度 Skill

| Skill | 文件 | 覆盖内容（每步方法 + 代码） |
| --- | --- | --- |
| 卫生经济学评价教程 | [health-economics-tutorial-skill.md](skills/health-economics-tutorial-skill.md) | 评价类型选择、视角、成本测算、QALY/DALY、贴现、ICER、PSA、CHEERS 2022，9 步 |
| DCE 设计助手 | [dce-design-assistant-skill.md](skills/dce-design-assistant-skill.md) | 正交/D-效率设计、选择集与分块、clogit / mixlogit / lclogit2 潜类别、WTP |
| Markov 模型助手 | [markov-model-skill.md](skills/markov-model-skill.md) | 转移矩阵、率-概率换算、半周期校正、贴现、ICER、tornado、PSA 与 CEAC，8 步 |
| 机器学习助手 | [machine-learning-skill.md](skills/machine-learning-skill.md) | 数据拆分、LASSO/弹性网、随机森林、XGBoost、AUC/校准、SHAP、TRIPOD |
| DID 双重差分助手 | [did-skill.md](skills/did-skill.md) | 平行趋势、2×2 DID、多期交错 DID（csdid）、事件研究、安慰剂 |
| ITS 间断时间序列助手 | [its-skill.md](skills/its-skill.md) | 分段回归、自相关检验、Newey-West、itsa、反事实图、CITS |
| DDD 三重差分助手 | [ddd-skill.md](skills/ddd-skill.md) | 三维交互识别、DID 分解对照、稳健性 |
| Meta 分析助手 | [meta-analysis-skill.md](skills/meta-analysis-skill.md) | 效应量与 SE、固定/随机效应、森林图、异质性、meta 回归、发表偏倚 |
| 定性方法与结构方程专题 | [sem-qca-qualitative-skill.md](skills/sem-qca-qualitative-skill.md) | 扎根理论三级编码、SEM（lavaan/sem）、多层 SEM（gsem）、fsQCA（QCA/fuzzy） |
| 学术写作规范润色 | [academic-copyediting-skill.md](skills/academic-copyediting-skill.md) | 标点、句式、冗余、结构；明确不做检测器规避 |

### socialmedicineskills 方法学速查手册（54 条）

[skills/socialmedicineskills.md](skills/socialmedicineskills.md)，七大类：A 研究设计与偏倚（8）、B 统计分析（10）、C 卫生经济与政策（8）、D 因果推断（8）、E 数据科学（6）、F 理论框架（10）、G 定性与结构方程（4）。每条含「适用 / 要点 / Stata-R 核心代码 / 报告要点 / 常见错误」。

### 把 Skill 嵌入 AI 助手

所有 Skill 都是可移植提示词：把文件内容粘贴给 ChatGPT / Claude / DeepSeek 等即可获得对应工作流。DeepSeek Harness 桌面版用户可把 `skills/` 下文件复制为 `~/.agents/skills/<名称>/SKILL.md`（文件头部需 YAML frontmatter：`name` 与 `description`），重启后出现在能力目录。

## 模块五 · 全球健康数据库

GBD（IHME）、WHO GHO / NHA 卫生支出 / 免疫接种 / 死亡率库、世界银行 HNP、OECD Health、UNICEF、Our World in Data、UNAIDS、FAO、HMD、DHS、IPUMS、healthdata.gov；国内：国家统计局、卫健委、医保局、中国 CDC 公卫数据中心、CHARLS / CFPS / CLHLS / CHNS / CGSS。共 25 个，页面内附说明与链接。

## 模块六 · 顶刊查询

45+ 期刊按方向筛选（卫生经济 / 社会医学 / 卫生政策 / 卫生管理 / 流行病 / 中文期刊）：Journal of Health Economics、Health Economics、Value in Health、SSM、Health Policy、Health Affairs、Lancet Public Health、BMJ Global Health，以及《中国卫生经济》《中国卫生政策研究》《卫生经济研究》《中华医院管理杂志》等。影响因子与分区以最新 JCR / 官方为准。

## 模块七 · CSSCI 语料库

`papers.html`：《中国社会科学》《管理世界》《社会科学》2026 年最新三期共 100 篇，中文摘要与英文题名逐条对照；三态浏览、检索、筛选，一键「送入工作台」。语料是检测的输入素材，不是范本；不提供全文下载。

## 使用方法

1. **在线使用**：访问 <https://naturedu.github.io/socialmedicine/>（静态站，文本只在本机处理）。
2. **本地使用**：`git clone https://github.com/naturedu/socialmedicine.git` 后直接打开 `index.html`。
3. **喂给大模型**：复制对应 `skills/*.md` 内容作为提示词。
4. **嵌入 DSH**：见上文「把 Skill 嵌入 AI 助手」。

## 本地运行

纯静态页面，无构建步骤：

```bash
python -m http.server 8000   # 或 npx serve .
```

## 部署到 GitHub Pages

1. 推送本仓库到 GitHub。
2. 仓库 Settings → Pages → Source 选 `main` 分支、`/ (root)`。
3. 访问 `https://naturedu.github.io/socialmedicine/`。

## 仓库结构

```
.
├── index.html            # 主站（产品模块：选题基金 / 检测 / 润色 / 方法学 / 数据源 / 顶刊 / 披露）
├── papers.html           # CSSCI 语料库（100 篇中英对照）
├── app.js / corpus.js    # 主站与语料库逻辑（原生 JS）
├── styles.css            # 深海海浪主题样式
├── papers-data.js        # 语料数据
├── build_papers.py       # 语料库生成脚本
├── data/                 # papers.json / papers.md
└── skills/               # 10 份深度 Skill + 54 条速查手册（全部 MIT）
```

## 语料库的生成与更新

```
python build_papers.py    # 读取抓取结果，生成 papers-data.js / data/papers.json / data/papers.md
```

- 数据源：国家哲学社会科学文献中心（ncpssd.org）公开题录（题名、作者单位、刊名年期、页码、关键词、中英摘要等）。
- 选取规则：三刊最新一期全收 → 按同期往回补 → 最后一期按刊轮转补齐，收满 100 篇；已剔除公告、启事、目录等非论文条目。
- **著作权归原刊与作者**，本仓库仅存题录与摘要用于写作检测参照。

## 定位与边界

本工具 **不** 提供：去 AI 水印、规避 AI 检测、把 AI 生成内容伪装成人类原创等功能。检测是概率判断；方法学教程与期刊、基金信息供研究参考，不替代教科书、官方指南与专业判断。可靠的做法：保留来源信息、如实披露 AI 使用、做好人工把关。

## 技术栈

原生 HTML / CSS / JavaScript，无依赖，无构建。

## 贡献

欢迎通过 Issue / Pull Request 贡献：新增方法学条目、补充期刊与数据库、修正代码与链接。Skill 新增请遵循统一结构（版本/作者/许可/用途/边界/方法+代码/错误清单/输出格式/引用）。

## 引用与署名 / Citation

中文：杜思娴. 普贤——社医卫管科研助手 [EB/OL]. (2026). https://naturedu.github.io/socialmedicine/.

English: Du, S. (2026). *Puxian: A research assistant for social medicine and health management* [Web application]. https://naturedu.github.io/socialmedicine/.

作者 / Author：杜思娴 (Du Sixian) · dusixian16@163.com
