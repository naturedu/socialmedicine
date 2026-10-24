# 微观模拟：论文示例、用途与核验范围

核对日期：2026-10-24。结合公开论文、出版者、作者机构、PubMed/PMC及Crossref记录核对题名、作者、年份、期刊和DOI。仅保留重新表述的方法摘要和链接；页码为PDF页序，正式研究需回访原文。

| 来源 | 类型与可借鉴内容 | 证据位置与限制 |
|---|---|---|
| Krijkamp EM, Alarid-Escudero F, Enns EA, et al. (2018). *Microsimulation Modeling for Health Decision Sciences Using R: A Tutorial*. Medical Decision Making, 38(3), 400–422. [DOI](https://doi.org/10.1177/0272989X18754513) · [作者机构](https://pure.eur.nl/en/publications/microsimulation-modeling-for-health-decision-sciences-using-r-a-t/) | 状态转移算法、向量化、个体属性及病程扩展 | PDF pp.3–15算法和扩展示例。假想问题不能用作疾病参数。本库R为独立原创实现；[作者代码入口](https://github.com/DARTH-git/Microsimulation-tutorial)单独保留。 |
| Eom H, Li Y. (2020). *Developing High-Quality Microsimulation Models Using R in Health Decision Sciences*. Winter Simulation Conference, 1167–1177. [DOI](https://doi.org/10.1109/WSC48552.2020.9384037) · [会议原文](https://www.informs-sim.org/wsc20papers/138.pdf) · [作者机构](https://scholars.mssm.edu/en/publications/developing-high-quality-microsimulation-models-using-r-in-health--2/) | SHINE示例和R模型开发质量 | PDF pp.1、5–10。作为开发方法入口，不声称实现SHINE。 |
| Brück CC, Wolters FJ, Ikram MA, de Kok IMCM. (2022). *Projected prevalence and incidence of dementia accounting for secular trends and birth cohort effects: a population-based microsimulation study*. European Journal of Epidemiology, 37, 807–814. [DOI](https://doi.org/10.1007/s10654-022-00878-1) · [PubMed](https://pubmed.ncbi.nlm.nih.gov/35731313/) | MISCAN-Dementia：出生队列、死亡和发病趋势 | PDF pp.2–3与补充材料生命表/校准。荷兰发病趋势不可未经验证移植中国。 |
| Brück CC, Wolters FJ, Ikram MA, de Kok IMCM. (2023). *Projections of costs and quality adjusted life years lost due to dementia from 2020 to 2050: A population-based microsimulation study*. Alzheimer's & Dementia, 19, 4532–4541. [DOI](https://doi.org/10.1002/alz.13019) · [出版者](https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.13019) | 严重度、照护场所、病人/照护者成本与QALY损失 | PDF pp.2–4。人口负担预测不能直接解释为干预增量成本效果或中国效用参数。 |
| Kasajima M, Eggleston K, Kusaka S, et al. (2022). *Projecting prevalence of frailty and dementia and the economic cost of care in Japan from 2016 to 2043: a microsimulation modelling study*. The Lancet Public Health, 7, e458–e468. [DOI](https://doi.org/10.1016/S2468-2667(22)00044-5) · [全文记录](https://pmc.ncbi.nlm.nih.gov/articles/PMC9094718/) | JFEM：多病、功能、认知/衰弱联合状态和教育分层 | PDF pp.2–4及补充技术说明1–3。包含外部和回溯验证；制度、测量及费用需本地重估。 |
| Jutkowitz E, Pizzi LT, Shewmaker P, et al. (2023). *Cost effectiveness of non-drug interventions that reduce nursing home admissions for people living with dementia*. Alzheimer's & Dementia, 19, 3867–3893. [DOI](https://doi.org/10.1002/alz.12964) · [出版者](https://alz-journals.onlinelibrary.wiley.com/doi/10.1002/alz.12964) | 个体照护过程、机构入住HR、社会视角增量评价 | PDF pp.2–5及敏感性分析。区别同主题较早会议摘要；引用采用出版者及Crossref登记页码。 |
| Quan J, Zhao Z, Wang L, et al. (2023). *Potential health and economic impact associated with achieving risk factor control in Chinese adults with diabetes: a microsimulation modelling study*. The Lancet Regional Health – Western Pacific, 33, 100690. [DOI](https://doi.org/10.1016/j.lanwpc.2023.100690) · [全文记录](https://pmc.ncbi.nlm.nih.gov/articles/PMC10166995/) | CHIME年度个体模型、风险因素控制情景与外部验证路径 | PDF pp.3–4。CHARLS用于既有模型外部验证；不是任意清洗表可直接复现。风险控制情景与真实干预成本效果分别界定。 |
| Liu Y, Wu Y, Chen Y, et al. (2024). *Projection for dementia burden in China to 2050: a macro-simulation study by scenarios of dementia incidence trends*. The Lancet Regional Health – Western Pacific, 50, 101158. [DOI](https://doi.org/10.1016/j.lanwpc.2024.101158) · [作者机构](https://www.repository.cam.ac.uk/items/355f81d9-5065-45aa-bfea-59b688d9dfee) | **宏观Markov对照**：IMPACT-CAM、人口进入、趋势情景和负担分解 | PDF pp.2–4明确宏观模拟，不能归为个体微观模拟；使用CHARLS/CLHLS也不改变模型层级。 |

## 核验范围与权利

8条均核对公开书目信息并定位论文方法内容，用于区分模型家族、用途与限制；不表示全部参数、公式、原始数据和代码均审计或重跑。

本模块提供精选方法示例，不构成系统综述或完整复现。仅发布公开来源、原创说明与教学代码。

论文和作者代码各适用自己的许可；本库MIT仅覆盖原创说明和代码。摘要为方法用途的重新表述，不复制图片、表格、整段原文或补充材料，也不捆绑作者代码。引用入口不意味着取得数据或软件的再发布授权。
