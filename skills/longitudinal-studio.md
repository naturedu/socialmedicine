# 纵向轨迹、混合模型与多时点作图

重复测量应处理个体内相关；轨迹图、混合效应和 GEE 的目标不同。

## 边界
所有代码为教学模板，未在真实数据执行；请核对数据字典、版本和包依赖。

## R 模板

```r
# 依赖 lme4 / ggplot2；df包含id time y group
library(lme4); library(ggplot2)
fit <- lmer(y ~ time * group + (1 + time | id), data=df)
summary(fit)
ggplot(df, aes(time,y,group=id,colour=factor(group))) +
 geom_line(alpha=.10) +
 stat_summary(aes(group=group),fun=mean,geom="line",linewidth=1.2) +
 theme_classic()
# 检查非线性、缺失机制及随机效应结构；均值轨迹不等同潜在类别
```

## STATA 模板

```stata
* id time y group；先检查时间尺度与重复记录
isid id time
xtset id time
mixed y c.time##i.group || id: time, covariance(unstructured)
margins group, at(time=(0 1 2 3))
marginsplot
* 非正态结局可考虑GEE：xtgee y c.time##i.group, family(binomial) link(logit) corr(exchangeable) vce(robust)
```

