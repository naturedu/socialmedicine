# Skill：DID 双重差分助手（卫生政策效果评估，Stata / R）

**版本** 1.0 · **作者** 杜思娴 (Du Sixian) · **许可** MIT · **更新** 2026-10-23

## 用途

一份可复用的「双重差分（Difference-in-Differences, DID）」卫生政策评估工作流：从研究设计与识别假设、经典 2×2 DID 估计、平行趋势检验，到多期 / 交错处理 DID（Callaway & Sant'Anna, 2021）与事件研究图，再到安慰剂检验、PSM-DID 等稳健性分析与政策评估报告。适用于医保目录调整、DRG/DIP 支付改革、药品集中采购、分级诊疗试点、慢病管理项目等卫生政策因果效应评估。**每一步都给出「方法 + 代码」**，可直接作为提示词喂给大语言模型，也可作为操作手册照做。

**贯穿全文的示例场景**：某地级市药品集中采购试点对**次均药品费用（y）与住院率（adm）**的影响。全文使用**同一套自洽的模拟面板数据**：60 个地区 × 4 期、30 个处理组（交错入组：10 个在 t=2、10 个在 t=3、10 个在 t=4 执行集采）、30 个永不受理对照组；数据生成过程内置**真实 ATT = −150 元/期**（次均药品费用）与 −0.02（住院率）。Stata 与 R 代码可直接复制运行。

## 适用范围（明确边界）

允许：
- 帮助研究者完成卫生政策评估的 DID 全流程（医保目录调整、DRG/DIP 支付改革、药品集中采购、分级诊疗试点、慢病管理项目等）
- 给出 2×2 DID、多期 DID、交错处理 DID（Callaway–Sant'Anna）的估计、检验与作图代码
- 平行趋势检验、安慰剂检验（伪处理组 / 伪时点）、剔除样本、PSM-DID、更换结局与聚类层级等稳健性分析

**不允许：**
- 替研究者下「政策因果效应成立」的最终结论（DID 是基于假设的识别策略，需结合制度背景、数据与检验功效综合论证）
- 承诺结果一定可发表；不替代计量经济学教科书与期刊审稿要求
- 在未讨论平行趋势、共同冲击与溢出、未做稳健性检验的情况下武断下结论

## 软件准备

方法：Stata 17 及以上（`didregress` / `xtdidregress` 需 17+；官方异质性 DID 命令 `hdidregress` / `xthdidregress` 需 18+；`csdid` / `csdid_plot` 是社区命令）、R ≥ 4.2（`fixest`、`did`、`MatchIt`、`ggplot2` 等）。SSC 安装 `csdid`、`drdid`、`reghdfe`、`coefplot`、`estout`、`ritest`、`psmatch2`；`csdid` 不是 Stata 自带命令，运行 `which csdid` 核对社区包版本；安装兼容性以当前帮助文件为准。

```stata
* Stata（联网安装一次）
ssc install csdid,    replace    // 交错处理 DID（Callaway-Sant'Anna）
ssc install drdid,    replace    // 双重稳健 DID（csdid 的依赖）
ssc install reghdfe,  replace    // 高维固定效应（事件研究回归用）
ssc install ftools,   replace    // reghdfe 的依赖
ssc install coefplot, replace    // 系数图
ssc install estout,   replace    // 结果表
ssc install ritest,   replace    // 随机化推断（安慰剂检验备选）
ssc install psmatch2, replace    // 倾向得分匹配
```

```r
# R
install.packages(c("fixest", "did", "MatchIt", "ggplot2", "cobalt", "modelsummary"))
```

## 工作流程总览（数据准备 + 7 步）

0. 生成模拟面板数据 → 1. 研究设计与识别假设 → 2. 经典 2×2 DID → 3. 平行趋势检验 → 4. 多期 / 交错处理 DID（Callaway–Sant'Anna）→ 5. 事件研究图 → 6. 稳健性检验 → 7. 报告清单。以下每一步均为「方法 + 代码」。

---

### 第 0 步：生成贯穿全文的模拟面板数据

**方法**：60 个地区（id = 1…60）、4 期（t = 1…4）。处理组 30 个、交错入组（队列 g：10 个 g=2、10 个 g=3、10 个 g=4），对照组 30 个永不受理（g=0）。数据生成过程（DGP）：

y_it = α_i + β_i·(t−1) + λ_t + (−150)·D_it + ε_it

- α_i ~ N(900, 50)：地区固定效应（地区平均次均药品费用水平）
- β_i ~ N(−8, 4)：地区自身线性趋势
- λ_t = −30·(t−1)：共同时间趋势（如集采目录外药价下行、全国性控费）
- D_it = 1[t ≥ g_i]：处理指示（g_i = 0 为永不受理）
- ε_it ~ N(0, 40)

**内置真实 ATT = −150**：处理后每期次均药品费用下降 150 元，且各队列、各期效应同质——2×2、事件研究、Callaway–Sant'Anna 估计量都应回收 ≈ −150。次要结局 adm（住院率）真实效应 −0.02。协变量 x1、x2 为时不变地区特征（x1 与入选相关，供 PSM-DID 使用）。

**代码**：

```stata
* ============================================================
* 模拟面板：60 地区 × 4 期；30 个处理组交错入组；真实 ATT = -150
* ============================================================
clear all
set seed 2026
set obs 60
gen id = _n
* 处理时点 g（0 = 永不受理）
gen g = 0
replace g = 2 if inrange(id, 1, 10)
replace g = 3 if inrange(id, 11, 20)
replace g = 4 if inrange(id, 21, 30)
gen treated = (g > 0)
* 地区特征（时不变）：固定效应、自身趋势、可观测协变量
gen alpha = rnormal(900, 50)        // 地区平均次均费用水平
gen beta  = rnormal(-8, 4)          // 地区自身趋势（元/期）
gen x1 = rnormal(0.3*treated, 1)    // 协变量 1：与入选相关
gen x2 = rnormal(0, 1)              // 协变量 2
* 4 期面板
expand 4
bysort id: gen t = _n
gen lambda = -30 * (t - 1)          // 共同时间趋势
gen D = (t >= g & g > 0)            // 处理指示
gen y   = alpha + beta*(t-1) + lambda + (-150)*D + rnormal(0, 40)           // 次均药品费用
gen adm = 0.20 - 0.01*(t-1) + (alpha-900)/3000 + (-0.02)*D + rnormal(0, 0.04)  // 住院率
xtset id t
save "did_demo.dta", replace
* 数据体检
xtdes                               // 面板结构：60 个地区 × 4 期、无缺失
tab g                               // 队列规模：g=2/3/4 各 10，g=0 共 30
tabstat y if t == 1, by(treated) stat(n mean sd)   // 干预前基线比较
```

```r
# ============================================================
# 模拟面板：60 地区 × 4 期；30 个处理组交错入组；真实 ATT = -150
# ============================================================
set.seed(2026)
N <- 60; Tmax <- 4
id  <- 1:N
g   <- c(rep(2, 10), rep(3, 10), rep(4, 10), rep(0, 30))   # 处理时点；0 = 永不受理
treated <- as.integer(g > 0)
alpha <- rnorm(N, 900, 50)          # 地区固定效应
beta  <- rnorm(N, -8, 4)            # 地区自身趋势
x1 <- rnorm(N, 0.3 * treated, 1)    # 协变量 1：与入选相关
x2 <- rnorm(N, 0, 1)                # 协变量 2

dat <- expand.grid(id = id, t = 1:Tmax)
dat$g <- g[dat$id]; dat$treated <- treated[dat$id]
dat$alpha <- alpha[dat$id]; dat$beta <- beta[dat$id]
dat$x1 <- x1[dat$id]; dat$x2 <- x2[dat$id]
dat$D <- as.integer(dat$t >= dat$g & dat$g > 0)
dat$y <- dat$alpha + dat$beta * (dat$t - 1) - 30 * (dat$t - 1) +
         (-150) * dat$D + rnorm(N * Tmax, 0, 40)                       # 次均药品费用
dat$adm <- 0.20 - 0.01 * (dat$t - 1) + (dat$alpha - 900) / 3000 +
           (-0.02) * dat$D + rnorm(N * Tmax, 0, 0.04)                  # 住院率

table(dat$g)                        # 队列规模
aggregate(y ~ treated + t, data = dat, FUN = mean)     # 各期均值（干预前应接近）
```

---

### 第 1 步：研究设计与识别假设

**方法**：

- **处理组 / 对照组**：政策覆盖的地区、机构或人群为处理组，未覆盖且不受影响者为对照组。明确「谁在何时受处理」：处理变量 = 组指示 × 时点指示。对照组要求「若未受政策，其结局路径与处理组平行」。
- **干预时点**：以政策**实际生效**时点为准（如集采落地执行月份、DRG 实际结算月份）；注意 phase-in（分批执行）→ 用交错处理设定；注意预期效应（政策公告早于执行）→ 把公告期单列检验。
- **平行趋势假设（概念与直觉）**：反事实是「若无干预，处理组的结局变化应等于对照组的变化」。直觉：处理组与对照组在干预前有共同趋势，则干预后二者差异中「超出既有趋势的部分」可归因于政策。DID 识别的正是「处理组实际变化 − 处理组若无干预的变化（用对照组变化替代）」。
- **共同冲击假设**：除所评估政策外，同期没有其他只影响处理组（或只影响对照组）的冲击（如其他政策、疫情、支付规则变动）；若有，需讨论其对估计的偏误方向。
- **何时不能用 DID**：① 政策覆盖全国或全人群、找不到可比对照；② 处理组与对照组干预前趋势明显不平行且无修正办法；③ 处理组的选择与随时间变化的结局冲击直接相关（DID 无法消除时变选择）；④ 溢出 / 一般均衡效应强（对照组被政策间接影响）；⑤ 结局定义或测量方式在两组间随时间发生不同变化（测量不一致）；⑥ 只有一期数据（DID 至少需要干预前后各一期）。

**代码**（数据体检与基线图）：

```stata
* 干预前基线平衡表（t=1 期）
tabstat y adm x1 x2 if t == 1, by(treated) stat(n mean sd)
* 各期结局均值图（第一道识别直觉：干预前两组路径应平行）
egen ybar = mean(y), by(treated t)
twoway (line ybar t if treated == 1) (line ybar t if treated == 0), ///
    legend(order(1 "处理组" 2 "对照组")) xline(2.5, lp(dash)) ///
    title("各期次均药品费用：处理组 vs 对照组（干预前应平行）")
drop ybar
```

```r
# 干预前基线平衡表
aggregate(cbind(y, adm, x1, x2) ~ treated, data = subset(dat, t == 1), FUN = mean)
# 各期均值图
means <- aggregate(y ~ treated + t, data = dat, FUN = mean)
with(means, {
    plot(t, y, type = "n", xlab = "t", ylab = "次均药品费用")
    lines(t[treated == 1], y[treated == 1], col = "red",  lwd = 2)
    lines(t[treated == 0], y[treated == 0], col = "blue", lwd = 2)
    abline(v = 2.5, lty = 2)
    legend("topright", c("处理组", "对照组"), col = c("red", "blue"), lwd = 2)
})
```

---

### 第 2 步：经典 2×2 DID

**方法**：两期面板（干预前一期 t=1、干预后一期 t=2）。估计式：

y_it = β0 + β1·treated_i + β2·post_t + β3·(treated_i × post_t) + ε_it

`reg y i.treated##i.post` 的系数含义：`_cons` = 对照组干预前均值；`1.treated` = 干预前处理组 − 对照组的基线差异；`1.post` = 对照组的共同时间变化；**`1.treated#1.post` = DID = ATT**（处理组变化 − 对照组变化）。标准误在**干预分配层级**（地区 id）聚类。演示中处理组 = 第 2 期入组队列（treated2 = g=2）；对照组 = 其余地区（含 g=3/4 的「尚未处理」者——t=1、2 时它们同样未受处理，是合法对照，这正是 not-yet-treated 思想）。预期系数 ≈ −150。等价写法是双向固定效应（只保留交互项）；官方命令 `didregress`（Stata 17+）自动完成 FE 并报告 ATET。

**代码**：

```stata
* 两期子样本：t=1 干预前、t=2 干预后；处理组 = t=2 期入组队列
preserve
keep if inlist(t, 1, 2)
gen post = (t == 2)
gen treated2 = (g == 2)                // 10 个处理组；g=3/4 在 t<=2 尚未处理，作为对照
* 经典 2×2（OLS + 交互项）
reg y i.treated2##i.post, vce(cluster id)
est store m_2x2
* 系数解释：1.treated2 = 基线差异；1.post = 共同时间变化；
*           1.treated2#1.post = ATT ≈ -150（集采使次均药品费用下降约 150 元）

* 等价：双向固定效应（系数相同）
reg y i.treated2#i.post i.id i.t, vce(cluster id)

* 官方命令（Stata 17+）：didregress（自动 FE 与 ATET 报告）
didregress (y) (treated2), group(id) time(t) vce(cluster id)
* 注：didregress 假设处理组单一入组时点；交错处理请用第 4 步的 csdid
restore
```

```r
library(fixest)
d2 <- subset(dat, t %in% 1:2)
d2$post <- as.integer(d2$t == 2)
d2$treated2 <- as.integer(d2$g == 2)

# 双向固定效应 DID：组/期主效应被 FE 吸收，交互项 = ATT
m_2x2 <- feols(y ~ treated2 * post | id + t, data = d2, cluster = ~id)
summary(m_2x2)                       # treated2:post ≈ -150

# 等价：不含 FE 的经典 2×2（两期时系数相同，方便逐项解释）
m_ols <- feols(y ~ treated2 * post, data = d2, cluster = ~id)
summary(m_ols)
# 系数：treated2 = 基线差异；post = 共同时间变化；treated2:post = ATT
```

**结果解读**：`treated2:post`（或 `1.treated2#1.post`）≈ −150，解释为「集采试点使处理地区的次均药品费用平均下降约 150 元」；95% CI 不含 0 即为统计显著。模拟数据每次重跑略有噪声；如需更精确回收 −150，可调小 ε 方差或增大样本。同时报告聚类数与观测数（本例 60 个聚类、120 条观测）。

---

### 第 3 步：平行趋势检验

**方法**：

- **图示（事件研究）**：以**干预前一期**为基准（rel = −1），估计各相对时期处理组 − 对照组的差异；干预前各期系数应 ≈ 0 且在 0 附近（图上无趋势性漂移）。
- **正式检验**：联合检验**仅干预前**各期系数是否为 0（Stata `test` / `estat ptrends`；R `wald` / `did::pre.test`）。**只能检验干预前趋势**——干预后系数是动态效应，不是平行趋势的证据。
- **检验的局限**：检验功效有限，「不拒绝」≠「平行趋势成立」；应结合制度背景论证，并报告干预前系数的置信区间（看是否接近 0，而非只看显著性）；基准期选干预前一期（选最早一期功效差）。Roth (2022) 建议做 pre-trend 检验的功效分析。

**代码**（用 g=3 队列演示：t=1、2 为干预前，t=3、4 为干预后）：

```stata
* 事件研究（手工交互虚拟变量，基准 = 干预前一期 rel = -1）
preserve
keep if inlist(g, 0, 3)
gen treated3 = (g == 3)
gen rel = t - 3                         // rel = -2,-1,0,1
gen ev_m2 = (rel == -2 & treated3 == 1)
gen ev_m1 = (rel == -1 & treated3 == 1) // 基准（回归中省略）
gen ev_0  = (rel ==  0 & treated3 == 1)
gen ev_1  = (rel ==  1 & treated3 == 1)
reghdfe y ev_m2 ev_0 ev_1, absorb(id t) vce(cluster id)
test ev_m2 = 0                          // 正式检验：干预前系数 = 0
coefplot, keep(ev_*) vertical yline(0, lcolor(red)) xline(1.5, lcolor(gs8) lp(dash))
* 图：ev_m2（干预前）应 ≈ 0；ev_0、ev_1（干预后）应 ≈ -150
* 注：本例受 4 期数据限制只有 1 个前趋势系数；真实研究应有 3 期以上干预前数据，
*     并联合检验全部前趋势系数（test ev_m2 ev_m3 ... = 0）

* 官方替代（Stata 17+）：didregress + 预趋势检验
didregress (y) (treated3), group(id) time(t) vce(cluster id)
estat trendplots                        // 各期处理-对照差异图（含置信区间）
estat ptrends                           // 平行趋势联合检验（H0：干预前各期系数均为 0）
restore
```

```r
# 事件研究（fixest 的 i() 交互；基准 rel = -1）
library(fixest)
es <- subset(dat, g %in% c(0, 3))
es$treated3 <- as.integer(es$g == 3)
es$rel <- es$t - 3
m_es <- feols(y ~ i(rel, treated3, ref = -1) | id + t, data = es, cluster = ~id)
summary(m_es)
iplot(m_es)                             # 事件研究图：干预前系数应 ≈ 0
# 正式检验：干预前系数（本例为 rel = -2）
coef(m_es)                              # 系数名形如 rel::-2:treated3（以实际输出为准）
wald(m_es, "rel::-2:treated3")          # 名称以 coef(m_es) 输出为准
# 亦可用 coefplot(m_es)（fixest 自带）；选项以 help(coefplot.fixest) 为准
# 交错处理时可用 did::pre.test()（对 CS 估计做干预前联合检验，以 help(pre.test) 为准）
```

---

### 第 4 步：多期 / 交错处理 DID（Callaway & Sant'Anna, 2021）

**方法**：交错处理（staggered adoption）下，把「不同时点入组的处理组」混在单一 post 的 TWFE 估计量，是各 2×2 比较的加权平均，效应异质时可能出现**负权重**而偏误（Goodman-Bacon, 2021；de Chaisemartin & D'Haultfœuille, 2020；Sun & Abraham, 2021）。Callaway & Sant'Anna (2021) 定义**组×期处理效应 ATT(g,t) = E[Y_t(g) − Y_t(0) | G = g]**（队列 g 在日历期 t 的效应，仅 t ≥ g 有定义），对每个 (g,t) 用「尚未处理 / 永不受理」队列作干净对照分别估计，再按研究问题聚合：

- `simple`：总体 ATT（各 ATT(g,t) 的加权平均，权重与组规模、暴露期数相关）
- `dynamic` / `event`：按事件时间 e = t − g 聚合 → 事件研究（第 5 步作图）
- `group`：按队列 g 聚合
- `calendar`：按日历期 t 聚合

识别假设：处理不可逆（吸收处理）、无预期效应、按队列的平行趋势、有限重叠（每个 (g,t) 有可用对照）。Stata 18+ 有官方 `csdid` / `xthdidregress`；Stata 17 及更早用 SSC 版 `csdid`（依赖 `drdid`）。R 用 `did`（Callaway & Sant'Anna 官方实现）。

**代码**：

```stata
* Stata 18+：官方 csdid；Stata 17 及更早：ssc install csdid, replace + ssc install drdid, replace
* 全样本：30 个处理组在 t=2/3/4 交错入组（g=2/3/4），30 个永不受理（g=0）
csdid y, ivar(id) time(t) gvar(g)
* 聚合（官方 18：estat simple/event/group/calendar；SSC 版：csdid_estat simple ...）
estat simple                  // 总体 ATT ≈ -150
estat event                   // 事件时间聚合（供第 5 步作图）
estat group                   // 按队列聚合
* 选项（method、对照组选择、权重自举等）以 help csdid 为准

* 官方替代（Stata 18+）：xthdidregress，处理时点由 D 自动识别
xthdidregress ra (y) (D), group(id) time(t)
* 聚合与作图：estat aggregation / estat atetplot；语法以 help xthdidregress postestimation 为准
```

```r
# Callaway-Sant'Anna（官方 R 实现）
library(did)
out <- att_gt(yname = "y", tname = "t", idname = "id", gname = "g",
              data = dat, control_group = "notyettreated")
summary(out)                            # ATT(g,t) 表：队列 g × 时期 t
agg_simple <- aggte(out, type = "simple")    # 总体 ATT ≈ -150
summary(agg_simple)
agg_group  <- aggte(out, type = "group")     # 按队列
agg_cal    <- aggte(out, type = "calendar")  # 按日历期
# 对照组设定、估计方法（est_method = "dr"/"reg"/"ipw"）等选项以 help(att_gt) 为准

# 替代：Sun & Abraham（fixest）
feols(y ~ sunab(g, t) | id + t, data = dat, cluster = ~id)
```

**结果解读**：ATT(g,t) 表中处理前（t < g）应 ≈ 0，t ≥ g 应 ≈ −150；`agg_simple` ≈ −150，与 2×2 结果一致。报告时注明**聚合类型**与**对照组设定**（not-yet-treated vs never-treated，二者识别假设不同）。

---

### 第 5 步：事件研究图

**方法**：把第 4 步的 `event` / `dynamic` 聚合画成图：横轴 = 相对处理期 e = t − g，纵轴 = 平均处理效应；干预前（e < 0）应 ≈ 0（平行趋势的可视证据），干预后（e ≥ 0）为动态效应。报告置信区间与基准期（e = −1）。图中干预前系数的置信带不应明显偏离 0；干预后曲线走势即「政策效果的时间路径」（如集采效果逐步释放、延迟生效）。相对期区间由数据决定（本例 t = 1…4、g = 2…4 → e ∈ [−3, 2]）。单一入组时点下，第 3 步的手工事件研究图与 CS 动态图一致；交错处理时以 CS 动态图为准。

**代码**：

```stata
* 接第 4 步 csdid
estat event                   // 官方 18；SSC 版为 csdid_estat event
csdid_plot                    // 事件研究图（官方 18 与 SSC 版均有）
* 若版本支持，亦可用 marginsplot：estat event 后 marginsplot
* （以 help csdid postestimation / help csdid_plot 为准）
```

```r
# 接第 4 步
agg_dyn <- aggte(out, type = "dynamic", min_e = -3, max_e = 2)
summary(agg_dyn)                    # 事件研究系数表（含各期置信区间）
ggdid(agg_dyn)                      # 事件研究图（需 ggplot2）
ggdid(agg_dyn, ylim = c(-300, 60), xlab = "相对处理期",
      title = "动态处理效应：集采对次均药品费用")
# ggdid 的图形选项以 help(ggdid) 为准
```

---

### 第 6 步：稳健性检验

**方法**：

- **安慰剂检验——伪处理组**：把「处理组身份」随机重抽（保持处理组规模与真实一致），重复 ≥ 数百次，得到伪 DID 系数分布；真实系数应位于分布尾部（经验 p 值 < 0.05）。**单次安慰剂不足以说明问题**。
- **安慰剂检验——伪时点（预期效应检验）**：把干预时点人为提前到真实时点之前、只用干预前数据估计；系数应 ≈ 0，显著非零提示预期效应或前趋势。
- **剔除部分样本**：剔除极端值（缩尾）、剔除个别地区 / 时期后重估，结论应稳定。
- **PSM-DID**：若处理组选择与可观测协变量相关，先按干预前（时不变）协变量做倾向得分匹配，再在匹配样本上做 DID——匹配消除可观测基线差异，DID 消除共同趋势。注意：协变量必须是干预前变量；PSM 不能替代平行趋势论证。
- **更换结局 / 聚类层级**：换用次要结局（如住院率）；把聚类层级从地区改为更保守的层级（如上级地市 / 医院集团），标准误结论应稳定。

**代码**：

```stata
* ---------- 6.1 伪处理组（随机重抽处理组身份，500 次） ----------
preserve
keep if inlist(t, 1, 2)
gen post = (t == 2)
tempname pf
tempfile pfres
postfile `pf' b_did using `pfres', replace
set seed 2026
forvalues r = 1/500 {
    * 在地区层面抽一个伪处理身份（同一地区两期身份一致）
    bysort id: gen rnd_id = runiform() if _n == 1
    bysort id (rnd_id): replace rnd_id = rnd_id[1]
    egen prank = rank(rnd_id), unique
    gen treatedF = (prank <= 10)          // 随机 10 个伪处理地区
    quietly reg y i.treatedF##i.post, vce(cluster id)
    post `pf' (_b[1.treatedF#1.post])
    drop rnd_id prank treatedF
}
postclose `pf'
use `pfres', clear
summarize b_did, detail                  // 伪系数分布：中心应 ≈ 0
count if b_did <= -150                   // 伪系数 ≤ 真实系数（-150）的次数
di (r(N) + 1) / 501                      // 经验 p 值（单侧）
histogram b_did, normal xline(-150, lcolor(red))
* 备选：ritest（SSC）做随机化推断，支持聚类层级（选项以 help ritest 为准）
restore

* ---------- 6.2 伪时点（预期效应检验） ----------
* 用 g=3 队列的干预前两期（t=1,2），人为假设 t=2 已干预
preserve
keep if inlist(g, 0, 3) & inlist(t, 1, 2)
gen post = (t == 2)
gen treated3 = (g == 3)
reg y i.treated3##i.post, vce(cluster id)     // 预期系数 ≈ 0
restore

* ---------- 6.3 剔除部分样本 ----------
* (a) 剔除 y 上下 1% 极端值后重估 2×2
preserve
keep if inlist(t, 1, 2)
gen post = (t == 2)
gen treated2 = (g == 2)
quietly summarize y, detail
drop if y < r(p1) | y > r(p99)
reg y i.treated2##i.post, vce(cluster id)
restore
* (b) 对照只用永不受理组（排除尚未处理队列），多期 FE 估计
preserve
keep if inlist(g, 0, 2)
gen post = (t >= 2)
gen treated2 = (g == 2)
reghdfe y i.treated2#i.post, absorb(id t) vce(cluster id)
restore

* ---------- 6.4 PSM-DID ----------
preserve
keep if inlist(t, 1, 2)
gen post = (t == 2)
gen treated2 = (g == 2)
* 方案 A（官方 teffects）：横截面 ATT 演示（把两期分别视为观测）
teffects psmatch (y) (treated2 x1 x2), atet
* 方案 B（psmatch2 + DID，SSC；实务常用）：按干预前协变量匹配后做 DID
psmatch2 treated2 x1 x2, out(y) logit common
pstest x1 x2, both                        // 匹配后平衡性：标准化差异应 < 0.1
reg y i.treated2##i.post [pw = _weight], vce(cluster id)
est store m_psm
* 注：psmatch2 生成的 _weight 为匹配权重；以 help psmatch2 为准
restore

* ---------- 6.5 更换结局与聚类层级 ----------
preserve
keep if inlist(t, 1, 2)
gen post = (t == 2)
gen treated2 = (g == 2)
reg adm i.treated2##i.post, vce(cluster id)      // 结局换为住院率：预期 ≈ -0.02
est store m_adm
* 聚类层级敏感性：地区 → 更保守的层级（示例：每 3 个地区并为一组）
egen group3 = group(ceil(id/3))
reg y i.treated2##i.post, vce(cluster group3)    // 聚类数变少，标准误通常变大
restore
```

```r
# 接第 2 步的 d2（t ∈ {1,2}；post、treated2 已定义）
library(fixest)

# ---------- 6.1 伪处理组（500 次随机重抽） ----------
set.seed(2026)
ids <- unique(d2$id)
b_null <- replicate(500, {
    fake <- sample(ids, 10)                      # 随机 10 个伪处理地区
    d2$treatedF <- as.integer(d2$id %in% fake)
    m <- feols(y ~ treatedF * post | id + t, data = d2, cluster = ~id)
    coef(m)["treatedF:post"]                     # 系数名以 coef(m) 输出为准
})
pval <- (sum(b_null <= -150) + 1) / 501          # 经验 p 值（单侧）
hist(b_null, breaks = 30, main = "伪处理组 DID 系数分布")
abline(v = -150, col = "red", lwd = 2)

# ---------- 6.2 伪时点 ----------
d_pre <- subset(dat, g %in% c(0, 3) & t %in% 1:2)
d_pre$post <- as.integer(d_pre$t == 2)
d_pre$treated3 <- as.integer(d_pre$g == 3)
feols(y ~ treated3 * post | id + t, data = d_pre, cluster = ~id)   # 预期 ≈ 0

# ---------- 6.3 剔除极端值 ----------
q <- quantile(d2$y, c(0.01, 0.99))
d2t <- subset(d2, y > q[1] & y < q[2])
feols(y ~ treated2 * post | id + t, data = d2t, cluster = ~id)

# ---------- 6.4 PSM-DID ----------
library(MatchIt)
d2pre <- subset(d2, t == 1)
m.out <- matchit(treated2 ~ x1 + x2, data = d2pre, method = "nearest", ratio = 1)
summary(m.out)                       # 匹配后标准化均值差应 < 0.1
# library(cobalt); love.plot(m.out)  # 平衡性图
md  <- match.data(m.out)             # 匹配样本（含 weights）
d2m <- subset(d2, id %in% unique(md$id))
feols(y ~ treated2 * post | id + t, data = d2m, cluster = ~id)

# ---------- 6.5 更换结局与聚类层级 ----------
feols(adm ~ treated2 * post | id + t, data = d2, cluster = ~id)     # 住院率 ≈ -0.02
d2$group3 <- ceiling(d2$id / 3)
feols(y ~ treated2 * post | id + t, data = d2, cluster = ~group3)   # 更保守聚类
```

---

### 第 7 步：报告清单

**方法**：政策评估报告至少包含以下内容，逐项核对：

1. **处理与对照定义**：谁在处理组、谁在对照；处理变量构造（组指示 × 时点指示）；队列规模表。
2. **干预时点**：政策生效时点、phase-in 说明、预期效应讨论。
3. **平行趋势证据**：事件研究图（含置信区间）+ 干预前系数联合检验 p 值；结合制度背景论证。
4. **主要 ATT 估计表**：系数、聚类稳健 SE、95% CI、观测数与聚类数；交错处理报聚合类型（simple / dynamic / group）。
5. **聚类标准误层级说明**：干预在哪个层级分配就在哪个层级聚类（本例：地区）；说明理由并报告层级敏感性。
6. **稳健性汇总**：伪处理组分布与经验 p 值、伪时点、剔除样本、PSM-DID、更换结局、更换聚类层级的结果一览。
7. **局限**：平行趋势不可完全检验、溢出 / 一般均衡、同期政策干扰、外部效度。

**代码**（结果表输出）：

```stata
* 结果表（esttab，SSC；官方 etable 亦可）
esttab m_2x2 m_psm m_adm, b(%9.2f) se(%9.2f) star(* 0.10 ** 0.05 *** 0.01) ///
    mtitles("2x2 DID" "PSM-DID" "结局=住院率") ///
    stats(N N_clust, labels("观测数" "聚类数"))
* CS 聚合结果用 estat simple / estat event 直接导出；
* esttab 与 etable 选项以 help esttab / help etable 为准
```

```r
# 结果表（fixest::etable 或 modelsummary）
etable(list(m_2x2, m_psm, m_adm), cluster = ~id, fitstat = ~n)
# library(modelsummary)
# modelsummary(list("2x2" = m_2x2, "PSM-DID" = m_psm, "住院率" = m_adm), stars = TRUE)
```

---

## 常见错误清单

- [ ] 用干预后年份的系数「检验」平行趋势（干预后系数是动态效应，不是平行趋势的证据）
- [ ] 两期数据硬做事件研究 / 交错处理估计（两期只能做 2×2；交错处理需要多期 + 多个入组时点）
- [ ] 交错处理仍用单一 post 的 TWFE，不报告 Callaway–Sant'Anna 等稳健估计量（效应异质时可能有负权重偏误）
- [ ] 忽略聚类层级：地区层面干预却在个体 / 人次层面聚类（标准误过小、过度拒绝）
- [ ] 处理组内部生效时点不同却统一用单一 post（把尚未处理的地区算成已处理）
- [ ] 把相关当因果：不讨论平行趋势、共同冲击与溢出，只做政策前后比较就下因果结论
- [ ] 安慰剂检验只做一次（单次随机化可能是偶然，需 ≥ 数百次置换并报告分布与经验 p 值）
- [ ] 平行趋势检验只看 p 值：不画图、不报置信区间、不讨论检验功效与基准期选择
- [ ] 把「前趋势检验不显著」直接当作「平行趋势成立」的证明
- [ ] 不报告处理组 / 对照组的事前基线平衡表与「谁在何时受处理」的构造
- [ ] 在 Stata 17 用 didregress 评估交错处理（didregress 假设单一处理时点；交错用 csdid / xthdidregress）
- [ ] 用干预后协变量做 PSM（匹配变量必须是干预前或时不变变量）
- [ ] 事件研究基准期取最早一期而非干预前一期（功效差、图难读）

## 输出格式（政策评估报告模板）

```
【研究设计与数据】
- 政策背景与干预时点；处理组/对照组定义、规模与队列分布（表 0）
- 数据来源、时期、结局定义（次均药品费用、住院率）；干预前基线平衡表

【识别假设】
- 平行趋势论证：图 1 事件研究图 + 干预前系数联合检验 p 值 + 制度背景
- 共同冲击、无预期效应、无溢出的讨论；不满足时的处理策略

【主要结果】
- 表 1：2×2 DID（或 didregress ATET）：系数、聚类稳健 SE、95% CI、观测数与聚类数
- 表 2（交错处理时）：Callaway-Sant'Anna 聚合 ATT（simple/dynamic/group，注明聚合类型与对照组）
- 图 2：动态处理效应（事件研究）图，注明基准期与置信区间

【稳健性】
- 表 3：伪处理组系数分布与经验 p 值（附直方图）；伪时点系数
- 表 4：剔除极端值/部分样本、PSM-DID、更换结局、更换聚类层级结果汇总

【结论与局限】
- 效应大小与政策含义（如集采使次均药品费用下降约 X 元、住院率变化）
- 局限：平行趋势不可完全检验、溢出/一般均衡、同期政策干扰、外部效度
```

## 使用提示

- 命令与选项随版本变化：Stata 18+ 有官方 `csdid` / `csdid_plot` / `xthdidregress`；Stata 17 用 `didregress`；更早版本用 SSC `csdid`。运行 `which csdid`、`help csdid`、`help didregress` 核对实际调用的版本与选项；凡标注「以 help / 帮助文档为准」处，运行前先核对本机文档。
- 聚类层级：干预在哪个层级分配就在哪个层级聚类；不确定时做多层级敏感性分析。
- 模拟数据用于演示完整流程（内置真实 ATT = −150）；真实研究需按政策实际设计处理组与干预时点，并核对数据质量、样本量与检验功效。
- 估计前先画「处理组 vs 对照组」各期均值图（第 1 步代码），图是识别策略的第一道检验。
- 本 Skill 提供方法与代码模板；平行趋势等识别假设的论证与最终结论由研究者负责。

---

## 引用 / Citation

中文：杜思娴. DID 双重差分助手：卫生政策效果评估 Skill [EB/OL]. (2026). https://naturedu.github.io/socialmedicine/.

English: Du, S. (2026). *DID Assistant: Difference-in-differences for health policy evaluation skill* [Skill definition]. https://naturedu.github.io/socialmedicine/.
