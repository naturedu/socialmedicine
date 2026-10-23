---
name: aging-family-extension
description: 补充亚洲、欧洲、拉美老龄研究与认知扩展，并明确文档核验深度。
---

# 🪴 HRS家族扩展 · JSTAR、TILDA、CRELES、SPS、MARS与HCAP

核验日期：2026-10-23。补充亚洲、欧洲、拉美老龄研究与认知扩展，并明确文档核验深度。


## 逐个找入口，逐个定边界

以下为公开项目/产品导航和分析准备，不声称已获得或读取全部微观数据。具体访谈轮次、样本量及权重尚未逐版核对的不预填；这比把不确定数字写成固定常识更便于后续维护。

|研究|本次核验层级|下一步读取|适合先评估的主题|
|---|---|---|---|
|JSTAR 日本|RIETI项目/申请信息|批准层级、地区覆盖、抽样与题本|退休、家庭与健康|
|TILDA 爱尔兰|Trinity访问说明|公共/受限文件、健康评估样本和权重|功能、孤独与社会资源|
|CRELES 哥斯达黎加|Gateway核心产品目录|具体入组队列、年份、年龄和权重|高龄健康、功能与照护|
|SPS–ENCAVIDAM 智利|官方条件与项目资料|EPS主面板到老龄扩展的选择和连接|社会保护、劳动与老年生活质量|
|MARS 马来西亚|Gateway核心产品目录|所获版本题本、波次、抽样和退出状态|健康、退休及家庭经济|
|Chile-Cog 智利|团队及Gateway认知产品目录|认知扩展入样、知情人、计分及主调查键|认知差异与社会经济资源|
|WHO SAGE 六国|WHO设计简介|各国各轮题本、权重与数据访问|中低收入国家功能和服务差异|

## 核心、生命历程、退出与认知不能混成同一波

Gateway目录区分Core、End of Life、Life History、Covid和HCAP；并非每个研究都有全部产品。HRS-HCAP、ELSA-HCAP、Mex-Cog、LASI-DAD和Chile-Cog等认知扩展应回到各自主调查和子样本设计。因子分数/临床分类需要了解建模和验证，不能仅因名称含Harmonized就把各国诊断阈值等同。

项目名相似不保证样本全国代表、间隔相同或所有指标齐全。WHOSAGE有其独立设计和题体，CLHLS以高龄为重点，NHANES为健康检查调查；可围绕共同概念作平行比较，但保留来源和设计差异。

## 读到微观数据后再升级核验状态

按顺序补：访问许可→发布版本→样本框→主键/模块单位→波次日期→问卷/值标签→权重设计→可用性矩阵→连接诊断→小样本描述。核验状态从“目录核对”提升到“元数据核对”“分析层核对”“模型执行”，每一级给具体文件和记录，不用“已覆盖”代替细节。

研究选题先看所需字段是否真实存在。仅一个访谈期不能估计个体轨迹；退出问卷的家属回顾不等同本人同时点自报；实际缺测与未被抽中进入扩展分开。跨国协调的完整路线见[协调与外部验证](cross-cohort-harmonization-skill.md)。

## 🧺 先把数据放进正确的小篮子

建立文件清单：`study / release / module / wave / visit_date / unit / key / source / permission`。文件名中的版本字母、下载年份和访谈波次分开。原始文件只读；另存标准化层和分析层。先输出字段名、标签、值标签、缺失码和连接诊断，再决定变量能否使用。

每个分析变量至少记录：概念、原题、来源变量、适用人群、回顾窗口、单位、跳答路径、特殊码、代理回答、派生公式、可用波次、权重及核验状态。不得只凭中文列名判断值域或方向；`weight`在多份表中是体重。

## 从问题到估计的顺序

1. 写清目标人群、暴露/政策、比较组、结局和时间零点。区分人群患病比例、个体内变化、预测准确性和政策效应。
2. 画样本流：原始入样→年龄/资格→完成访谈→完成测量→连接随访→分析样本。死亡、失访、跳题、拒答、未测量分别记，不统一改成0。
3. 描述研究所需字段在每波的可用性。两波数据最多支持一次变化；多波轨迹需要足够重复观测、可比较测量与合理类数。
4. 按估计目标选择横断面、纵向或特定组件权重；权重不能凭变量名相似借用。失访加权需要可解释的响应模型和正值性诊断。
5. 面板FE估计的是个体内关联；PSM不能消除未测混杂；交错DID还需真实政策起始、前期趋势和有效对照；TTE需对齐资格、分组及随访起点。
6. 保留未加权人数、加权估计与区间。重复测量、家庭和地区依赖按设计处理；缺失值插补与抽样设计的结合需写明方法，避免把插补当作增加独立样本。

## 交付与报告

交付版本清单、变量字典、跨波可用矩阵、连接诊断、样本流、缺失/失访表、模型脚本和执行记录。公共教程仅包含方法与元数据；获准数据留在授权环境。问卷存在某题、当前文件有字段、分析样本有有效观测是三个不同层次。

相关路线：[纵向研究](longitudinal-public-data-skill.md)、[PSM/加权](propensity-score-skill.md)、[分批DID](staggered-did-skill.md)、[目标试验模拟](target-trial-emulation-skill.md)、[计量模型](econometric-modeling-skill.md)。R/Stata代码为接口模板，本次未在这两个运行时执行。

## 官方出处与版本边界

- [Gateway Harmonized Data](https://www.g2aging.org/harmonized-data/overview?dataset=2)：跨研究产品导航；统一变量仍有研究特定差异。
- [RIETI JSTAR](https://www.rieti.go.jp/en/projects/jstar/index.html)：项目与分级申请说明。
- [TILDA Accessing Data](https://tilda.tcd.ie/data/accessing-data/)：公共与受限访问路径；限非商业实体。
- [ENCAVIDAM 官方数据条件](https://previsionsocial.gob.cl/datos-estadisticos/condiciones-bases-de-datos-encavidam/)：EPS与ENCAVIDAM衔接及数据使用条件。
- [Chile-Cog 团队数据说明](https://web.sas.upenn.edu/harmonized-cognitive-assessment-protocol-chile/data/)：SPS、ENCAVIDAM与认知项目的不同层次。
- [WHO SAGE](https://www.who.int/data/data-collection-tools/study-on-global-ageing-and-adult-health)：六国纵向设计、50岁及以上和年轻比较组。
