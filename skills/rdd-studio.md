# 断点回归 · RDD

适用明确阈值分配规则；检查操纵、连续性、带宽与局部解释。

## 边界
所有代码为教学模板，未在真实数据执行；请核对数据字典、版本和包依赖。

## R 模板

```r
# 依赖 rdrobust / rddensity；df 包含 y、running
library(rdrobust)
library(rddensity)
cutoff <- 0 # 替换为真实制度阈值
fit <- rdrobust(y=df$y, x=df$running, c=cutoff, p=1)
summary(fit)
summary(rddensity(X=df$running, c=cutoff))
rdplot(y=df$y, x=df$running, c=cutoff)
# 模糊断点需另传 fuzzy=df$treatment；不得用高阶全局多项式代替局部识别
```

## STATA 模板

```stata
* 依赖：ssc install rdrobust / rddensity（自行确认安装）
* 数据含 y running；阈值 0 仅为模板
rdrobust y running, c(0) p(1)
rddensity running, c(0)
rdplot y running, c(0)
* 模糊断点：rdrobust y running, c(0) fuzzy(treatment)
```

