---
name: propensity-score-design
description: 根据ATE/ATT等目标选择PSM、IPW或平衡权重，基于因果结构选择基线变量，检查共同支持、匹配后平衡与样本流失，并按匹配/聚类结构推断。
---

# ⚖️ PSM与加权：先让比较对象站到合适的位置

## 逻辑框架

**因果问题 → 目标人群/ATE或ATT → 基线混杂集合 → 倾向模型 → 匹配/加权 → 重叠与平衡 → 结局估计 → 敏感性。** 倾向评分是接受处理的条件概率，不是疾病风险分数；平衡只能覆盖所测量且正确处理的混杂。

先确认个体/机构是否有真实选择过程、暴露是否先于结局，以及是否可能存在未测量严重度、偏好或就医可及性。临床效果研究优先把设计放入目标试验框架；政策面板PSM-DID仍需平行趋势等DID假设。

## 匹配还是加权

| 路线 | 常见目标与代价 | 重点 |
|---|---|---|
| 最近邻PSM | 常用于ATT；不匹配者被排除 | 共同支持、卡钳、替换、比例、匹配结构 |
| IPW | 可构造ATE或ATT权重 | 正值性、极端权重、有效样本量 |
| overlap weighting | 重叠人群ATO | 目标人群与ATE/ATT不同，须明确 |
| 熵平衡 | 按预设矩约束构造平衡权重 | 约束可行性、权重集中、目标总体 |

不能仅按哪个方法P值最小选择。丢弃大量患者后，结论对象可能改变；匹配成功的病例并不代表原始总体。

## 具体操作

1. 画因果图，收集治疗前混杂和重要预后变量；不要按单因素P值或逐步回归筛选。慎加中介、碰撞点、纯工具变量及治疗后的值。
2. 检查变量编码、缺失与测量时点。先明确插补与匹配/加权如何整合，不能让不同模型随意切换完整案例样本。
3. 按目标估计PS并查看组间分布。PS模型预测AUC不是设计成功标准；目标是平衡关键协变量及必要交互/非线性。
4. 预设卡钳、比例、替换与排除规则。0.2倍logit(PS)标准差可作为教学起点，不能当所有情境的硬阈值。
5. 用标准化差异、分布图、方差比等评估平衡；|SMD|<0.1是常见参考，不是无混杂证明，不用“P>0.05”证明平衡。
6. 估计匹配/加权后的结局效应，考虑配对、重复使用对照、机构聚类与权重估计。最近邻匹配具有非光滑性，不能无条件套普通bootstrap。

## R教学样例：匹配ATT与诊断

```r
library(MatchIt)
library(cobalt)
set.seed(20261023)
n <- 1000
d <- data.frame(age=rnorm(n,65,8),severity=rnorm(n))
d$a <- rbinom(n,1,plogis(-.3+.03*(d$age-65)+.5*d$severity))
d$y <- 100+8*d$a+2*d$severity+.4*d$age+rnorm(n,0,10)
m <- matchit(a~age+severity,data=d,method="nearest",distance="glm",
  link="linear.logit",estimand="ATT",ratio=1,caliper=.2,std.caliper=TRUE)
summary(m)
love.plot(m,thresholds=c(m=.1))
md <- match.data(m)
fit <- lm(y~a,data=md,weights=weights)
lmtest::coeftest(fit,vcov.=sandwich::vcovCL(fit,cluster=~subclass))
# 示例为无替换1:1匹配；复杂替换/聚类设计需重新选择推断。
```

```stata
* ATT（Stata称ATET），a为处理，y为结局
teffects psmatch (y) (a age severity, logit), atet nneighbor(1)
tebalance summarize
* 这是内置估计器示例，不与R卡钳匹配的全部细节完全等价。
```

接口和距离定义参照 [MatchIt官方指南](https://kosukeimai.github.io/MatchIt/articles/MatchIt.html)。两组缺乏重叠时先讨论缩小目标人群或更换问题，不靠更复杂算法“匹出可比性”。

## 交付与易错点 🐾

输出估计目标、基线窗口、协变量选择依据、样本流程、共同支持图、平衡表/Love plot、匹配/权重规则、结局效应及未测量混杂局限。不要在多个卡钳之间根据结局显著性挑选；不要把匹配后组间相似当随机分配；PSM-DID的匹配使用政策前信息，匹配后的平行趋势仍须论证。

> 可复制请求：先明确ATE/ATT/ATO与因果变量集合，再比较PSM、IPW和重叠/熵平衡权重。给重叠、平衡、样本损失与推断方案，不只输出一张匹配后的回归表。
