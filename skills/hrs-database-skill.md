---
name: hrs-database
description: 以健康、工作退休和家庭经济为主线的纵向调查。Core、RAND、家庭、CAMS、退出和生物标志物产品分开。
---

# 🌍 HRS · Health and Retirement Study

核验日期：2026-10-23。以健康、工作退休和家庭经济为主线的纵向调查。Core、RAND、家庭、CAMS、退出和生物标志物产品分开。

## 产品先分流，再读字段

|产品|用途|先核对|
|---|---|---|
|Core原始波次|题级定义、政策/照护细节|HHID、PN、模块单位、代理及路由|
|RAND Longitudinal|跨波常用健康与经济变量|版本、波次范围、构造/回填规则|
|RAND Fat Files|单波原始模块便捷集合|仍区分个人、家庭及家庭成员层级|
|Family / CAMS|亲子/家庭关系、消费活动|子样本和家庭连接、消费周期|
|Exit / Post-Exit|死亡后家属资料与状态|本人键、退出调查时间与死亡时间|
|HCAP /生物标志物|认知或生物测量扩展|抽样资格、同意、访视、组件权重|

官方公共、敏感健康及受限链接产品有不同访问流程。RAND发布年份不是访谈年份；在文件清单保留明确版本。本机`hrs.csv`含426列、wave5—15；这是本机清洗范围，不能据此声称覆盖1992以来全部波次。

### 本机字段与常见误读

`hhidpn`标为个人键，不能当家庭键；保留字符读取，回查HHID/PN的补零及合成规则。本机`wtresp`、`wthh`、`wtr_nh`、`wtcrnh`和`lbwgtr`涉及不同目标样本/组件，不能择其数值最大者使用。`weight`为自报体重，`mweight`为测量体重；`oopmd`标签是过去两年自付医疗费，跨调查不能只换币值就与过去一年支出相并。

### 退休与健康研究

退休状态包括自报、劳动参与和养老金领取等不同概念。先构造实际退出劳动市场的事件或状态转移，再检验退休前健康变化。个体FE不能自动解决因病退休；以法定年龄作工具还需讨论资格、预期、其他年龄政策及排除限制。夫妻共同财富重复出现在个人表时，研究家庭总额需保留家庭单位；研究个人暴露则说明共享测量和家庭相关性。

### 外部验证与预测

按人划分训练/验证，家庭共享信息时按家庭划分；有外部国家验证时先冻结变量和模型。标准化和插补只在训练资料拟合。HRS美国样本预测器迁移到CHARLS前，核对年龄、服务制度、测量和随访窗口，报告校准与亚组表现，不能仅报AUC并宣布跨国适用。


## R与Stata：标准化层的最小接口

以下变量名是**分析层约定**，不是原始数据库通用字段。必须先完成题级映射。若没有所需设计变量，先回查官方设计文件，不能任意生成PSU或权重。

```r
# d: id=字符个人键, year=实际访谈年, y=已核对结局, x=预定协变量
stopifnot(!anyNA(d$id), !anyDuplicated(d[c("id", "year")]))
d <- d[order(d$id, d$year), ]
# 纵向条件关联；不自动等于政策因果效应
m <- fixest::feols(y ~ x | id + year, cluster = ~id, data = d)
summary(m)
# 按复杂抽样作描述应另用对应设计与权重，而非仅cluster=id。
```

```stata
* id_s 是字符键，pid 仅作当前数据内面板编码，不输出映射。
assert !missing(id_s, year)
isid id_s year
egen long pid = group(id_s)
xtset pid year
xtreg y x i.year, fe vce(cluster pid)
* 单波数据不运行此面板流程；先选择合适的survey描述/横断面模型。
```

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

- [HRS Data Downloads](https://hrsdata.isr.umich.edu/data-products)：注册、公共数据、敏感及受限数据的不同入口。
- [RAND HRS Products](https://hrsdata.isr.umich.edu/data-products/rand)：纵向、家庭、插补、退出等不同产品。
- [HRS Documentation](https://hrs.isr.umich.edu/documentation)：问卷、代码本、数据说明及跨波问题对照入口。
- [Gateway Harmonized Data](https://www.g2aging.org/harmonized-data/overview?dataset=2)：跨研究产品导航；统一变量仍有研究特定差异。
