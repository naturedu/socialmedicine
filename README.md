# 普贤 · AI 互动与研究工作台

2026-10-24：[国社科立项图谱](nssfc-projects.html) 上线。从 22 份官网来源文件、38 个年度批次的 60,578 条公开立项元数据中，筛入并去重 4,471 个领域相关正式项目。支持机构、主题、关键词、共现与可比时期分析，附逐条官网来源、名单定位、批次覆盖和下载。网站主理人介绍及联系方式已删除。

2026-10-23：绿色首页与完整资源目录整合。首页为 `index.html`，`research-studio.html` 为同版入口，`classic.html` 保留此前资源主页。原站专题页、数据、图表及方法文档均保留。

- 输入博士毕业设计、申请博士、方法学习、基金、保研或写作目标，得到阶段任务、交付物、检查标准及可复制的 AI 任务书。
- 尚未接入模型 API。路线使用本地规则；检索为关键词与双语词表匹配。任务书需由用户粘贴到自己的 ChatGPT / Claude。
- PDF.js 在浏览器本地解析 PDF 并以 IndexedDB 保存文本。25 MB / 300 页限制；扫描件需 OCR；可清除索引。
- 期刊库区分题录、摘要与许可允许的片段；博士论文题录不等于已入库全文。方法代码为教学模板，并非已在真实数据验证的结果。
- 院系方向与招生入口保留。教师介绍与官方公开联系入口置于院系详情的折叠区；区分已载明的博士指导身份、相关研究教师和当年招生资格，不生成个人能力评价。
- 完整资源入口包含原站方法、理论、数据库、期刊、机构、图表、医保制度史、国社科及教育部项目目录。
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
| [方法](methods.html) / [代码](code.html) / [工具](tools.html) | 89个方法、288段代码、55份完整专题工具 | Stata/R 模板未逐项执行，混合片段需拆分并核对上下文 |
| [机构](institutions.html) | 91 个院校／机构／院系导航条目 | 部分仅核到学校主页；不是全部院校、招生目录或排名 |
| [检索与数据](sources.html) | 40 个资源入口 | 公开入口不代表全文与微观数据可自由下载 |
| [医保时间线](insurance-timeline.html) | 1998–2026 年 21 个国家级节点 | 成文、公布、生效分开，不是全部政策；2026 年医保法自 2027-01-01 施行 |
| [国社科立项图谱](nssfc-projects.html) / [项目总览](grants.html) | 4,471 个国社科正式立项领域项目；教育部目录独立保留 | 题名筛选，附机构、主题、热点和逐批来源；不是三领域全部项目 |

Nature、Science、Nature Medicine 及数字医学资料分别标明期刊。Cell 只有导航入口，没有已提供且确认属于 Cell 主刊的题录，不能称为完整 CNS 语料库。临床统计、AI 评价规范和图表表达单列方法参考。

国社科仅统计正式立项。2016—2025 年重点、一般、青年全国批次条数已核对，西部、重大、后期和专项按实际取得的正式附件公开覆盖；2026 年目前仅收录已核实的重大专项，年度公示不计入。教育部为原一般项目所列附件，独立保留其原状态。见 [完整说明与复现](docs/nssfc-data.md)、[来源覆盖](data/nssfc-coverage.json)、[分析报告](data/nssfc-analysis-report.md) 与 [提取审计](data/nssfc-extraction-audit.json)。机构频次不代表质量或获批率；主题比较只用覆盖一致的年度系列和全学科分母。

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


## 绿色科研入口的补充

主站使用绿色工作台，AI 目标输入置于研究入口。完整旧目录保留在 `classic.html` 与各专题页面。新增国际会议的会期、状态和投稿说明均记录核验日期；SCI 使用指南提供八阶段技巧、检查和模板。

页脚可复制带访问日期的本站引用。已连接公开访问统计服务，仅发送固定页面标识、预定义按钮或 Skill 事件与随机事件编号；不发送问题、PDF、邮箱或查询内容。脚本失效不影响研究与检索。统计是页面访问与点击计数，不代表独立用户、成功下载或研究成果。


使用与资源总览（`#usage`）按需读取公开统计 API，提供累计／今日／近7天／近30天的访问和操作数、页面分布、功能与 Skill 计数、CSV/JSON 下载及资源分类盘点。不计算缺少曝光分母的 CTR，也不推断独立访客。统计失败保留最近快照并明确标记。

院校互动目录扩展为 53 条院系档案，新增名称检索与中山大学／南方医科大学快捷入口。保留原有来源核验边界。招聘与学术润色模块仅处理公开导航或浏览器本地文本。
## 方法、政策与数据库扩充

[方法逻辑地图](guides/method-map.html)按问题→估计目标→数据结构→识别假设→模型→诊断选方法。完整Skill书架55份、速查89条、代码288段，保留原有12份专题；静态阅读页75个，R/Stata接口未逐项执行。

[政策主题库](policy-topics.html)包含14个主题、27个官方文件/入口，重点展开长期护理保险、家庭病床、居家医疗和支付组织改革。发文、生效、地方规则与真实执行分开；变量和机制为研究建议。

[数据库小花园](database-skills.html)包含20张数据库/扩展卡片、13份专属或组合Skill、31个官方文档/入口。CHARLS、CLHLS、HRS、ELSA、SHARE、KLoSA、LASI、MHAS、NHANES及其他家族/调查按本机元数据核验或官方文档补充分别标记。跨国协调、权重、跳题、测量与费用口径给出具体路线。公共卡片不含个体记录与私人路径。

## 全部资料与旧版核对

[全部资料柜](all-materials.html)跨目录检索历版公开材料，保留完整字段与来源；目录间有交叉，记录数不能作去重文献数。原25个数据入口、12所院校、48条期刊、19篇选刊指南与34条理论均保留；[保留对照](data/preservation-audit.json)记录历史核对。CSSCI原100条语料恢复为[历史归档](papers-archive.html)，与当前4条专题筛选版并存。

修改Skill后运行`python scripts/build_guides.py`生成阅读页，修改目录后运行`python scripts/build_material_index.py`与`python scripts/build_data_bundle.py`。新增面板元数据审计脚本见`skills/scripts/audit_panel.py`，不输出受访者键值。

## 画图与 PPT 工作坊

[工作坊](visual-skills.html)新增12份公开技能：6份科研画图、5份PPT和1份质量检查；完整书架55份。支持分类检索、逐项展开、完整阅读、下载Markdown和复制任务书。原有方法、数据库、政策及历史资料保持。

这些手册提炼既有任务中可复用的方法；不含原始对话、未发表项目和私人素材。第三方技能为明确标注的可选上游入口，不捆绑其软件、账号或生成额度。详情见[来源与能力边界](skills/references/visual-skill-sources.md)。本次原创脚本可生成效应图、简洁可编辑PPT底稿和有限结构检查，需另外进行视觉检查。

可下载[data/figure-ppt-skills.zip](data/figure-ppt-skills.zip)，每份技能独立为SKILL.md目录，并含本次原创支持脚本与引用资料；Python脚本依赖matplotlib或python-pptx，不自动安装、不调用外部服务。

## 国社科荟萃 Skills 与公众号宣传

[独立技能说明](skills/nssfc-project-synthesis/SKILL.md) · [下载技能包](downloads/nssfc-project-synthesis.zip) · [公众号静态图文](nssfc-wechat.html) · [宣传长图](shots/nssfc-promo.png) · [横版封面](shots/nssfc-cover.png)。需要支持Skills、联网与Python的AI助手；新来源须核验，现有数据覆盖和缺口见立项图谱。

## 个体微观模拟

[完整技能](skills/microsimulation-studio.md) · [网页阅读](https://naturedu.github.io/socialmedicine/guides/microsimulation-studio.html) · [独立技能ZIP](data/microsimulation-skill.zip)

2026-10-24：补齐个体状态与病史、竞争事件、成本/QALY、校准验证、共同随机数、MCSE及PSA。收录8条核验的方法/应用来源，明确中国痴呆负担预测中的宏观Markov对照。原创base R教学模型实际运行，29项检查通过；Stata模板尚未执行。全部示例参数虚构，未验证真实人群。公开包不含个体数据、私人研究方案、EndNote库或论文原文。

运行：在仓库根目录执行 `Rscript skills/scripts/microsimulation_demo.R --out microsimulation-demo`；验证：`Rscript skills/scripts/validate_microsimulation.R`。重建下载包：`python scripts/build_microsimulation_bundle.py`；其后按现有流程重建阅读页、目录及代码包。
