# 普贤 · AI 互动与研究工作台

## 公开资料主题分析与常用入口

盖茨基金归入[基金项目总览](grants.html)，与国社科、国自然、教育部并列。原 `topic-analysis.html#gates` 链接自动转到独立基金页面。

[盖茨基金项目](gates-grants.html) / [CNS与管理世界主题分析](topic-analysis.html)：1,455 条去重公开资助、65 条 CNS 主刊及相关期刊题录、36 条《管理世界》题录。保留公开题名、作者、机构及出处，使用字段白名单排除私人信息。7 条书评线索单列；规则分类与核验深度可查。详见[资料口径](skills/references/public-topics.md)。

主页顺序改为「科研问答 → 写作与期刊 → AI 检测与学术润色」，提问框下方同步添加快捷入口。

复算：`python scripts/build_public_topics.py`；专题网页、技能资料与全部资料柜共同使用这份公开索引。

## Skill 安装包、下载记录与方法出处

[下载与记录页面](https://naturedu.github.io/socialmedicine/skill-downloads.html) · [研究 Skill 阅读页](guides/socialmedicineskills.html) · [独立下载记录工具](https://github.com/naturedu/socialmedicine/releases/latest/download/skill-download-stats.zip) · [89个方法的原始论文与官方来源](https://naturedu.github.io/socialmedicine/method-sources.html)

含项目明细的旧版完整安装包已撤下；目前以网页阅读为主。其他工具仅包含相应技能说明与原创脚本，不包含人物照片、原始对话、私人稿件、受限数据或论文全文。新增科研公众号图文流程与返修证据对应规则；已有绘图、PPT、数据库及微观模拟内容继续保留。此次整理基于可访问对话与已有公开库交叉核对，并非导出整个账号的全部历史。

方法卡片标题可直达代表性原始方法或官方来源，另保留本站中文教程与代码。`data/method-authorities.json` 记录89个方法的来源对应、来源类型及核对状态；不把报告清单当作设计标准，不把链接检查当作全文或代码验证。

下载记录使用 GitHub Release 附件 `download_count`，与原有网页“下载点击”分开。按安装包和版本记录，首次观测是基线；原始文件、仓库 clone、源码 ZIP、镜像和 Skill 调用不计入，不等于独立用户或成功安装。重复下载及维护者测试可能计入。附件移除后保留最后观测值，未观测部分不可追溯。

GitHub 自动累计附件下载计数，网页打开或刷新时从公开 API 查询；速率限制或网络失败时明确显示归档快照/上次读取，缺失不补0。查询只读，不上传用户标识。`data/skill-downloads.json` 保留已采集快照和首次基线。

每日归档配置已准备在 [docs/skill-download-stats.workflow.yml](docs/skill-download-stats.workflow.yml)，**尚未启用**：当前发布凭据缺少 GitHub `workflow` 权限，GitHub 拒绝创建工作流。权限补齐后，将该文件保存为 `.github/workflows/skill-download-stats.yml` 即可使用每天约北京时间09:17、发布后及手动触发；计划运行可能延迟或停用。此限制不影响 GitHub 自身的累计下载计数。归档也可手动运行技能中的脚本，不需要为公开读取提供令牌。

复现：`python scripts/build_socialmedicine_bundle.py` 生成 `dist/` 下两个 ZIP、文件清单及 SHA-256。新版本使用新的 Release，保留旧附件，避免覆盖导致计数丢失。修改来源后运行 `python scripts/build_method_authorities.py` 与 `python scripts/build_guides.py`。验证：`python -m unittest discover -s tests -p test_download_stats.py` 和 `node --test tests/method-authorities.test.mjs`。

2026-10-24：首页改为绿色科研聊天入口，标语为 **All for the health**。支持方法比较、Stata/R 代码追问、研究设计、院校、数据库、项目题目与经典资料；回答给出站内资料或官方出处。结构化学习与申请路线仍可展开使用。当前采用本地规则与资料检索，未接入通用模型 API。

右上角展示全站访问、预设功能点击与下载点击，点击可查看明细和导出。统计服务将提问、已回答、需补充、未匹配、失败、追问及反馈分别汇总；互动事件没有原文或访客身份字段。对话仅在用户勾选后保留本机，可清除或导出。重复投递按事件 ID 去重；统计不代表独立人数、答案正确率或下载完成率。问答统计从本版本启用后开始，历史不可回溯。
2026-10-24：项目资料调整为 HTML 汇总分析。国社科、教育部、国自然分别展示主题与机构分布；不再发布项目明细、原始编号、人员或资料包。

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
| [方法](methods.html) / [代码](code.html) / [工具](tools.html) | 89个方法、288段代码、58份完整专题工具 | Stata/R 模板未逐项执行，混合片段需拆分并核对上下文 |
| [机构](institutions.html) | 91 个院校／机构／院系导航条目 | 部分仅核到学校主页；不是全部院校、招生目录或排名 |
| [检索与数据](sources.html) | 40 个资源入口 | 公开入口不代表全文与微观数据可自由下载 |
| [医保时间线](insurance-timeline.html) | 1998–2026 年 21 个国家级节点 | 成文、公布、生效分开，不是全部政策；2026 年医保法自 2027-01-01 施行 |
| [国社科立项图谱](nssfc-projects.html) / [项目总览](grants.html) | 4,471 个国社科正式立项领域项目；教育部目录独立保留 | 题名筛选后的机构与主题汇总，网页说明覆盖范围；不是三领域全部项目 |

Nature、Science、Nature Medicine 及数字医学资料分别标明期刊。独立主题库补入 Cell 主刊 3 条公开题录，合计 CNS 主刊 55 条、相关期刊 10 条；不称为完整 CNS 语料库。临床统计、AI 评价规范和图表表达单列方法参考。

国社科仅统计正式立项。2016—2025 年重点、一般、青年全国批次条数已核对，西部、重大、后期和专项按实际取得的正式附件公开覆盖；2026 年目前仅收录已核实的重大专项，年度公示不计入。教育部为原一般项目所列附件，独立保留其原状态。见[国社科主题分析](nssfc-projects.html)和[教育部简析](grants.html#moe)。机构频次不代表质量或获批率；主题比较只用覆盖一致的年度系列和全学科分母。

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

[方法逻辑地图](guides/method-map.html)按问题→估计目标→数据结构→识别假设→模型→诊断选方法。完整Skill书架58份、速查89条、代码288段，保留原有12份专题；静态阅读页76个，R/Stata接口未逐项执行。

[政策主题库](policy-topics.html)包含14个主题、27个官方文件/入口，重点展开长期护理保险、家庭病床、居家医疗和支付组织改革。发文、生效、地方规则与真实执行分开；变量和机制为研究建议。

[数据库小花园](database-skills.html)包含20张数据库/扩展卡片、13份专属或组合Skill、31个官方文档/入口。CHARLS、CLHLS、HRS、ELSA、SHARE、KLoSA、LASI、MHAS、NHANES及其他家族/调查按本机元数据核验或官方文档补充分别标记。跨国协调、权重、跳题、测量与费用口径给出具体路线。公共卡片不含个体记录与私人路径。

## 全部资料与旧版核对

[全部资料柜](all-materials.html)跨目录检索历版公开材料，保留完整字段与来源；目录间有交叉，记录数不能作去重文献数。原25个数据入口、12所院校、48条期刊、19篇选刊指南与34条理论均保留；[保留对照](data/preservation-audit.json)记录历史核对。CSSCI原100条语料恢复为[历史归档](papers-archive.html)，与当前4条专题筛选版并存。

修改Skill后运行`python scripts/build_guides.py`生成阅读页，修改目录后运行`python scripts/build_material_index.py`与`python scripts/build_data_bundle.py`。新增面板元数据审计脚本见`skills/scripts/audit_panel.py`，不输出受访者键值。

## 画图与 PPT 工作坊

[工作坊](visual-skills.html)新增12份公开技能：6份科研画图、5份PPT和1份质量检查；完整书架58份。支持分类检索、逐项展开、完整阅读、下载Markdown和复制任务书。原有方法、数据库、政策及历史资料保持。

这些手册提炼既有任务中可复用的方法；不含原始对话、未发表项目和私人素材。第三方技能为明确标注的可选上游入口，不捆绑其软件、账号或生成额度。详情见[来源与能力边界](skills/references/visual-skill-sources.md)。本次原创脚本可生成效应图、简洁可编辑PPT底稿和有限结构检查，需另外进行视觉检查。

可下载[data/figure-ppt-skills.zip](data/figure-ppt-skills.zip)，每份技能独立为SKILL.md目录，并含本次原创支持脚本与引用资料；Python脚本依赖matplotlib或python-pptx，不自动安装、不调用外部服务。

## 国社科主题分析

[在线分析](nssfc-projects.html)仅展示机构、主题、关键词共现与可比时期的汇总。相关技能包、明细数据及旧宣传包已撤下，统计范围与覆盖缺口在网页内说明。

## 个体微观模拟

[完整技能](skills/microsimulation-studio.md) · [网页阅读](https://naturedu.github.io/socialmedicine/guides/microsimulation-studio.html) · [独立技能ZIP](data/microsimulation-skill.zip)

2026-10-24：补齐个体状态与病史、竞争事件、成本/QALY、校准验证、共同随机数、MCSE及PSA。收录8条核验的方法/应用来源，明确中国痴呆负担预测中的宏观Markov对照。原创base R教学模型实际运行，29项检查通过；Stata模板尚未执行。全部示例参数虚构，未验证真实人群。公开包不含个体数据、私人研究方案、EndNote库或论文原文。

运行：在仓库根目录执行 `Rscript skills/scripts/microsimulation_demo.R --out microsimulation-demo`；验证：`Rscript skills/scripts/validate_microsimulation.R`。重建下载包：`python scripts/build_microsimulation_bundle.py`；其后按现有流程重建阅读页、目录及代码包。

## 国自然经管与健康治理

[国自然经管与健康分析](nsfc-health.html)：1,934项健康相关汇编条目，涉及313个原层级机构，实际覆盖2010—2025年，未逐项官方核验。只保留汇总 HTML；不发布清单、CSV、JSON或资料包。

国社科与教育部资料同样只保留汇总网页，搜索、前端和发布附件不再携带项目明细。

## 机器学习预测模型

[简明 HTML 教程](prediction-models.html)：数据划分与泄漏、模型比较、评价指标、SHAP/LIME及报告。仅作方法解读，无课程、数据或模型文件下载。

主页顶部与“使用与资源总览”单列 `socialmedicineskills`：GitHub Release安装包累计下载、主技能网页打开和下载点击。外部Release链接和下载页面已接入同一预设事件；三项不相加，不推断独立人数、成功安装或离线调用。读取失败显示不可用或带日期的上次快照，不用零补缺；未向技能包添加调用追踪。

## 分类统计与豆包/GPT使用

左上角新增访问PV、操作点击、站内Skill调用（完整任务书生成）及分类入口。[分类与平台统计](usage-statistics.html)按研究方法、数据库、政策、画图、PPT、写作、总纲和目标平台分别汇总。

点击“豆包/GPT使用”后可选平台，下载Skill、生成/复制完整任务书、打开平台，并由本人主动确认已使用。目标平台操作、自报记录与服务器任务书生成分开；没有自动监控豆包/GPT内部执行、身份或离线使用。历史记录未指定的平台不倒推补填；GitHub附件下载计数继续独立保留。本地预览操作不写线上计数。

统计只接收有限Skill标识、平台枚举、页面枚举和事件UUID，不接收姓名、账号、问题、对话或文件内容。`/api/skill-invoke`由服务器完成任务书生成后记调用；`/api/collect`拒绝客户端伪报调用。相同请求UUID重试不重复累计。读取失败显示不可用或上次快照，不以零冒充缺失值。



## 标准化病人、实施科学与期刊检索

新增 SP / USP / OSCE 与实施科学两份完整手册、两套 CSV 字段模板和四段 R / Stata 代码。R 4.6.1 模拟运行通过；Stata 未执行，详见 data/sp-implementation-validation.json。

首页问答与文献工作区统一使用 data/research-knowledge.json，共 238 条去重资料，保留原题录来源及不同片段的定位。包括《管理世界》36条、Nature主刊21条、Science主刊31条；题录不等于全文或模型训练。写作工作区支持分别选择期刊论证建议。重建顺序：build_sp_implementation.py、build_research_knowledge.py、build_guides.py、build_material_index.py、build_code_bundle.py。

按用户要求暂不展示具体导师条目，保留院系、培养方向与官方招生入口。


## 2026-10-28 国自然健康治理专题与基金图谱 Skill

[新增专题](nsfc-governance.html)使用 `data/nsfc-governance-summary.json` 的纯聚合数据：748 条 G0405/G0406 结题档案样本，实际有记录2016—2023年，尚未逐项官方门户核验，2024—2026年缺档。代码为平台现行代码回溯归并，主题为题名规则与模型语义补充；不是全国完整立项库。旧1,934条汇编保留，不相加。

[基金图谱 Skill](guides/funding-landscape-skill.html)补充来源状态、代码沿革、缺失年份、LLM复核、地图精度和获批概率的分析边界。[公众号宣传HTML](nsfc-wechat.html)正文14px、左右10px，附学习入口二维码；由读者自行在公众号编辑器排版发布。只新增汇总与通用方法，不发布逐条项目、人员、私稿或对话。
