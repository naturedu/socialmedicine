# 盖茨基金、CNS 与《管理世界》公开主题库

[盖茨基金项目](https://naturedu.github.io/socialmedicine/gates-grants.html) · [CNS与管理世界](https://naturedu.github.io/socialmedicine/topic-analysis.html) · [公开索引](https://naturedu.github.io/socialmedicine/data/public-topic-records.json) · [分析结果](https://naturedu.github.io/socialmedicine/data/public-topic-analysis.json)

## 收录范围

- 盖茨基金：1,455 个去重资助 ID。合并既有全球社医卫管候选 990 条、中国机构公开资助 472 条、中国相关健康政策管理 192 条（2016—2025）。三个集合重叠，不能直接相加；快照日期 2026-10-14，并非基金会全量资助。
- CNS：65 条公开题录。主刊为 Nature 21、Science 31、Cell 3，共 55 条；相关期刊为 Nature Medicine 3、Nature Health 4、npj Digital Medicine 2、Science Advances 1，共 10 条。按 DOI 或规范题名去重，正文分块不重复计篇。
- 《管理世界》：既有 NSSD 归档中 2026 年第 6—8 期的 36 条，不是三期全量目录。7 条按题名识别的书评线索保留索引，29 条纳入默认主题构成；正式栏目仍须回访原刊确认。

## 研究时如何调用

1. 按资料集、主刊/相关期刊、年份及主题筛选；保留返回记录 ID、原始题名与出处。盖茨基金还有三个相互重叠的来源集合。
2. 优先读公开题名、资助用途与关键词，并查看核验状态。继承题录不代表本轮完成全文审读；没有摘要/正文时，不补造方法、结果或贡献。
3. 主主题用于互斥计数；辅助主题可多选。词表及命中词可回溯，英文按词边界匹配。规则编码是描述性整理，不是已验证的主题模型，也不代表官方分类。
4. 主题分析与研究启发分开：频次只是收录样本构成；问题、设计与机制建议需另找原文证据。最新年度未结束、历史收录不均，不用此样本推出学科趋势、基金优先级、录用概率或研究空白。
5. Cell 的三条资料用于个体营养、预测验证与药物发现的跨领域方法参照，不把它们表述为卫生管理政策研究。

## 公开字段与隐私

保留已经公开的项目 ID、用途、受资助机构、承诺年月和金额、公开论文题名/作者/期刊/DOI。输入采用字段白名单，不导入联系人、电话、邮箱、本机路径、聊天、稿件、个人申请书、未公开方案或数据。原作者署名和公开学术作者属于出处，不因脱敏而删除。

基金会 PURPOSE 是公开用途，不是正式独立项目题名；中文概括单独标注。机构所在国家/地区与官方服务地分开保存。金额为 USD 承诺额，不是实际拨款、年度支出或项目效果。官方说明见 [Committed Grants](https://www.gatesfoundation.org/about/committed-grants)。

## 新增 Cell 题录的核验出处

- [Personalized Nutrition by Prediction of Glycemic Responses](https://doi.org/10.1016/j.cell.2015.11.001)，Cell，2015：出版者页面与 Crossref 元数据交叉核对。
- [A Deep Learning Approach to Antibiotic Discovery](https://doi.org/10.1016/j.cell.2020.01.021)，Cell，2020：以原始 Article DOI 为准，不混入更正条目的 DOI 10.1016/j.cell.2020.04.001。
- [Personalized microbiome-driven effects of non-nutritive sweeteners on human glucose tolerance](https://doi.org/10.1016/j.cell.2022.07.016)，Cell，2022：出版者页面与 Crossref 元数据交叉核对。

## 复算与维护

仓库运行 `python scripts/build_public_topics.py`，从公开索引与 `data/public-topic-taxonomy.json` 重算主题、代表条目和汇总。首次导入可传入四个来源参数，私人本机路径只作本地输入，不写入输出；来源 SHA-256 用通用标签记录。公开 CSV 可在网页按当前筛选导出，全文、PDF 和图片不随此库发布。

运行 `python -m unittest discover -s tests -p test_public_topics.py` 和 `node --test tests/public-topics.test.mjs tests/chat.test.mjs` 核对去重、主题分母、来源字段、隐私与入口行为；网页还需检查桌面和手机筛选及导航。
