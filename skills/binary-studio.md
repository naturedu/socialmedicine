# 二元结局与边际效应

区分优势比、风险比与风险差；报告有解释性的绝对概率。

## 边界
所有代码为教学模板，未在真实数据执行；请核对数据字典、版本和包依赖。

## R 模板

```r
# df包含二元y、exposure、age
fit <- glm(y ~ exposure + age, family=binomial(), data=df)
summary(fit)
exp(cbind(OR=coef(fit), confint(fit)))
df0 <- transform(df,exposure=0); df1 <- transform(df,exposure=1)
mean(predict(fit,df1,type="response")-predict(fit,df0,type="response"))
# 上式为模型标准化差异，因果解释需额外识别假设；区间另用适当bootstrap
```

## STATA 模板

```stata
logit y i.exposure c.age, vce(robust)
margins exposure
margins, dydx(exposure)
* 优势比不等于风险比；设计、混杂控制和聚类层级需先确定
```

