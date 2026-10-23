# 普贤 · AI 互动与研究工作台

2026-10-23：绿色首页与完整资源目录整合。首页为 `index.html`，`research-studio.html` 为同版入口，`classic.html` 保留此前资源主页。原站专题页、数据、图表及方法文档均保留。

- 输入博士毕业设计、申请博士、方法学习、基金、保研或写作目标，得到阶段任务、交付物、检查标准及可复制的 AI 任务书。
- 尚未接入模型 API。路线使用本地规则；检索为关键词与双语词表匹配。任务书需由用户粘贴到自己的 ChatGPT / Claude。
- PDF.js 在浏览器本地解析 PDF 并以 IndexedDB 保存文本。25 MB / 300 页限制；扫描件需 OCR；可清除索引。
- 期刊库区分题录、摘要与许可允许的片段；博士论文题录不等于已入库全文。方法代码为教学模板，并非已在真实数据验证的结果。
- 院系方向与招生入口保留；按用户最新要求，本版不发布导师个人卡片及导师 Skill。
- 完整资源入口包含原站方法、理论、数据库、期刊、机构、图表、医保制度史、盖茨基金会及教育部项目目录。
- `data/studio-journals.json` 中的周期保留定义、来源及核对日期。缺少年度依据的 JCR / 中科院分区显示待核实，不用 SJR 或期刊品牌替代。

本地预览：在本目录运行 `python -m http.server 8765 --bind 127.0.0.1`，浏览器打开 `http://127.0.0.1:8765`。不能用 `file://` 加载 JSON 与模块。

检查：`node --test tests/studio.test.mjs`。新增工作台使用原生 HTML/CSS/ES modules，无构建步骤。PDF.js 及公开文献内容的许可见 `THIRD_PARTY_NOTICES.md`。

---

# 普贤 · 社会医学与卫生事业管理

面向卫生政策、医保、卫生经济／药物经济、卫生服务、医院管理、健康公平及社会决定因素的公开研究工作台。保留原有方法工具，新增可检索资料、标题／摘要选刊、期刊审读与医保改革时间线。绿色小叶子为站点标识。

[网站](https://naturedu.github.io/socialmedicine/) · [标题／摘要选刊](journal-match.html) · [核心 Skill](skills/socialmedicineskills.md)

## 资源范围

| 入口 | 数量与内容 | 边界 |
|---|---|---|
| [选刊指引](journal-match.html) | 52 个期刊配置主题；最多显示 9 个候选 | 本地规则初筛，不是录用概率；稿件类型用于核对清单 |
| [期刊](journals.html) | 97 个期刊／刊名入口，22 个中文入口；并入指定的 43 条清单 | 包含历史刊名，不是 97 本独立现刊；不展示未核实的当前 IF、分区或审稿时长 |
| [文献](library.html) | 69 条：54 条领域文献、15 条方法参考 | 逐条显示继承的核验状态，不是新完成的系统综述 |
| [图表](figures.html) | 27 张原图、截图或处理参考图 | 含完整图源与引用，处理记录可查；图片许可未逐图核定 |
| [方法](methods.html) / [代码](code.html) / [工具](tools.html) | 89个方法、268段代码、29份完整专题工具 | Stata/R 模板未逐项执行，混合片段需拆分并核对上下文 |
| [机构](institutions.html) | 91 个院校／机构／院系导航条目 | 部分仅核到学校主页；不是全部院校、招生目录或排名 |
| [检索与数据](sources.html) | 40 个资源入口 | 公开入口不代表全文与微观数据可自由下载 |
| [医保时间线](insurance-timeline.html) | 1998–2026 年 21 个国家级节点 | 成文、公布、生效分开，不是全部政策；2026 年医保法自 2027-01-01 施行 |
| [项目](grants.html) | 基金会 990 条、教育部 60 条领域候选 | 初筛／题名复筛，未逐项审读项目内容 |

Nature、Science、Nature Medicine 及数字医学资料分别标明期刊。Cell 只有导航入口，没有已提供且确认属于 Cell 主刊的题录，不能称为完整 CNS 语料库。临床统计、AI 评价规范和图表表达单列方法参考。

基金会源快照含 41,847 条，更新时间 2026-10-14，按目的关键词筛选 990 条；承诺金额不是实际拨款。教育部 2025 年一般项目正式附件完整解析 2,817 条，再按题名复筛 60 条；2026 年入口是公示，不当作正式立项。见 [筛选审计](data/scope-audit.json) 与 [解析审计](data/moe-extraction-audit.json)。

## 标题／摘要选刊

输入仅在当前浏览器处理，无 API、文本持久化或自动投稿。输出主题与方法线索、候选理由、类型检查项及官方入口。标题权重高于摘要，方法辅助，同分按刊名排序。缺少领域依据时不强行推荐。

公开 [规则](data/journal-rules.json) 与 [实现](journal-engine.js)。规则不能理解全文，也不能判断创新性、因果识别或文章质量；文章类型收稿资格需逐刊核对。完整人工流程见 [选刊指南](skills/references/journal-selection.md)。

## 方法与写作

核心入口 `skills/socialmedicineskills.md`；完整扩充手册为 `skills/methods-89.md`，历史54条手册保留在 `skills/references/methods-54.md`，其它专题路径保留。新增证据工作流、文献计量口径、进阶方法、政策项目及写作指南。`skills/scripts/coupling.py` 计算共享参考文献及余弦耦合，区分缺失与空集合，不推断因果或质量。

主页保留基础文字规范化，新增《管理世界》、Nature/Science、医学与公共卫生审读任务书。本地规则不冒充语言模型深度润色，保留事实、数字、引用与结论强度。更新技能、代码和资料不等于模型参数训练。

## 运行与维护

无需构建，直接打开 `index.html` 可查看。推荐在目录运行 `python -m http.server 8765` 后浏览 `http://localhost:8765/`，可部署至既有 GitHub Pages。

`data/*.json` 为结构化来源；CSV 使用 UTF-8 BOM。修改数据后运行 `python scripts/build_data_bundle.py` 同步浏览器数据包。分页不改变纳入数量。

`node tests/journal-engine.test.cjs` 检查匹配边界；`python tests/test_coupling.py` 检查耦合计算，不代表所有原有 Stata/R 片段均已验证。

## 隐私与许可

不纳入私人联络资料、原始聊天、账号、未发表稿件、个人申请书或未公开研究构思。保留公开论文作者、项目机构与原有作者署名。上传清单只提取期刊，不复制评论者资料。

代码与原创说明按 [MIT](LICENSE) 使用。论文、图片与数据库遵循来源权利，见 [归属与图源](ASSET_ATTRIBUTION.md)。引用存在不等于全文论断已核验。

原有公开作者：杜思娴（Du Sixian）。引用：Du, S. (2026). *Puxian: A research assistant for social medicine and health management* [Web application]. https://naturedu.github.io/socialmedicine/.

感谢华中科技大学医药卫生管理学院对我的帮助。

## 方法逻辑扩充（2026-10-23）

原有12份完整Skill书架扩充为27份，速查54→89种方法，新增15个专题；原有其他资源与绿色工作台均保留。

[方法逻辑地图](guides/method-map.html) · [分类教程与搜索](method-garden.html#methods)。新增PSM、聚类、交错DID、计量模型、NMA、伞状综述、TTE、Monte Carlo，以及SDID/DML、政策文本、医疗AI、纵向数据、模拟选型、实施公平与研究流程。

核心主线：研究问题→估计目标→数据结构→识别假设→模型→诊断与解释。代码明确区分教学模拟与真实数据接口，R/Stata未逐项执行。来源见[data/method-sources.json](data/method-sources.json)。

静态阅读页重建：安装`requirements-docs.txt`后运行`python scripts/build_guides.py`。历史对话仅用于归纳通用主题，公开内容不含原始聊天和私人项目数据。

## 全部资料与旧版核对

[全部资料柜](all-materials.html)跨目录检索旧站与新版的公开材料，可展开每条完整字段。原25个数据入口、12所院校、48条期刊、19篇选刊指南、34条理论与旧站文件均保留；见[data/preservation-audit.json](data/preservation-audit.json)。目录间有交叉，记录总数不是去重文献数。

## 全部资料与旧版核对

[全部资料柜](all-materials.html)跨目录检索旧站与新版的公开材料，可展开每条完整字段。原25个数据入口、12所院校、48条期刊、19篇选刊指南、34条理论与旧站文件均保留；见[data/preservation-audit.json](data/preservation-audit.json)。目录间有交叉，记录总数不是去重文献数。

## 政策主题库

[14个政策主题](policy-topics.html)与27个官方文件/入口，重点提供长护险、家庭病床深度指南。完整Skill书架增至29份，方法速查仍为89条。文件版本、政策意图、地方规则和实际执行分别说明；研究变量/机制为分析建议。

## 全部资料与旧版核对

[全部资料柜](all-materials.html)跨目录检索旧站与新版的公开材料，可展开每条完整字段。原25个数据入口、12所院校、48条期刊、19篇选刊指南、34条理论与旧站文件均保留；见[data/preservation-audit.json](data/preservation-audit.json)。目录间有交叉，记录总数不是去重文献数。
