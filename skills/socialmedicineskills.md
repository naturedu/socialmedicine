---
name: socialmedicineskills
description: 社会医学与卫生事业管理研究工具：方法与 Stata/R 代码速查、文献检索核验、主题与耦合分析、公开院校期刊和项目资源、医保政策时间线、管理世界及国际期刊写作审读。用于研究方法与资料整理，不将私人稿件或未公开选题写入公共库。
---

# 社医卫管 · 方法与证据工作台

维护原有公开作者署名：杜思娴（Du Sixian）。代码与原创说明沿用仓库 MIT 许可；论文、题录数据库与期刊图片适用各自权利。整理日期：2026-10-23。

## 先按任务选入口

- **方法选择和分析代码**：读 [89 条方法手册](methods-89.md)，复杂设计再查 [进阶方法与原始文献](references/advanced-methods.md)。DID、DDD、ITS、卫生经济、Markov、DCE、机器学习、Meta、定性/SEM 等专题保留在本目录各 `*-skill.md`。先确定估计对象、数据结构和识别假设，再选代码。
- **检索、题录核验和图片整理**：读 [证据与语料工作流](references/evidence-workflow.md)。出版者正式栏目与数据库通用文献类型不能混用；纳入、排除、待核分开。
- **关键词、时间演变、机构作者及聚类/耦合**：读 [文献计量口径](references/bibliometrics.md)。需要确定性计算时使用 `scripts/coupling.py`，不把网络结构解释为因果或研究质量。
- **《管理世界》与国际顶刊润色**：读 [期刊写作模式](references/journal-writing.md)。保留事实、引用及结论强度，给修订理由与证据缺口；不保证发表，不以检测分数为目标。
- **医保改革与资助项目**：读 [政策与项目口径](references/policy-and-grants.md)。区分发文/实施、承诺/拨款、公示/正式立项。
- **找机构、期刊、数据和已提供资料**：按 [资源目录](references/catalog-location.md) 定位，只检索有关记录，不一次加载整库。

- **按标题／摘要选刊**：读 [选刊流程与边界](references/journal-selection.md)。区分主题匹配、方法适配与发表门槛；私人输入不得入公共库。


## 新增方法逻辑与专题

先读[方法逻辑地图](method-map.md)，按问题、估计目标、数据与识别假设选择路线。

- [网状 Meta 分析](network-meta-analysis-skill.md)：传递性、网络结构、多臂相关、直接/间接诊断与证据确定性。
- [meta-meta / 伞状综述](umbrella-review-skill.md)：综述家族、原始研究重叠矩阵、CCA、AMSTAR 2/ROBIS与二阶合并边界。
- [目标试验模拟 TTE](target-trial-emulation-skill.md)：七要素协议、time zero、IPW、CCW路线与TARGET报告。
- [蒙特卡洛模拟与 PSA](monte-carlo-simulation-skill.md)：ADEMP、偏倚/覆盖/效能、MCSE、PSA与CEAC的教学实验。
- [因果推断进阶](advanced-causal-inference-skill.md)：SDID、DML、IPW/MSM与g方法：先定估计目标，再核对识别和诊断。
- [卫生政策文本分析](policy-text-analysis-skill.md)：三维框架、PMC、主题模型、LLM编码与人工金标准验证。
- [医疗 AI 与人工评价](medical-ai-evaluation-skill.md)：准确性、一致性、配对比较、校准、安全错误和TRIPOD-LLM。
- [公共数据库与纵向研究](longitudinal-public-data-skill.md)：CHARLS/CLHLS/CFPS口径、抽样、失访、轨迹与竞争风险。
- [模拟模型选型](simulation-models-skill.md)：Markov、微观、DES、系统动力学、ABM：结构、参数、校准与验证。
- [实施科学与健康公平](implementation-equity-skill.md)：CFIR/RE-AIM、可测机制链、定性定量整合和公平性评价。
- [从选题到论文的研究流程](research-workflow-skill.md)：文献核验、综述分流、变量与图表计划、写作修订和投稿材料。
- [PSM、匹配与加权](propensity-score-skill.md)：ATE/ATT/ATO、变量选择、共同支持、Love plot与匹配后推断。
- [交错 DID / 分批政策](staggered-did-skill.md)：ATT(g,t)、C&S、Sun–Abraham、事件窗、对照支持与小簇推断。
- [聚类分析与分型](clustering-analysis-skill.md)：距离、变量尺度、算法、类数、稳定性与外部验证的完整路线。
- [卫生计量模型选型](econometric-modeling-skill.md)：GLM、两部、计数、面板FE/RE/CRE、分位数、IV/RDD和空间模型。

## 每次交付的底线

1. 直接完成已获授权的工作。范围可从上下文判断时先做，不重复索要确认。记录不可解决的缺失信息，不能以猜测补齐。
2. 证据与解释分开。题名、DOI、年份、栏目、机构名称及图源可复核；每条新论断有相应证据，不能把索引存在当作读过全文。
3. 记录数据、脚本、依赖、版本、随机种子和执行状态。未执行的 Stata/R 片段标为模板；不能把单个 Python 测试通过写成整个方法库已验证。
4. 公共资源库排除私人联络信息、账号、原始聊天、未发表内容、个人申请书与未公开研究构思。公开论文题名、公开作者及已获批项目可作为学术索引。
5. 做 HTML 时优先清晰的信息层级、手机可读性、检索/筛选和完整出处。配色、字号、品牌图标按当前用户要求，不将某一次偏好固定为所有任务的规则。

## 已整理的资料范围

范围仅为社会医学与卫生事业管理及其必要方法参考。公共资料含 69 条题录（54 条领域文献、15 条方法参考）、27 张图表、97 个期刊／刊名入口、91 个机构入口；项目为 3,413 条国社科及教育部题名候选，非逐项全文核验。

当前目录保留原有12份完整工具手册，完整Skill书架共54份；集中索引89个方法与286段教学代码，另有进阶方法与耦合脚本。文献库包含已有 CSSCI 题录、Nature/Science 书单、Nature Medicine 与相关数字医学资料以及 JAMA 图表文献。Cell 已列入期刊入口，但没有已提供且确认属于 Cell 主刊的题录，不能虚报为完整 CNS 语料。

期刊和院校目录属于导航索引，不是排名、完整学科普查或招生承诺。项目按2016—2025年整理，来源版本、地域范围与公示／正式立项分开，见年度覆盖表。

这次更新的是技能说明、可复用代码和可检索资料；不代表已进行模型参数训练，也不自动授权未来抓取、发布、发送消息或安装服务。

## 致谢

感谢华中科技大学医药卫生管理学院对我的帮助。

## 政策主题与文本研究

- [长期护理保险](long-term-care-policy-skill.md)：核对试点/建制版本、筹资、评估、待遇与服务。
- [家庭病床](home-hospital-bed-policy-skill.md)：核对2026服务指南、建撤床、支付及地方差异。
- 14个主题和27个官方文件入口见网站policy-topics.html与data/policy-topics.json；政策含义、研究建议和实际执行分开。

## 数据库专属Skills与跨国协调

数据请求先按具体数据库分流；先读元数据，确认权限、单位、题体、波次、抽样和时间，再进入模型。网站数据库小花园在`database-skills.html`，公开卡片不包含个体记录或私人路径。

- [CHARLS · 中国健康与养老追踪调查](charls-database-skill.md)：中老年健康、经济与家庭追踪；原始模块、Harmonized与第三方清洗版分别建立版本清单。
- [CLHLS / CLHLS-HF · 老年健康与家庭追踪](clhls-database-skill.md)：高龄健康与照护研究；2021家庭扩展、存活者问卷、死亡家属问卷和补充样本分别处理。
- [HRS · Health and Retirement Study](hrs-database-skill.md)：以健康、工作退休和家庭经济为主线的纵向调查。Core、RAND、家庭、CAMS、退出和生物标志物产品分开。
- [ELSA · English Longitudinal Study of Ageing](elsa-database-skill.md)：英格兰老龄纵向研究；访问、护士测量、自填、生命历程和退出材料按组件衔接。
- [SHARE · Survey of Health, Ageing and Retirement in Europe](share-database-skill.md)：跨欧洲国家的健康与退休调查；国家、常规波、SHARELIFE、疫情及退出组件需识别。
- [KLoSA · Korean Longitudinal Study of Aging](klosa-database-skill.md)：2006起的中老年家庭追踪；基线抽样覆盖与后期补样须分别说明。
- [LASI / LASI-DAD · Longitudinal Ageing Study in India](lasi-database-skill.md)：老龄、家庭与健康调查；全国Wave 1、2010试调查及LASI-DAD认知子研究为不同产品。
- [MHAS / ENASEM · Mexican Health and Aging Study](mhas-database-skill.md)：健康、家庭和经济追踪；Core、代理、家属、Master Follow-Up、Mex-Cog及插补资料分开。
- [NHANES · 复杂抽样与健康检查实操](nhanes-database-skill.md)：从XPT与Doc File核对到周期合并、组件权重、survey分析和死亡链接。
- [HRS家族 · 跨国协调与外部验证](cross-cohort-harmonization-skill.md)：把CHARLS、HRS、ELSA、SHARE、KLoSA、LASI、MHAS及扩展研究按共同概念协调。
- [CFPS、CHNS与NHIS · 扩展调查选型](cfps-chns-database-skill.md)：综合家庭、营养社区和年度健康访谈的单位、时间、权重与分析路线。
- [医保结算、临床登记与MEPS · 费用和事件数据](claims-clinical-database-skill.md)：按人、就诊、费用明细和制度暴露构建可追溯分析层，区分结算费用与真实成本。
- [HRS家族扩展 · JSTAR、TILDA、CRELES、SPS、MARS与HCAP](aging-family-extension-skill.md)：补充亚洲、欧洲、拉美老龄研究与认知扩展，并明确文档核验深度。

本机CHARLS/CLHLS核对包含既有问卷/字典；HRS家族六份清洗CSV核对列头和波次，部分Harmonized核对字段标签；NHANES定位到XPT及课程资料。其他研究按卡片标明官方文档/产品目录核验，不将文件存在当作模型已复现。

## 画图与PPT

新增12份公开技能，完整入口见网站`visual-skills.html`。数据图、机制图、技术路线、图形摘要与各类PPT分别选择，不混淆图片型与对象可编辑交付。

- [科研数据图与多面板排版](research-figure-skill.md)：从数据、模型输出和科学问题生成可复现统计图与多面板图，交付脚本、SVG/PDF和预览；不生成研究数据。
- [JAMA八类图表阅读与绘制](clinical-statistical-figures-skill.md)：区分并绘制生存、森林、流程、样条、分布、竞争风险、预测评价和目标试验图解；保留真实来源和统计含义。
- [政策评估与卫生经济图表](policy-evaluation-figures-skill.md)：将DID、ITS、匹配加权和卫生经济模型的已估计结果转为可审读图表，明确识别条件、比较组与不确定性。
- [理论框架、机制图与DAG](conceptual-mechanism-figure-skill.md)：把文献或研究方案转成有证据来源的理论框架、机制图、DAG或SEM示意，交付可编辑源文件并核对箭头含义。
- [基金申报与研究技术路线图](grant-roadmap-figure-skill.md)：将申请书或研究方案转成研究内容、科学问题、方法、数据和产物对齐的技术路线图，保持项目原文和可编辑性。
- [图形摘要与AI辅助示意图](graphical-abstract-skill.md)：设计论文图形摘要与AI辅助概念插图，保持来源、事实和数值完整，明确位图、矢量与可编辑交付的差别。
- [论文精读与中文文献汇报PPT](paper-to-ppt-skill.md)：将科研论文转为有证据主线的中文汇报PPT，保留关键原图、出处和逐页讲稿，交付真实PPTX。
- [开题、中期与答辩PPT](thesis-defense-ppt-skill.md)：依据研究阶段制作开题、中期或答辩PPT，对齐科学问题、子研究、方法和已有结果，清楚标识计划与完成状态。
- [图片、扫描PDF转可编辑PPT](image-to-editable-slides-skill.md)：将幻灯片截图、扫描PDF或图片型PPT重建为对象可编辑的PPTX，保留图像与文本来源并说明无法恢复的内容。
- [统一视觉的图片型PPT](image-based-slides-skill.md)：在用户接受整页图片的前提下制作视觉统一的图片型PPT，保留原图、提示词和讲稿，明确对象不可单独编辑。
- [科研教学、方法科普与分镜PPT](teaching-storyboard-ppt-skill.md)：把研究方法或科研知识组织成教学幻灯片、图解卡片和视频分镜，保留准确术语、来源与受众层次。
- [科研图与PPT质量检查](figure-ppt-quality-skill.md)：检查科研图和PPT的证据、图文一致、对象编辑、字体、裁切和导出，区分自动结构检查与人工视觉检查。
