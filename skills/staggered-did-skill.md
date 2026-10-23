---
name: staggered-did
description: 分批实施政策的现代DID，定义cohort-time ATT、从未/尚未处理对照与无预期假设，选择Callaway-SantAnna或Sun-Abraham路线并检查事件窗、小簇和聚合权重。
---

# 🪜 交错DID：每一批政策，都找对它的参照

## 为什么要单独处理

城市分不同年份实施医保政策，且效应随批次或持续时间变化时，简单TWFE处理系数或传统事件研究可能混入不合适的比较。不能默认所有TWFE都无效；需要根据赋值、异质性及目标判断。逻辑是：**政策赋值 → 首次处理批次g → 合格对照 → ATT(g,t) → 预期/动态窗口 → 聚合 → 推断。**

## 数据与识别

每单位每期一行，`g`表示首次接受处理的时期，从未处理按实现规定编码。核对发布日期、实际执行日、机构覆盖及政策退出。标准吸收性DID设计假定处理开始后持续；反复开关、剂量变化与多政策相互作用需另设方法。

识别依赖适当对照下的平行趋势、无预期效应以及相关重叠/抽样条件。尚未处理单位只在其处理前可作为对照；如果预期行为提前发生，要设提前期或调整对照窗。政策影响邻近地区时，需检查溢出污染。

## 估计路线

| 方法 | 输出与适用 | 重点 |
|---|---|---|
| Callaway–Sant'Anna | 先估ATT(g,t)，再按批次/时间/事件时间聚合 | 对照定义、条件趋势、权重和支持 |
| Sun–Abraham事件研究 | cohort×event-time交互与相应聚合 | 合格参照批次、远端窗口和基准期 |
| 其他现代DID | 插补、堆叠等设计 | 各自的对照、样本权重与估计目标 |

不要把不同方法结果仅按显著性排队。先对齐目标、事件窗和样本支持，再讨论差异。

## R：软件自带面板的C&S演示

```r
library(did)
data(mpdta)
att <- att_gt(yname="lemp",tname="year",idname="countyreal",
  gname="first.treat",xformla=~1,data=mpdta,panel=TRUE,
  control_group="nevertreated",est_method="dr",bstrap=TRUE,cband=TRUE)
summary(att)
dyn <- aggte(att,type="dynamic",min_e=-2,max_e=2)
summary(dyn)
ggdid(dyn)
aggte(att,type="group")
```

`xformla=~1`的例子不使用协变量，不能宣称因此已调整全部混杂。若选择 `notyettreated`，明确各时点的参照集合；软件的面板平衡要求与可用样本需核对。[did官方教程](https://bcallaway11.github.io/did/articles/did-basics.html)。

```r
library(fixest)
# 教学接口：d中never-treated的g按sunab文档编码；不得直接复制did的0编码
# d$g_sa <- ifelse(d$g==0, max(d$year)+100, d$g)
# m <- feols(y ~ sunab(g_sa,year,ref.p=-1) | id+year,data=d,cluster=~id)
# iplot(m)
```

`sunab()`对从未处理/始终处理的识别由cohort值与观测period范围决定，见 [官方说明](https://lrberge.github.io/fixest/reference/sunab.html)。不同包的编码不能混用。

```stata
* 第三方csdid；先核对所装版本help csdid，g=0为从未处理
* ssc install csdid
* ssc install drdid
csdid y x_pre, ivar(id) time(year) gvar(g) method(dripw) cluster(id)
estat simple
estat event, window(-2 2)
```

这里 `x_pre`需为预先定义、合适的政策前变量。按政策赋值单位聚类；若处理在城市层面，不能仅因有海量患者就按患者聚类来获得更小SE。城市很少时，须评估与估计器兼容的小簇推断或设计型分析，不能简单依赖常规正态区间。

## 动态图如何解释

显示每个事件时间由哪些批次/单位支持，避免远端只剩少数批次仍与中间期同等解释。政策前系数不显著不是平行趋势证明；结合制度时间线、联合检验、区间及偏离趋势的敏感性讨论。逐点区间与同时置信带须标清。

## 交付与易错点 🐾

批次分布表、处理时点核验、对照规则、ATT(g,t)、事件图、聚合权重、支持与推断说明。PSM不是交错DID偏误的自动修复；加入更多控制变量也不自动修正错误比较；机制变量若受政策影响，不应当作普通基线混杂控制。

> 可复制请求：请先核对首治批次、持续处理、预期效应和对照支持，再制定ATT(g,t)与事件窗。对齐C&S或Sun–Abraham的编码，报告聚合权重、小簇局限和政策前证据。
