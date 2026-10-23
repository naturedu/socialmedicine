# 生存分析与竞争风险

定义时间零点、事件与删失；竞争风险不是简单独立删失。

## 边界
所有代码为教学模板，未在真实数据执行；请核对数据字典、版本和包依赖。

## R 模板

```r
library(survival)
# event: 1事件 0删失；df为研究者数据
fit <- coxph(Surv(time,event) ~ exposure + age, data=df)
summary(fit); cox.zph(fit)
plot(survfit(Surv(time,event) ~ exposure,data=df))
# 竞争事件用累积发生函数/适当竞争风险模型，不将1-KM当作累积发生率
```

## STATA 模板

```stata
stset time, failure(event==1)
sts graph, by(exposure)
stcox exposure age
estat phtest, detail
* 若 event==2 为竞争事件，明确目标后考虑：
* stcrreg exposure age, compete(event==2)
```

