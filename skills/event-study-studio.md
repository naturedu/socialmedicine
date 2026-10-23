# 交错 DID 与多时点事件研究

区分分组和时间效应；常规双向固定效应并不适用于所有异质交错处理。

## 边界
所有代码为教学模板，未在真实数据执行；请核对数据字典、版本和包依赖。

## R 模板

```r
# 依赖 did；g 为首次处理年，未处理者为 0
library(did)
fit <- att_gt(yname="y", tname="year", idname="id", gname="g",
              data=df, control_group="notyettreated", panel=TRUE,
              clustervars="id", bstrap=TRUE)
es <- aggte(fit, type="dynamic")
summary(es); ggdid(es)
# 另检查提前反应、样本组成、同期政策与平行趋势；更高政策层级需相应聚类
```

## STATA 模板

```stata
* 需 csdid 与 drdid；g=首次处理年份，未处理为0
csdid y, ivar(id) time(year) gvar(g) notyet method(dripw)
estat event
csdid_plot
* 聚类层级、控制组与协变量需按具体政策分配结构设置
```

