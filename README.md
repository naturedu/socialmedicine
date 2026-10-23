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
| [方法](methods.html) / [代码](code.html) / [工具](tools.html) | 54 个方法、239 段代码、12 份既有专题工具 | Stata/R 模板未逐项执行，混合片段需拆分并核对上下文 |
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

核心入口 `skills/socialmedicineskills.md`；完整方法手册迁至 `skills/references/methods-54.md`，其它专题路径保留。新增证据工作流、文献计量口径、进阶方法、政策项目及写作指南。`skills/scripts/coupling.py` 计算共享参考文献及余弦耦合，区分缺失与空集合，不推断因果或质量。

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
