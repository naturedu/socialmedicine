---
name: advanced-causal-inference
description: 根据政策赋值、面板结构和混杂机制选择SDID、DML、IPW/MSM或g方法，区分识别与估计，检查供体池、交叉拟合、权重和小簇推断。
---

# 🧭 因果方法进阶：让设计带路，让算法帮忙

## 先选问题，再选工具

| 数据与问题 | 候选路线 | 必须核对 |
|---|---|---|
| 少量城市政策、足够长政策前面板 | SCM / SDID | 供体未受干预、拟合质量、共同冲击、处理时点 |
| 多城市分批政策 | 分组-时间DID、适合交错处理的扩展 | 各批次可比对照、预期效应、异质效应 |
| 基线混杂多且关系复杂 | DML / 双稳健估计 | 可交换性、正值性、交叉拟合、目标参数 |
| 受既往治疗影响的时间变化混杂 | MSM/IPW、参数g-formula | 历史信息、删失机制、权重稳定性 |
| 风险效应对未测量因素敏感 | 定量偏倚/敏感性分析 | 假设范围及外部依据 |

PSM-DID、SDID、DDD、DML各有任务，不能按“越叠加越高级”选择。模型之间若估计对象、样本或时间窗不同，结果不同并不直接构成不稳健。

## SDID：空间与时间一起构造参照

输入地区×时间结局面板、处理开始时点、供体资格及同时发生的政策。先画原始趋势，再检查政策前加权拟合、单位权重与时间权重、单一供体支配、供体排除敏感性和政策溢出。少处理城市时，常规大簇渐近标准误可能不合适；置换需要说明可交换的单位集合及赋值假设。

```r
library(synthdid)
data("california_prop99")
z <- panel.matrices(california_prop99)
att <- synthdid_estimate(z$Y,z$N0,z$T0)
plot(att)
se <- sqrt(vcov(att,method="placebo"))
c(estimate=as.numeric(att),SE=as.numeric(se))
```

这是软件自带示例，不是本地项目结果。[synthdid官方实现](https://synth-inference.github.io/synthdid/) 要求这里的处理矩阵是同时开始的块状结构；交错政策不能直接塞入上述示例。政策前拟合好也不是因果识别的充分条件。

## DML：灵活处理混杂，保留目标参数

DML通常用机器学习估计干扰参数，借助正交得分和交叉拟合降低过拟合/正则化对目标参数推断的影响。它不会自动处理未测量混杂。部分线性模型的系数不应在任意异质效应场景下直接叫ATE；二元处理的ATE可另考虑适合的交互回归模型。

```r
library(DoubleML)
library(mlr3)
library(mlr3learners)
set.seed(20261023)
n <- 600
d <- data.frame(x1=rnorm(n),x2=rnorm(n))
d$a <- .5*d$x1+rnorm(n)
d$y <- .8*d$a+d$x1+d$x2^2+rnorm(n)
obj <- DoubleMLData$new(d,y_col="y",d_cols="a",x_cols=c("x1","x2"))
fit <- DoubleMLPLR$new(obj,
  ml_l=lrn("regr.rpart"),ml_m=lrn("regr.rpart"),n_folds=5)
fit$fit()
fit$summary()
```

该教学数据的部分线性系数为0.8；真实数据需选择与处理类型相符的模型、学习器和得分。面板/医院聚类数据应按依赖结构分割样本，调参也不能读取评估折。见 [DoubleML交叉拟合文档](https://docs.doubleml.org/stable/guide/resampling.html)。

## IPW/MSM与g方法：看清时间顺序

基线IPW先估计治疗概率，检查重叠、加权平衡、极端权重和有效样本量。纵向MSM需要把每期治疗及删失概率按历史连乘；记录分子/分母模型与截尾规则。g-formula则在干预策略下标准化结局；模型设定与时序必须与目标策略匹配。入门概念见 [Causal Inference: What If](https://www.hsph.harvard.edu/miguel-hernan/wp-content/uploads/sites/1268/2024/01/hernanrobins_WhatIf_2jan24.pdf)，设计先读目标试验模拟。

```stata
* 仅基线处理、固定时点结局的教学接口，不是纵向MSM
teffects aipw (y age severity) (a age severity), ate
tebalance summarize
```

## 交付与易错点 🐾

交付因果图/识别说明、估计目标、数据时间图、主分析及有针对性的敏感性分析。区分预测异质性与因果异质性；SHAP不能证明机制。政策文本得分不能充当政策实际执行强度的无误测量。不要把安慰剂P值当作自动通过证明，也不要因“只有两个处理城市”就声称任何模型都能补足信息。

> 可复制请求：请比较DID/SDID/DDD/DML对我的问题各自估计什么，列出识别假设、最小数据和不可检查部分，只推荐有数据支持的主路线与补充分析。
