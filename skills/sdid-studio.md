# 合成双重差分 · Synthetic DID

结合单位与时间权重；要求适合的面板结构和有效对照。

## 边界
所有代码为教学模板，未在真实数据执行；请核对数据字典、版本和包依赖。

## R 模板

```r
# 依赖 synthdid；df: unit,time,outcome,treated（处理后为1）
library(synthdid)
pm <- panel.matrices(df, unit="unit", time="time",
                     outcome="outcome", treatment="treated")
tau <- synthdid_estimate(pm$Y, pm$N0, pm$T0)
print(tau); plot(tau)
se <- sqrt(vcov(tau, method="placebo"))
print(se)
# 此模板针对包支持的块状处理，不能直接套用任意交错实施
```

## STATA 模板

```stata
* 依赖 sdid；balanced panel，treated为实际受处理的单位-时间状态
sdid outcome unit time treated, vce(placebo) seed(2026)
* 检查对照池、处理前拟合、同期冲击和推断方法有效性
```

