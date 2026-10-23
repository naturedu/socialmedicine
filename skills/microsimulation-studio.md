# 个体微观模拟 · Microsimulation

个体异质性、路径依赖与随机转移；演示仅使用虚构参数。

## 边界
所有代码为教学模板，未在真实数据执行；请核对数据字典、版本和包依赖。

## R 模板

```r
# 教学模拟；参数不来自真实疾病，禁止直接作临床或政策结论
set.seed(2026)
N <- 10000; T <- 20
state <- rep(1L, N) # 1健康、2患病、3死亡
age <- runif(N, 40, 60); qaly <- numeric(N)
for (t in seq_len(T)) {
  old <- state
  pdeath <- pmin(0.20, 0.005 * exp(0.06 * (age + t - 40)))
  for (s in 1:2) {
    ids <- which(old == s); u <- runif(length(ids))
    pd <- pdeath[ids] * ifelse(s == 2, 1.5, 1)
    psick <- if (s == 1) 0.03 else 0
    stopifnot(all(pd + psick <= 1))
    state[ids[u < pd]] <- 3L
    state[ids[u >= pd & u < pd + psick]] <- 2L
  }
  # 半周期近似；贴现率仅为教学输入，实际需依据指南
  utility <- c(1, 0.7, 0)
  qaly <- qaly + (utility[old] + utility[state])/2 / 1.03^(t-0.5)
}
print(table(state)); print(mean(qaly))
# 政策比较需共同随机数、多次重复、参数与一阶不确定性分开评估
```

## STATA 模板

```stata
* 教学微模拟；虚构参数，年度周期
clear
set seed 2026
set obs 10000
gen id = _n
gen age = 40 + 20*runiform()
gen state = 1
gen qaly = 0
forvalues t = 1/20 {
  gen old = state
  gen pd = min(.20, .005*exp(.06*(age+`t'-40)))
  replace pd = 1.5*pd if old==2
  gen u = runiform()
  replace state = 3 if old<3 & u<pd
  replace state = 2 if old==1 & u>=pd & u<pd+.03
  gen u0 = cond(old==1,1,cond(old==2,.7,0))
  gen u1 = cond(state==1,1,cond(state==2,.7,0))
  replace qaly = qaly + (u0+u1)/2/1.03^(`t'-.5)
  drop old pd u u0 u1
}
tab state
summarize qaly
```

