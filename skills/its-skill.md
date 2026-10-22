# Skill：间断时间序列助手（ITS 政策效果评估，Stata / R）

**版本** 1.0 · **作者** 杜思娴 (Du Sixian) · **许可** MIT · **更新** 2026-10-23

## 用途

一份可复用的「间断时间序列分析（Interrupted Time Series, ITS）」工作流：用于评估**单一地区/机构在某个明确时点实施的政策**（如医保支付方式改革、药品集中带量采购落地、抗菌药物专项整治「限抗令」等）对结局时间序列的**即时水平变化与趋势变化**。内容覆盖研究设计与数据要求、分段回归模型、自相关处理、Stata（`newey` / `itsa`）与 R（`lm` + `NeweyWest`）的估计对照、拟合与反事实作图、稳健性检验（安慰剂时点、季节调整、控制组 ITS、异常值敏感性）与报告清单。**每一步都给出「方法 + 代码」**，可直接作为提示词喂给大语言模型，也可作为操作手册照做。

**贯穿全篇的示例场景**：「某院 DRG 付费改革（第 25 个月起实施）对次均住院费用（月度序列）的影响」。第 1 步给出 Stata 与 R 两套完全可运行的模拟数据代码，数据为 48 个月 = 干预前 24 + 干预后 24，内置真实干预效应：**即时水平变化 β2 = −600 元、斜率变化 β3 = −30 元/月**（干预前趋势 β1 = −50 元/月、干预时点基线 β0 = 12000 元、AR(1) 误差 ρ = 0.3）。后续各步全部沿用这份数据。

## 适用范围（明确边界）

允许：
- 评估单一地区/机构在**明确时点**实施的政策对连续结局时间序列的效应（卫生政策评估、药物利用研究、医院管理、医保改革等）
- 单组 ITS 与对照（双组）ITS（CITS）的分段回归设定、估计与作图
- 自相关诊断（ACF / Durbin-Watson / Cumby-Huizinga / Breusch-Godfrey）与 Newey-West（HAC）标准误修正
- 安慰剂时点、季节调整、异常值敏感性等稳健性检验

**不允许：**
- 在干预**无明确时点**（政策渐进落地、长期渐变）时硬性切割时间轴冒充 ITS
- 把单组 ITS 的关联结论直接当成强因果结论（无对照无法排除同期事件）
- 本 Skill 聚焦**连续结局的线性 ITS**；计数结局（如月感染例数）需 Poisson / 负二项 ITS，方法同理、链接函数不同，需另查对应文献
- 承诺结果一定可发表；不替代计量经济学教科书与期刊审稿要求（如要求 CITS、检验力分析等）

## 软件准备

方法：Stata 17 及以上、R ≥ 4.2。Stata 侧 `newey` 为官方命令；`actest`、`itsa`、`estout` 来自 SSC；R 侧 `lmtest`（`coeftest`、`dwtest`、`bgtest`）、`sandwich`（`NeweyWest`）、`car`（`linearHypothesis`、`deltaMethod`）为核心包，`ggplot2`、`texreg` 为作图与出表备选。

```stata
* Stata（联网安装一次）
ssc install actest, replace
ssc install itsa,   replace
ssc install estout, replace
```

```r
# R
install.packages(c("lmtest", "sandwich", "car", "ggplot2", "texreg"))
```

## 工作流程总览（7 步）

1. 适用条件与研究设计（含数据要求与模拟数据）→ 2. 分段回归模型 → 3. 自相关处理 → 4. 模型估计（Stata `newey`/`itsa` 与 R `lm`+`NeweyWest` 对照）→ 5. 图形呈现（拟合 + 反事实）→ 6. 稳健性与检验 → 7. 报告清单。以下每一步均为「方法 + 代码」。

---

### 第 1 步：适用条件与研究设计（含数据要求与模拟数据）

**方法**：

- **何时用 ITS**：① 干预在**明确的单一（或少数）时点**实施；② 干预前后各有**连续、等间隔**的时间序列（月度/季度/周度）；③ 结局在干预前已有可测的基线趋势；④ 有**足够长的序列**：经验上干预前后**每段至少 8–12 个观测点**（Wagner 等建议每段 ≥ 8 点才能可靠估计趋势；24 个点/段更稳）；⑤ 干预时点可精确对应序列中的某一期（本例：第 25 个月）。
- **数据要求**：结局变量（次均费用，元）、时间变量（月）、干预指示变量；序列无重大缺失（缺失期需插补并说明）；异常值记录在案。
- **分段回归思想**：把序列按干预时点切成两段，用一条带「断点」的回归同时估计——干预前的水平与趋势（β0、β1）、干预时的**即时水平跳变**（β2）与干预后的**趋势改变**（β3）。反事实（无干预会发生什么）由干预前趋势外推得到。
- **识别前提**：单组 ITS 的主要威胁是**同期混杂**（同一时点发生的其他政策/事件），故第 6 步必做安慰剂检验；有对照地区/机构时应升级为 CITS。

**代码**（贯穿全篇的模拟数据；Stata 与 R 各一份，参数相同）：

```stata
* =====================================================================
* 模拟数据：48 个月 = 干预前 24（第 1–24 月）+ 干预后 24（第 25–48 月）
* 场景：某院 DRG 付费改革（第 25 个月实施）对次均住院费用（元）的影响
* 内置真实干预效应：
*   β0 = 12000（干预时点基线，元）  β1 = -50（干预前趋势，元/月）
*   β2 = -600 （即时水平变化，元）  β3 = -30（斜率变化，元/月）
* 误差：AR(1)，rho = 0.3，扰动标准差 200 元
* =====================================================================
clear all
set seed 2026
set obs 48
gen time        = _n
gen time_c      = time - 25               // 中心化：干预时点 = 0
gen level       = time >= 25              // 干预指示：第 25 个月起 = 1
gen trend_after = time_c * level          // 干预后斜率增量（干预前恒为 0）

* AR(1) 误差
gen e = rnormal(0, 200)
forvalues t = 2/48 {
    replace e = 0.3 * e[_n-1] + rnormal(0, 200) if time == `t'
}

* 结局：次均住院费用（元）
gen y = 12000 - 50*time_c - 600*level - 30*trend_after + e

tsset time
twoway (line y time), xline(24.5, lpattern(dash)) ///
    title("模拟月度序列：次均住院费用") ytitle("元") xtitle("月份")
```

```r
# =====================================================================
# 模拟数据（与 Stata 版同参数；随机数实现不同，不影响示例）
# =====================================================================
set.seed(2026)
n           <- 48
time        <- 1:n
time_c      <- time - 25                 # 中心化：干预时点 = 0
level       <- as.numeric(time >= 25)    # 干预指示：第 25 个月起 = 1
trend_after <- time_c * level            # 干预后斜率增量

# AR(1) 误差：rho = 0.3，扰动 sd = 200
e <- as.numeric(arima.sim(model = list(ar = 0.3), n = n, sd = 200))

# 结局：次均住院费用（元），内置真实效应
y <- 12000 - 50*time_c - 600*level - 30*trend_after + e

dat <- data.frame(time, time_c, level, trend_after, y)
plot(y ~ time, data = dat, type = "o", pch = 16, cex = 0.7,
     main = "模拟月度序列：次均住院费用", xlab = "月份", ylab = "元")
abline(v = 24.5, lty = 2, col = "gray50")
```

---

### 第 2 步：分段回归模型

**方法**：

分段回归（segmented regression）模型：

Y_t = β0 + β1·time_c + β2·level + β3·trend_after + ε_t

- **β0**：干预时点处（time_c = 0）的反事实基线——若无干预，干预时点的期望结局水平；
- **β1**：**干预前斜率**（干预前每月平均变化，元/月）；
- **β2**：**即时水平变化**（level change）——干预时点的一次性跃变（元）；
- **β3**：**斜率变化**（trend change）——干预后斜率与干预前斜率之差（元/月）；
- 干预后总斜率 = β1 + β3；干预后第 k 个月相对反事实的总效应 = β2 + k·β3（本例期末第 48 个月 k = 23 → 真实总效应 = −600 + 23×(−30) = −1290 元）。

**中心化的写法与意义**：`time_c = time − 25`，使干预时点对应 0。此时 β2 直接就是「干预时点的即时效应」。若用未中心化的 time 与 `time × level` 交互项，β2 变成「time = 0 处的跃变」，真实即时效应要算成 β2 + t0·β3，且 level 与趋势项共线性更强。中心化既便于解读，也降低共线性。

**代码**（先跑普通 OLS 预览系数方向；标准误问题在第 3 步处理）：

```stata
* 中心化版本（推荐）：β2 直接 = 干预时点即时效应
regress y time_c level trend_after
* 预计：_b[level] ≈ -600、_b[trend_after] ≈ -30（样本有噪声）

* 对照：未中心化版本（time 与 time*level 交互）
gen time_level = time * level
regress y time level time_level
* 此时 level 系数不再等于干预时点效应（是 time=0 处的跃变），须用组合计算
```

```r
# 中心化版本（推荐）
m0 <- lm(y ~ time_c + level + trend_after, data = dat)
summary(m0)
# 预计：level ≈ -600、trend_after ≈ -30（样本有噪声）

# 组合效应（第 3 步换 HAC 协方差后正式报告）
library(car)
linearHypothesis(m0, "time_c + trend_after = 0")   # 干预后总斜率（β1+β3）
deltaMethod(m0, "level + 23*trend_after")          # 期末（time_c=23）总效应
```

---

### 第 3 步：自相关处理

**方法**：

- 月度结局几乎总存在**残差自相关**（相邻月高度相关）。OLS 系数仍无偏，但**标准误有偏**，t/p 值不可信，必须处理。
- **诊断**：残差时序图 + ACF 图；一阶自相关用 Durbin-Watson（≈2 表示无一阶自相关；模型含滞后因变量时 DW 失效）；一般/高阶自相关用 Cumby-Huizinga（Stata `actest`）或 Breusch-Godfrey LM（R `bgtest`）。
- **处理方式**（三选一或组合，主流是 ①）：
  ① **Newey-West / HAC 标准误**：只修正推断，不改系数（推荐首选）；
  ② **AR(1) 建模**：Prais-Winsten（Stata `prais`）/ R `gls + corAR1`，显式建模误差结构；
  ③ 滞后因变量（`itsa` 的 `lag(#)`）：属动态模型，系数解释随之改变，慎用。
- **滞后阶数选择**：太少 → 残留自相关；太多 → 效率损失。Stata `newey` 默认 m = floor(4(T/100)^(2/9))（T = 48 → 3）；小样本常取 lag(1)–lag(3)，报告阶数并做敏感性。R `NeweyWest()` 默认自动带宽（`prewhite = TRUE`）；与 Stata `lag(1)` 对照时用 `lag = 1, prewhite = FALSE`。
- 先确认序列平稳：`dfuller y, trend`（ADF 检验）；存在单位根时需差分或 ARIMA-ITS，超出线性 ITS 框架。

**代码**：

```stata
* ① 残差诊断
regress y time_c level trend_after
predict r, residuals
tsline r, yline(0) title("残差时序图")
ac r, lags(12) title("残差 ACF")

estat dwatson                    // Durbin-Watson（一阶）
actest, lags(4)                  // Cumby-Huizinga 一般检验（SSC；选项以 help actest 为准）
wntestq r, lags(4)               // Ljung-Box Q 检验

* 平稳性检查（结局本身）
dfuller y, trend

* ② Newey-West / HAC 标准误
newey y time_c level trend_after, lag(1)
* 默认滞后 = floor(4*(T/100)^(2/9))（T=48 → 3）；建议对 lag(1)–lag(4) 做敏感性

* ③ 备选：Prais-Winsten AR(1)（选项以 help prais 为准）
prais y time_c level trend_after, rhotype(tscorr)
```

```r
# ① 残差诊断
m0 <- lm(y ~ time_c + level + trend_after, data = dat)
plot(resid(m0), type = "o", pch = 16, cex = 0.7,
     xlab = "月份", ylab = "残差"); abline(h = 0)
acf(resid(m0), lag.max = 12, main = "残差 ACF")

library(lmtest)
dwtest(m0)                    # Durbin-Watson（一阶）
bgtest(m0, order = 4)         # Breusch-Godfrey LM（高阶）

# ② Newey-West / HAC 标准误
library(sandwich)
summary(m0)                                                    # 普通 SE（参考）
coeftest(m0, vcov = NeweyWest(m0, lag = 1, prewhite = FALSE))  # HAC SE，lag 固定为 1
coeftest(m0, vcov = NeweyWest(m0))                             # 默认：自动带宽 + prewhite
# 注：NeweyWest 默认 prewhite = TRUE 且自动选带宽；与 Stata lag(1) 对照时
#     用 lag = 1, prewhite = FALSE（以 help(NeweyWest) 为准）

# ③ 备选：AR(1) 误差模型（nlme）
library(nlme)
g1 <- gls(y ~ time_c + level + trend_after, data = dat,
          correlation = corAR1(form = ~ time))
summary(g1)
```

---

### 第 4 步：模型估计：Stata 与 R 实现（对照）

**方法**：

以下三个实现估计的是**同一个分段回归**，结果应几乎一致（本例应得到 β2 ≈ −600、β3 ≈ −30，真实参数见第 1 步）：

| 实现 | 命令 | 标准误 |
|---|---|---|
| Stata 手动 | `newey y time_c level trend_after, lag(1)` | Newey-West（用户指定滞后） |
| Stata `itsa` | `itsa y, single treatperiod(25) posttrend` | OLS + Newey-West（默认） |
| R | `lm` + `coeftest(NeweyWest(...))` | HAC（可指定滞后） |

**注意**：`itsa` 的 `lag(#)` 是**滞后因变量**阶数（动态模型），与 `newey` 的 HAC `lag(#)` 含义不同；要得到与手动分段回归相同的模型，`itsa` 用默认 `lag(0)` + `posttrend`。`itsa` 会自动生成时间/水平/趋势变量（命名形如 `_t`、`_x_t25` 等，运行后 `browse` 可查看）；`prais` 选项改用 Prais-Winsten；`figure` 选项直接出含反事实的图。**语法与输出以 `help itsa` 为准。**

**代码**：

```stata
* ============ 4.1 手动分段回归 + Newey-West ============
newey y time_c level trend_after, lag(1) force
* 注：任务书简写 newey y time level trend, lag(1) force；此处 time 为干预时点
*     中心化的 time_c；force 允许未 tsset 的数据仍按时间序列估计（已 tsset 可省略）
estimates store its_manual

* 组合效应（HAC 标准误下的线性组合检验）
lincom time_c + trend_after              // 干预后总斜率（β1+β3）
lincom level + 23*trend_after            // 期末（第 48 月）总效应（β2+23·β3）

* ============ 4.2 itsa 命令（SSC，Ariel Linden）============
* ssc install itsa, replace
itsa y, single treatperiod(25) posttrend
* 注：任务书示例写法 itsa y, single treat(25) 中的选项名，实际对应
*     treatperiod(25)，以 help itsa 为准；itsa 默认 OLS + Newey-West 标准误。
* 带滞后因变量的动态版本：itsa y, single treatperiod(25) lag(1) posttrend
* 出图：itsa y, single treatperiod(25) posttrend figure
```

```r
# ============ R：lm + NeweyWest，与 Stata 对照 ============
m <- lm(y ~ time_c + level + trend_after, data = dat)

summary(m)                                                    # 普通 SE（参考）
tab_hac <- coeftest(m, vcov = NeweyWest(m, lag = 1, prewhite = FALSE))
print(tab_hac)                                                # HAC SE
coefci(tab_hac)                                               # 基于 HAC 的 95% CI

# 组合效应（HAC 协方差下的线性组合与 delta 方法）
linearHypothesis(m, "time_c + trend_after = 0",
                 vcov. = NeweyWest(m, lag = 1, prewhite = FALSE))   # 干预后总斜率
deltaMethod(m, "level + 23*trend_after",
            vcov. = NeweyWest(m, lag = 1, prewhite = FALSE))         # 期末总效应
```

---

### 第 5 步：图形呈现（原始序列 + 拟合 + 反事实）

**方法**：

一张规范的 ITS 图含四要素：① 原始观测序列（散点/线）；② 分段拟合线（干预前后两段）；③ **反事实虚线**（无干预时干预前趋势的外推：ŷ_cf = β̂0 + β̂1·time_c）；④ 干预时点竖线。反事实线与拟合线之间的「缺口」是 β2 的视觉表达，两线斜率之差是 β3。

**代码**：

```stata
newey y time_c level trend_after, lag(1)
predict yhat, xb
gen yhat_cf = _b[_cons] + _b[time_c]*time_c       // 反事实：延续干预前趋势

twoway (scatter y time, msize(small) mcolor(gs8)) ///
       (line yhat time, lcolor(navy) lwidth(medthick)) ///
       (line yhat_cf time if time >= 25, lcolor(red) lpattern(dash) lwidth(medthick)) ///
       , xline(24.5, lcolor(gs10) lpattern(dash)) ///
         xtitle("月份") ytitle("次均费用（元）") ///
         title("ITS：DRG 改革对次均住院费用的影响") ///
         legend(order(1 "观测值" 2 "模型拟合" 3 "反事实（无干预）") position(6) rows(1))
```

```r
# R（基础包）
m <- lm(y ~ time_c + level + trend_after, data = dat)
dat$fit <- fitted(m)
b <- coef(m)
dat$cf  <- b["(Intercept)"] + b["time_c"] * dat$time_c     # 反事实

plot(y ~ time, data = dat, type = "o", pch = 16, cex = 0.7, col = "gray50",
     main = "ITS：DRG 改革对次均住院费用的影响",
     xlab = "月份", ylab = "次均费用（元）")
abline(v = 24.5, lty = 3, col = "gray40")
lines(dat$time, dat$fit, col = "navy", lwd = 2)
lines(dat$time[dat$time >= 25], dat$cf[dat$time >= 25], col = "red", lwd = 2, lty = 2)
legend("bottomleft", legend = c("观测值", "模型拟合", "反事实（无干预）"),
       col = c("gray50", "navy", "red"), lty = c(1, 1, 2),
       lwd = c(1, 2, 2), bty = "n")

# ggplot2 等价写法（ggplot2 ≥ 3.4 用 linewidth，低版本用 size）
library(ggplot2)
ggplot(dat, aes(time, y)) +
  geom_point(colour = "grey50") +
  geom_vline(xintercept = 24.5, linetype = 3) +
  geom_line(aes(y = fit), colour = "navy", linewidth = 1) +
  geom_line(data = subset(dat, time >= 25), aes(y = cf),
            colour = "red", linetype = 2, linewidth = 1) +
  labs(x = "月份", y = "次均费用（元）",
       title = "ITS：DRG 改革对次均住院费用的影响") +
  theme_minimal()
```

---

### 第 6 步：稳健性与检验

**方法**：

- **6.1 安慰剂时点**（in-time placebo）：把干预时点**前移**到干预前某期（如第 13 个月，该处并无真实干预），重估模型。若此时 β2、β3 仍「显著」，说明断点效应可能来自模型设定而非政策；**期望结果：安慰剂时点的水平与斜率变化接近 0 且不显著**。
- **6.2 季节性与混杂**：加入月度虚拟变量（或正弦/余弦 Fourier 对）吸收季节成分；同时把已知混杂事件作为对照时点做同样分析。核心系数稳定则结论稳健。
- **6.3 控制组 ITS（CITS）**：有未受干预的对照地区/机构时，用「干预组 × 时点」交互项识别政策效应（DID 型设定），能控制同期共同冲击。Stata 用 `itsa` 双组语法（`treatid()`），或手动全交互模型；R 用 `lm` 交互项。
- **6.4 异常值敏感性**：1%/99% 缩尾（或剔除极端月）后重估，检查系数稳定性。
- 补充：滞后阶数敏感性（lag(1)–lag(4)）与不同自相关处理（HAC vs Prais-Winsten）的比较。

**代码**：

```stata
* ---- 6.1 安慰剂时点：假设干预发生在第 13 个月（实际无干预）----
gen time_c13 = time - 13
gen level13  = time >= 13
gen trend13  = time_c13 * level13
newey y time_c13 level13 trend13, lag(1)
* 期望：level13、trend13 系数接近 0 且不显著

* ---- 6.2 季节性：加入月度虚拟变量（参考月 = 1 月）----
gen month = mod(time - 1, 12) + 1
tab month, gen(md)                          // 生成 md1–md12
newey y time_c level trend_after md2-md12, lag(1)
* 期望：β2、β3 与主模型接近（以实际结果为准）

* ---- 6.3 控制组 ITS（CITS）：双地区面板示意 ----
* 面板长表：id（地区）、time、y；treat = 1（干预地区，第 25 个月起受干预）
* 多组 itsa（语法与选项以 help itsa 为准）：
*     xtset id time
*     itsa y, treatperiod(25) treatid(treat) posttrend
* 手动 DID 型交互模型（示意）：
gen t_c   = time - 25
gen lev   = time >= 25
gen tr_a  = t_c * lev
gen g_lev = treat * lev        // 水平变化的组间差（政策即时效应，DID）
gen g_tr  = treat * tr_a       // 斜率变化的组间差（政策趋势效应，DID）
newey y t_c treat lev tr_a g_lev g_tr, lag(1)
* 关键系数：g_lev（相对对照组的即时水平变化）、g_tr（相对对照组的斜率变化）

* ---- 6.4 异常值敏感性：1%/99% 缩尾 ----
quietly summarize y, detail
gen y_w = min(max(y, r(p1)), r(p99))
newey y_w time_c level trend_after, lag(1)
```

```r
# ---- 6.1 安慰剂时点：假设干预发生在第 13 个月 ----
dat$time_c13 <- dat$time - 13
dat$level13  <- as.numeric(dat$time >= 13)
dat$trend13  <- dat$time_c13 * dat$level13
m_placebo <- lm(y ~ time_c13 + level13 + trend13, data = dat)
coeftest(m_placebo, vcov = NeweyWest(m_placebo, lag = 1, prewhite = FALSE))
# 期望：level13、trend13 接近 0 且不显著

# ---- 6.2 季节性：加入月度虚拟变量 ----
dat$month <- factor(((dat$time - 1) %% 12) + 1)
m_season <- lm(y ~ time_c + level + trend_after + month, data = dat)
coeftest(m_season, vcov = NeweyWest(m_season, lag = 1, prewhite = FALSE))
# 更平滑的季节建模可用正弦/余弦对（Fourier terms），以数据周期为准

# ---- 6.3 控制组 ITS（CITS）：面板数据交互项 ----
# 面板长表 panel：id、time、y、treat（1 = 干预地区）
panel$t_c  <- panel$time - 25
panel$lev  <- as.numeric(panel$time >= 25)
panel$tr_a <- panel$t_c * panel$lev
m_cits <- lm(y ~ t_c + treat + lev + tr_a + treat:lev + treat:tr_a, data = panel)
coeftest(m_cits, vcov = NeweyWest(m_cits, lag = 1, prewhite = FALSE))
# 政策效应 = treat:lev（即时）与 treat:tr_a（斜率）的系数

# ---- 6.4 异常值敏感性：1%/99% 缩尾 ----
q <- quantile(dat$y, c(0.01, 0.99))
dat$y_w <- pmin(pmax(dat$y, q[1]), q[2])
m_w <- lm(y_w ~ time_c + level + trend_after, data = dat)
coeftest(m_w, vcov = NeweyWest(m_w, lag = 1, prewhite = FALSE))
```

---

### 第 7 步：报告清单

**方法**：一篇 ITS 论文/报告至少报告以下七项——① 序列描述（时间区间、总点数、前后各段点数、结局定义与单位、均值/SD、缺失与异常值处理）；② 模型设定（公式、中心化说明）；③ 模型表（β0–β3 及 HAC 标准误、95% CI、p 值）；④ 自相关处理说明（检验结果与滞后阶数选择依据）；⑤ 图（原始序列 + 拟合 + 反事实 + 时点线）；⑥ 稳健性结果（安慰剂、季节、异常值、CITS 若有）；⑦ 局限（单组设计、同期事件、检验力）。

**代码**（出表）：

```stata
* 主表：HAC 标准误（esttab，SSC estout）
newey y time_c level trend_after, lag(1)
estimates store its_main
esttab its_main, b(%9.2f) se(%9.2f) p(%9.3f) stats(N r2, fmt(%9.0f %9.3f)) ///
    title("表 1：ITS 分段回归（Newey-West 标准误，lag(1)）") ///
    addnotes("干预时点：第 25 个月；time_c 为干预时点中心化的月份。")
```

```r
# 主表：用 HAC 标准误覆盖（texreg；以包文档为准）
library(texreg)
hac_se <- sqrt(diag(NeweyWest(m, lag = 1, prewhite = FALSE)))
screenreg(m, override.se = hac_se,
          custom.model.names = "ITS 分段回归（HAC 标准误）")
```

---

## 常见错误清单

- [ ] 忽略残差自相关，直接用普通 OLS 标准误 → SE/t/p 失真（务必 HAC 或 AR(1) 建模）
- [ ] 干预前后数据点太少（每段 < 8–12 个）→ 趋势估计不稳、检验力不足
- [ ] 把「即时水平变化（β2）」与「斜率变化（β3）」混为一谈（β3 是每月增量，不是一次性变化）
- [ ] 未做安慰剂时点检验就宣称效应来自政策
- [ ] 不报告 Newey-West 滞后阶数及选择依据（规则、敏感性）
- [ ] 未检查/处理季节性与同期混杂（同期其他政策、疫情、报销政策变动）
- [ ] 时间变量未中心化，却把 level 系数直接解读为「干预即时效应」（未中心化时该系数含义不同）
- [ ] 混淆 `itsa` 的 `lag(#)`（滞后因变量，动态模型）与 `newey` 的 `lag(#)`（HAC 带宽）
- [ ] 序列存在单位根（不平稳）仍直接回归，出现伪回归
- [ ] 用拟合线做长期外推预测，把样本内效应当成未来趋势
- [ ] 单组 ITS 无对照却做强因果断言，未讨论同期事件与历史威胁
- [ ] 干预时点定义含糊（政策渐进落地却硬按某时点切割），或时点与政策实际生效日不符

## 输出格式（ITS 报告模板）

```
【研究设计与数据】
结局（次均住院费用，元/次）与时间单位（月）；序列区间（20XX 年 X 月–20XX 年 X 月，
共 48 个月）；干预（DRG 付费改革）与实施时点（第 25 个月）；干预前后各 24 个月；
数据来源、缺失/插补、异常值处理。
模型：Y = β0 + β1·time_c + β2·level + β3·trend_after + ε；time_c 为干预时点中心化。

【主要结果】
- 序列描述：均值、SD、干预前趋势（β1）与干预时点基线（β0）。
- 自相关诊断：残差 ACF、DW / actest（或 BG）结果 → 采用 Newey-West 修正的理由。
- 表 1：ITS 分段回归（β0–β3，HAC 标准误、95% CI、p 值；注明滞后阶数及选择依据）。
- 效应解读：β2 = 即时水平变化（元）；β3 = 斜率变化（元/月）；
  干预后总斜率 = β1 + β3；期末总效应 = β2 + k·β3（注明 k）。
- 图 1：原始序列 + 分段拟合 + 反事实虚线 + 干预时点竖线。

【稳健性检验】
- 表 2：安慰剂时点（第 X 个月）结果：β2、β3 应接近 0；
- 季节调整（月度虚拟/Fourier）后核心系数变化；
- 异常值敏感性（1%/99% 缩尾）；
- CITS（如有对照）：treat:level 与 treat:trend_after 交互项系数。

【结论与局限】
- 政策含义：方向、大小、持续时间（如「DRG 改革使次均费用即时下降约 600 元，
  且此后每月多降约 30 元」）。
- 局限：单组设计无法排除同期事件；自相关结构与滞后选择；序列长度与检验力；
  单一机构结果的外部效度。
```

## 使用提示

- 命令与选项随版本更新：运行 `help newey`、`help itsa`、`help actest`、`help prais`、`help esttab` 核对；R 侧看 `help(NeweyWest)`、`help(coeftest)`、`help(deltaMethod)`。
- `itsa` 的语法与输出**以 `help itsa` 为准**；任务书简写 `itsa y, single treat(25)` 对应实际选项 `treatperiod(25)`。
- Newey-West 滞后：Stata `newey` 默认 m = floor(4(T/100)^(2/9))（T = 48 → 3）；小样本常用 lag(1)–lag(3)，**报告阶数并做敏感性分析**；R 的 `NeweyWest()` 默认自动带宽（prewhite = TRUE），与 Stata 对照时用 `lag = 1, prewhite = FALSE`。
- 建议同时报告普通 SE 与 HAC SE，直观展示自相关的严重程度。
- 动手顺序：先画序列图、确认干预时点与异常值 → 再定模型 → 诊断自相关 → 主分析 → 稳健性。
- 本 Skill 提供方法与代码模板；干预时点判定、混杂判断与最终结论由研究者负责。

---

## 引用 / Citation

中文：杜思娴. 间断时间序列助手：ITS 政策效果评估 Skill [EB/OL]. (2026). https://naturedu.github.io/socialmedicine/.

English: Du, S. (2026). *Interrupted Time Series Assistant: ITS for health policy evaluation skill* [Skill definition]. https://naturedu.github.io/socialmedicine/.

建议阅读方法学文献：

- Bernal, J. L., Cummins, S., & Gasparrini, A. (2017). Interrupted time series regression for the evaluation of public health interventions: a tutorial. *International Journal of Epidemiology*, 46(1), 348–355.
- Linden, A. (2015). Conducting interrupted time-series analysis for single- and multiple-group comparisons. *The Stata Journal*, 15(2), 480–500.
- Wagner, A. K., Soumerai, S. B., Zhang, F., & Ross-Degnan, D. (2002). Segmented regression analysis of interrupted time series studies in medication use research. *Journal of Clinical Pharmacy and Therapeutics*, 27(4), 299–309.
- Ramsay, C. R., Matowe, L., Grilli, R., Grimshaw, J. M., & Thomas, R. E. (2003). Interrupted time series designs in health technology assessment: lessons from two systematic reviews of behavior change strategies. *International Journal of Technology Assessment in Health Care*, 19(4), 613–623.
