---
name: monte-carlo-simulation
description: 区分蒙特卡洛方法学模拟、卫生经济PSA与个体随机模拟，按ADEMP设计，计算偏倚、覆盖率、效能和Monte Carlo误差，记录随机种子与失败。
---

# 🎲 蒙特卡洛模拟：让方法先在“知道答案的小世界”里练习

## 先分清三种任务

| 任务 | 每次重复什么 | 真正关注什么 |
|---|---|---|
| 方法学模拟 | 从已知机制生成一份新数据再估计 | 偏倚、覆盖率、I类错误、效能、失败率 |
| 概率敏感性分析 PSA | 抽取一组不确定的模型参数 | 决策不确定性、增量净收益、CEAC |
| 个体随机模拟 | 给定参数后模拟个体事件或路径 | 个体随机变异、资源利用、成本与健康 |

蒙特卡洛是一类随机数值计算方法，不等同于Markov模型。Markov是模型结构，蒙特卡洛可用来运行个体模型或传播其参数不确定性。可交叉阅读 Markov 与卫生经济学教程。

## 方法学模拟：ADEMP任务书

按 [Morris、White与Crowther的教程](https://doi.org/10.1002/sim.8086) 组织：目标A、数据生成D、估计目标E、待比较方法M、性能P。下列是可填写模板：

- A：在小样本、偏态费用和不同失访机制下，比较两种费用差估计的区间表现。
- D：样本量、基线风险、混杂强度、组内相关、缺失机制、真实效应；参数来源及合理范围。
- E：人群平均费用差；各方法必须针对同一个目标。
- M：估计流程包含变量处理、模型选择、区间方法与失败后的预设处理。
- P：偏倚、RMSE、经验SD、平均模型SE、覆盖率、区间宽度、拒绝率和失败率。

先跑小规模排错，再按精度需求确定重复次数。若覆盖率约0.95，B=2000时MCSE约0.0049；B=10000时约0.0022。这是模拟结果自身的数值不确定性，不是原研究效应的标准误。

## R：两组均值差的完整教学实验

```r
set.seed(20261023)
B <- 2000; n <- 100; truth <- 0.3
one <- function(){
  y0 <- rnorm(n,0,1); y1 <- rnorm(n,truth,1.5)
  z <- t.test(y1,y0) # Welch；估计方向为y1-y0
  c(est=mean(y1)-mean(y0),lo=z$conf.int[1],hi=z$conf.int[2],p=z$p.value)
}
ans <- t(replicate(B,one()))
err <- ans[,"est"]-truth
covered <- ans[,"lo"]<=truth & ans[,"hi"]>=truth
coverage <- mean(covered)
c(bias=mean(err),MCSE_bias=sd(ans[,"est"])/sqrt(B),
  RMSE=sqrt(mean(err^2)),coverage=coverage,
  MCSE_coverage=sqrt(coverage*(1-coverage)/B),
  power=mean(ans[,"p"]<.05))
# 将truth设为0并重新生成数据，才能估计该场景的I类错误率。
```

```stata
clear
set seed 20261023
capture program drop mc_mean
program define mc_mean, rclass
    drop _all
    set obs 200
    gen byte a = _n > 100
    gen y = .3*a + rnormal(0,cond(a==1,1.5,1))
    quietly regress y a, vce(robust)
    return scalar est = _b[a]
    return scalar se = _se[a]
    return scalar covered = abs((_b[a]-.3)/_se[a]) <= invttail(e(df_r),.025)
end
simulate est=r(est) se=r(se) covered=r(covered), reps(2000): mc_mean
summarize est se covered
* Stata示例用稳健回归区间，R示例用Welch区间，二者并非完全同一方法。
```

## PSA：用增量净收益表达决策

```r
set.seed(20261023)
B <- 10000
delta_cost <- rnorm(B,1200,300)
delta_qaly <- rnorm(B,.08,.025)
lambda <- seq(0,100000,by=5000) # 教学阈值范围，不是政策推荐
ceac <- sapply(lambda,function(k) mean(k*delta_qaly-delta_cost>0))
data.frame(lambda,Pr_cost_effective=ceac)
```

这里直接抽取增量分布仅供演示，且假定两增量独立。正式PSA从完整模型的参数联合分布抽样，保留成本—效果及转移概率之间的相关性。概率/效用可考虑Beta，正成本可考虑Gamma或对数正态，同一行转移概率可考虑Dirichlet；分布应由参数含义、估计结果和拟合证据支持。见 [ISPOR参数与不确定性指南](https://www.ispor.org/publications/journals/value-in-health/abstract/Volume-15--Issue-6/Model-Parameter-Estimation-and-Uncertainty--A-Report-of-the-ISPOR-SMDM-Modeling-Good-Research-Practices-Task-Force-6)。

## 质量检查与复现

保存场景表、随机种子、随机数生成器、软件/包版本、每次估计结果与失败原因。并行运行使用独立随机数流，不能给每个worker相同种子。比较方法时可在同一模拟数据上配对运行，提高比较精度；个体模型的共同随机数也需检查路径对齐。

复杂模型分别考察结构、参数、情景与个体变异；增加人数只能减少个体模拟噪声，不能消除参数不确定性。参见 [AHRQ建模与模拟指南](https://effectivehealthcare.ahrq.gov/products/decision-models-guidance/methods)。

## 小心这几个坑 🐾

不报告失败率；为了得到显著结果反复换种子；把2000次重复当2000个真实患者；只在单一有利场景测试；PSA逐项独立抽样破坏相关；把“成本效果概率高”解释为临床有效概率高。

## 可复制请求

> 请先判断我是方法学模拟、PSA还是个体模拟，写ADEMP/参数任务书和误差目标，再给小规模可运行样例。报告MCSE、失败率与可复现设置，所有教学参数明确标注。
