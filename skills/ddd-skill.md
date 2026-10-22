# Skill：三重差分助手（DDD 政策效果评估，Stata / R）

**版本** 1.0 · **作者** 杜思娴 (Du Sixian) · **许可** MIT · **更新** 2026-10-23

## 用途

一份可复用的「三重差分（Difference-in-Difference-in-Differences, DDD）」政策效果评估工作流：当 DID 的平行趋势在某一维度不成立时，引入第三个维度做双重剔除，用三重交互项识别政策净效应。贯穿示例：「国家药品集中带量采购对公立医院（vs 民营医院）集采品种（vs 非集采品种）药品费用的影响」，三维 = 时间 × 医院类型 × 品种类型。**每一步都给出「方法 + 代码」**（Stata `reg` / `reghdfe` / `permute` 与 R `fixest::feols`），并内置一套**自洽的模拟面板数据**（60 家医院 × 2 类药品 × 2 期，真实 DDD 效应 δ = −8 万元/月）贯穿全流程，可直接作为提示词喂给大语言模型，也可作为操作手册照做。

## 适用范围（明确边界）

允许：
- 帮助卫生政策评估研究者完成 DDD 的设定、估计、分解验证、稳健性检验与报告（社会医学、卫生经济学、药物经济学等）
- 用 Stata / R 生成模拟面板数据、估计三重交互模型、做两个 2×2 DID 的分解表与安慰剂检验
- 给出 DDD 识别假设（偏误同质性）、第三维度选择标准与事件研究式动态检验思路

**不允许：**
- 替研究者做「第三维度是否外生」「政策时点如何界定」的最终专业判断（需政策文件与领域知识支撑）
- 承诺 DDD 一定优于 DID 或结果一定可发表；不替代计量经济学教科书（Wooldridge、Angrist & Pischke 等）与期刊审稿要求
- 在未交代识别假设、未做分解表与稳健性检验的情况下武断下结论

## 软件准备

方法：Stata 17 及以上、R ≥ 4.2。Stata 侧 `reghdfe`（高维固定效应，作者 Sergio Correia）来自 SSC，依赖包 `ftools` 会随之自动安装；R 侧用 `fixest`（作者 Laurent Bergé，`feols` 支持固定效应 + 聚类稳健标准误）。所有命令与选项随版本更新，不确定处以 `help` / 帮助文档为准。

```stata
* Stata（联网安装一次）
ssc install reghdfe, replace
* 若 ftools 未被自动装上：ssc install ftools, replace
```

```r
# R
install.packages("fixest")
```

## 工作流程总览（7 步）

0. 构造贯穿全程的模拟面板数据（60 医院 × 2 品种 × 2 期，内置真实 DDD 效应）→ 1. 从 DID 到 DDD：动机 → 2. 模型设定与估计 → 3. 核心系数 δ 的解读与分解验证 → 4. 平行趋势与稳健性 → 5. 多期扩展简述 → 6. 报告清单。以下每一步均为「方法 + 代码」。

---

### 第 0 步：构造模拟面板数据（贯穿全流程）

**方法**：60 家医院（id 1–30 公立、31–60 民营）× 2 类药品（集采品种 / 非集采品种）× 2 期（政策前 / 政策后），共 240 个观测；结局 y = 月均药品费用（万元）。数据生成过程（DGP）为真实线性模型，**内置真实 DDD 效应 δ = −8**，并内置两个「偏误源」：γ12 = −6（公立医院特有趋势，如 DRG 付费、取消药品加成等同期政策）、γ23 = −4（集采品种特有趋势，如专利到期、临床替代）。每家医院加医院层面随机效应 u_i ~ N(0, 4²)，制造院内相关（这正是聚类的依据），再加个体噪声 ε ~ N(0, 2²)。另外生成两个稳健性结局（第 4 步用）：y_qty = 集采品种采购数量（相关结局，真实效应 δ = −3）、y_dev = 与药品无关的耗材费用（安慰剂结局，真实效应 δ = 0）。

**代码**：

```stata
* ============ 第 0 步：模拟面板数据（贯穿全流程） ============
clear all
set seed 2026

* 60 家医院：id 1-30 公立（treated = 1），31-60 民营（treated = 0）
set obs 60
gen id = _n
gen treated = (id <= 30)          // 处理维度：1 = 公立医院（受集采约束）
gen u_i = rnormal(0, 4)           // 医院层面随机效应（制造院内相关，聚类依据）

* 每家医院 2 类药品：group = 1 集采品种，0 非集采品种
expand 2
bysort id: gen group = _n - 1

* 每个（医院 × 品种）2 期：post = 0 政策前，1 政策后
expand 2
bysort id group: gen post = _n - 1
gen time = post                   // 供 reghdfe absorb() 使用

* ---------- 真实数据生成过程（DGP，内置真实 DDD 效应 δ = -8） ----------
* y = γ0 + γ1·treated + γ2·post + γ3·group
*     + γ12·treated×post + γ13·treated×group + γ23·post×group
*     + δ·treated×post×group + u_i + ε
local g0 100                        // 基组均值（民营 × 非集采 × 政策前）
local g1 10                         // 公立医院整体费用水平更高
local g2 -5                         // 全体时间趋势（普遍控费）
local g3 20                         // 集采品种用量大、费用更高
local g12 -6                        // 偏误 1：公立医院特有趋势（DRG / 取消加成等）
local g13 5                         // 公立医院对集采品种的固定偏好
local g23 -4                        // 偏误 2：集采品种特有趋势（专利到期等）
local delta -8                      // 真实 DDD 效应：集采使公立医院集采品种额外下降 8 万元/月

gen y = `g0' + `g1'*treated + `g2'*post + `g3'*group + ///
        `g12'*treated*post + `g13'*treated*group + `g23'*post*group + ///
        `delta'*treated*post*group + u_i + rnormal(0, 2)

* ---------- 稳健性结局（第 4 步用） ----------
* y_qty：集采品种采购数量（相关结局，真实效应较小 δ = -3）
gen y_qty = 60 + 8*treated - 4*post + 18*group - 3*treated*post + ///
            4*treated*group - 2*post*group - 3*treated*post*group + ///
            u_i + rnormal(0, 3)
* y_dev：与药品无关的耗材费用（安慰剂结局，真实 δ = 0）
gen y_dev = 40 + 5*treated - 2*post + 2*group + 1*treated*post - ///
            1*treated*group + 0.5*post*group + 0*treated*post*group + ///
            0.5*u_i + rnormal(0, 5)

* 数据体检：8 组均值表（Stata 17+；16 及更早用 bysort treated post group: summarize y）
table treated post group, stat(mean y) stat(sd y) nototals
* 期望组均值（噪声平均掉后）：民营 非集采 前 100 / 后 95；民营 集采 前 120 / 后 111；
*                             公立 非集采 前 110 / 后 99；公立 集采 前 135 / 后 112
```

```r
# ============ 第 0 步：模拟面板数据（贯穿全流程） ============
set.seed(2026)
N <- 60                                     # 60 家医院
dat <- expand.grid(id = 1:N, group = c(0, 1), post = c(0, 1))
dat$treated <- as.integer(dat$id <= 30)     # 处理维度：1 = 公立医院
dat$u_i     <- rnorm(N, 0, 4)[dat$id]       # 医院层面随机效应（聚类依据）
dat$time    <- dat$post                     # 供 fixest 吸收固定效应

# 真实参数（内置真实 DDD 效应 delta = -8）
g0 <- 100; g1 <- 10; g2 <- -5; g3 <- 20
g12 <- -6; g13 <- 5; g23 <- -4; delta <- -8

dat$y <- with(dat, g0 + g1*treated + g2*post + g3*group +
                   g12*treated*post + g13*treated*group + g23*post*group +
                   delta*treated*post*group + u_i + rnorm(nrow(dat), 0, 2))

# 稳健性结局：y_qty（相关结局，真实 δ = -3）；y_dev（安慰剂结局，真实 δ = 0）
dat$y_qty <- with(dat, 60 + 8*treated - 4*post + 18*group - 3*treated*post +
                      4*treated*group - 2*post*group - 3*treated*post*group +
                      u_i + rnorm(nrow(dat), 0, 3))
dat$y_dev <- with(dat, 40 + 5*treated - 2*post + 2*group + 1*treated*post -
                      1*treated*group + 0.5*post*group + 0*treated*post*group +
                      0.5*u_i + rnorm(nrow(dat), 0, 5))

# 8 组均值表（应与下方期望值接近）
aggregate(y ~ treated + post + group, data = dat, FUN = mean)
```

---

### 第 1 步：从 DID 到 DDD：动机

**方法**：

- **两个潜在偏误需要双重剔除**。本例若做单维 DID，任一维度都面临威胁：① 用「公立 vs 民营」做 DID（只看集采品种）——公立医院同时经历 DRG 付费改革、取消药品加成等**只作用于公立医院、不区分品种**的政策，其费用趋势与民营医院本来就不同（DGP 里 γ12 = −6）；② 用「集采品种 vs 非集采品种」做 DID（只看公立医院）——集采品种因专利到期、临床替代等**与医院类型无关**的原因费用下行（DGP 里 γ23 = −4）。两个威胁方向一致、大小不明，单维 DID 都会把它们混进政策效应里。
- **三重交互 δ 的经济含义**：δ = 政策在「处理维度 × 第三维度」上的**增量**效果——公立医院集采品种费用在政策后的额外变化，同时剔除 (a) 公立医院所有品种的共同变化、(b) 集采品种在所有医院的共同变化。δ 不等于任何一组的前后差：公立·集采的前后差 −23 万元里混着 γ2 + γ12 + γ23 + δ 四项。
- **图形直觉**：画四组均值线（公立·集采、公立·非集采、民营·集采、民营·非集采），DDD 就是「两条实线之间斜率差」减「两条虚线之间斜率差」。期望 8 组均值（噪声平均掉后）：

| 单元格 | 政策前 | 政策后 | 前后差 |
|---|---|---|---|
| 公立 · 集采 | 135 | 112 | −23 |
| 公立 · 非集采 | 110 | 99 | −11 |
| 民营 · 集采 | 120 | 111 | −9 |
| 民营 · 非集采 | 100 | 95 | −5 |

品种 DID（公立切片）＝ −23 − (−11) ＝ −12（把 δ = −8 与 γ23 = −4 混在一起）；品种 DID（民营切片）＝ −9 − (−5) ＝ −4（纯 γ23）；DDD ＝ −12 − (−4) ＝ −8，正好剔掉 γ23。镜像读法：医院 DID（集采切片）＝ −23 − (−9) ＝ −14（混着 γ12 = −6）；医院 DID（非集采切片）＝ −11 − (−5) ＝ −6；DDD ＝ −14 − (−6) ＝ −8。
- **什么时候用 DDD 而不是两个 DID**：两个维度的平行趋势都明显不可信、但可论证「威胁不随第三维度变化」时，用 DDD；只要某一维平行趋势（或偏误同质性）明显更可信，就优先用简单 DID——假设更少、效力更高、更好解释。第三维度必须分层清晰、尽量外生、8 个单元格样本均衡。

**代码**：

```stata
* 图形直觉：四组均值线（先平均到 8 个单元格）
preserve
collapse (mean) y, by(treated post group)
twoway (connected y post if treated==1 & group==1, sort) ///
       (connected y post if treated==1 & group==0, sort) ///
       (connected y post if treated==0 & group==1, sort) ///
       (connected y post if treated==0 & group==0, sort), ///
       legend(order(1 "公立·集采" 2 "公立·非集采" 3 "民营·集采" 4 "民营·非集采")) ///
       xtitle("post（0 政策前 / 1 政策后）") ytitle("月均药品费用（万元）")
restore
```

```r
# 图形直觉：四组均值线（两条 DID 线的斜率差之差 = DDD）
cell <- aggregate(y ~ treated + post + group, data = dat, FUN = mean)
plot(NA, xlim = c(0, 1), ylim = range(cell$y),
     xlab = "post（0 政策前 / 1 政策后）", ylab = "月均药品费用 y（万元）",
     main = "四组均值线：DDD = 实线斜率差 - 虚线斜率差")
lines(y ~ post, data = cell, subset = treated == 1 & group == 1, type = "b", col = "red",  lty = 1)
lines(y ~ post, data = cell, subset = treated == 1 & group == 0, type = "b", col = "blue", lty = 1)
lines(y ~ post, data = cell, subset = treated == 0 & group == 1, type = "b", col = "red",  lty = 2)
lines(y ~ post, data = cell, subset = treated == 0 & group == 0, type = "b", col = "blue", lty = 2)
legend("topright", c("公立·集采", "公立·非集采", "民营·集采", "民营·非集采"),
       col = c("red", "blue", "red", "blue"), lty = c(1, 1, 2, 2), bty = "n")
```

---

### 第 2 步：模型设定与估计（Stata / R 对应）

**方法**：饱和模型（所有主效应 + 全部两两交互 + 三重交互）：

Y = γ0 + γ1·treated + γ2·post + γ3·group + γ12·(treated×post) + γ13·(treated×group) + γ23·(post×group) + δ·(treated×post×group) + ε

逐项解释（基组 = 民营 × 政策前 × 非集采品种）：

- γ1（treated）：处理组与对照组的固定水平差（公立 vs 民营，品种平均）；
- γ2（post）：政策前后全体平均变化（时间主效应）；
- γ3（group）：第三维度两切片的固定差（集采 vs 非集采品种）；
- γ12（treated×post）：**偏误 1**——处理组特有趋势（公立医院所有品种的共同变化）；
- γ13（treated×group）：处理组内品种结构的固定差异（公立医院更依赖集采品种）；
- γ23（post×group）：**偏误 2**——第三维度特有趋势（集采品种在所有医院的共同变化）；
- δ（treated×post×group）：三重交互 = **政策净效应**，本 Skill 的核心系数。

**两两交互项一个都不能漏**：漏掉 γ12 或 γ23，δ 会把偏误吞进去；漏掉主效应则模型不饱和。

**Stata**：

- `i.treated##i.post##i.group` 中 `##` =「主效应 + 交互」，`#` =「仅交互」。三者连写展开为 7 项：`i.treated`、`i.post`、`i.group`（3 个主效应）＋ `i.treated#i.post`、`i.treated#i.group`、`i.post#i.group`（3 个两两交互）＋ `i.treated#i.post#i.group`（1 个三重交互）。
- 模型 A：`reg y i.treated##i.post##i.group, vce(cluster id)`（pooled OLS + 医院聚类稳健标准误）。
- 模型 B：`reghdfe y i.treated##i.post##i.group, absorb(id time) vce(cluster id)`。`absorb(id)` 吸收医院固定效应后 `treated` 主效应与 id 共线、`absorb(time)` 吸收时间固定效应后 `post` 主效应与 time 共线，这两个主效应会被 reghdfe 自动剔除并在输出中标注（collinearity）；其余交互项仍可估，δ 与模型 A 相同（饱和交互设定下等价）。若希望保留全部主效应，用模型 A 或不吸收 time。
- 以 help reghdfe 为准。

**R（fixest）**：

- `feols(y ~ treated*post*group | id + time, cluster = ~id)`。fixest 里 `*` 展开为主效应 + 全部交互（对应 Stata 的 `##`），`:` 只写单个交互（对应 Stata 的 `#`）；`(treated + post + group)^3` 也展开为全部 7 项。`|` 后为固定效应，`cluster = ~id` 为聚类稳健标准误。
- 变量保持 0/1 数值型时，系数 `treated:post:group` 就是 δ；若改用 factor，fixest 会生成水平虚拟变量（需确认参照水平），因此建议保持 0/1 数值型。吸收 id、time 后 treated、post 因共线被自动移除（输出会提示 collinearity）。以 fixest 帮助文档为准。

**代码**：

```stata
* ---------- 模型 A：pooled OLS + 医院聚类稳健标准误 ----------
reg y i.treated##i.post##i.group, vce(cluster id)
est store ddd_ols

* ---------- 模型 B：医院 + 时间固定效应（reghdfe） ----------
reghdfe y i.treated##i.post##i.group, absorb(id time) vce(cluster id)
est store ddd_fe
* 说明：treated、post 主效应被吸收（与 id / time 固定效应共线，输出中标注）；
*       两两交互与三重交互仍可估，δ 与模型 A 相同
```

```r
library(fixest)

# 模型 A：pooled OLS + 医院聚类稳健标准误（不吸收固定效应）
m_ols <- feols(y ~ treated*post*group, cluster = ~id, data = dat)
summary(m_ols)

# 模型 B：医院 + 时间固定效应（treated、post 因共线被自动移除）
m_fe <- feols(y ~ treated*post*group | id + time, cluster = ~id, data = dat)
summary(m_fe)

# 三重交互系数 δ（fixest 中交互用 ":" 连接，对应 Stata 的 #）
coef(m_fe)["treated:post:group"]
```

---

### 第 3 步：核心系数 δ 的解读与分解验证

**方法**：

- **δ 的边际含义（两种双重差分之差）**：
  δ ＝ [E(Y|公立,集采,后) − E(Y|公立,集采,前) − E(Y|公立,非集采,后) + E(Y|公立,非集采,前)] − [民营对应项] ＝ **品种 DID（公立切片）− 品种 DID（民营切片）**；镜像等价于 **医院 DID（集采切片）− 医院 DID（非集采切片）**。
- **验证性分解表**：先跑两个 2×2 DID（第三维度各取一个切片），再跑完整 DDD，展示「DDD ＝ DID1 − DID2」。用本模拟数据：DID1（品种|公立）≈ −12、DID2（品种|民营）≈ −4、DDD ≈ −12 − (−4) ＝ −8 ＝ 主回归三重交互系数；镜像分解 −14 − (−6) ＝ −8。若分解表与三重交互系数对不上，先查模型设定（漏交互项、参照组、编码）而不是查数据。
- **报告口径**：δ 的单位与 y 一致（本例为「万元/月」）；若 y 取对数，δ ≈ 半弹性（百分点的近似）。分解表同时暴露两个偏误的方向与大小（本例：−6 与 −4，均使单维 DID 高估政策效果）。

**代码**：

```stata
* ---------- 3.1 两个 2×2 DID（品种类型 DID，在公立/民营切片上） ----------
reg y i.post##i.group if treated == 1, vce(cluster id)
local did1 = _b[1.post#1.group]          // 期望 ≈ -12（= γ23 + δ）
reg y i.post##i.group if treated == 0, vce(cluster id)
local did2 = _b[1.post#1.group]          // 期望 ≈ -4（= γ23）

* ---------- 3.2 分解：DDD = DID1 - DID2 ----------
display "DID1(品种|公立) = " %5.2f `did1'
display "DID2(品种|民营) = " %5.2f `did2'
display "DDD = DID1 - DID2 = " %5.2f (`did1' - `did2')

* ---------- 3.3 镜像分解（医院类型 DID，在集采/非集采切片上） ----------
reg y i.treated##i.post if group == 1, vce(cluster id)
local did1b = _b[1.treated#1.post]       // 期望 ≈ -14（= γ12 + δ）
reg y i.treated##i.post if group == 0, vce(cluster id)
local did2b = _b[1.treated#1.post]       // 期望 ≈ -6（= γ12）
display "镜像分解：DID(医院|集采) - DID(医院|非集采) = " %5.2f (`did1b' - `did2b')

* ---------- 3.4 与主回归三重交互系数对照（期望 ≈ -8） ----------
reg y i.treated##i.post##i.group, vce(cluster id)
display "主回归三重交互系数 δ = " %5.2f _b[1.treated#1.post#1.group]
```

```r
# 3.1 两个 2×2 DID（品种类型 DID 在公立/民营切片上）
did1 <- coef(feols(y ~ post*group | id, cluster = ~id, data = dat[dat$treated == 1, ]))["post:group"]
did2 <- coef(feols(y ~ post*group | id, cluster = ~id, data = dat[dat$treated == 0, ]))["post:group"]
c(DID1 = unname(did1), DID2 = unname(did2), DDD = unname(did1 - did2))
# 期望：DID1 ≈ -12，DID2 ≈ -4，DDD ≈ -8 = δ

# 3.2 镜像分解（医院类型 DID 在集采/非集采切片上），期望 ≈ -8
d1 <- coef(feols(y ~ treated*post | id, cluster = ~id, data = dat[dat$group == 1, ]))["treated:post"]
d2 <- coef(feols(y ~ treated*post | id, cluster = ~id, data = dat[dat$group == 0, ]))["treated:post"]
unname(d1 - d2)

# 3.3 与主回归三重交互系数对照（期望 ≈ -8）
coef(m_fe)["treated:post:group"]
```

---

### 第 4 步：平行趋势与稳健性（识别假设、动态检验、安慰剂、替换结局）

**方法**：

- **DDD 的识别假设（比 DID 更弱）**：
  1. **偏误同质性（核心，替代平行趋势）**：不要求任一单维的平行趋势成立，只要求「一个维度 DID 的偏误不随第三维度变化」——即公立医院特有趋势对集采与非集采品种相同（γ12 不再 ×group），或集采品种特有趋势对公立与民营相同（γ23 不再 ×treated）。写作假设：E[ε|treated, post, group] 中所有「×group」的项只经 γ13 与 δ 进入。
  2. 无政策预期（anticipation）：政策落地前医院、厂商、医保未提前调整行为。
  3. 无跨单元溢出（SUTVA）：集采不改变民营医院对应品种的定价/用量，非集采品种不因替代效应被波及；若溢出存在，需建模或换第三维度。
  4. 政策时点无其他与「医院类型 × 品种类型」交互的同期冲击。
- **第三维度选择三原则**：① 第三维度尽量外生（不受政策影响，如目录固定于政策前版本）；② 两个切片「共享同一时间趋势威胁」更可信（偏误同质才站得住）；③ 8 个单元格样本不能太空（决定效力）。
- **事件研究式动态检验**：两期数据无法做动态图（只有一期政策后）。多期数据下把 post 换成事件时间虚拟变量，看三重交互系数在政策前是否 ≈ 0（偏误同质的动态版本）、政策后如何演化；政策前一期为基准。
- **安慰剂 1（伪第三维度）**：随机重排 group，破坏「品种维度」结构后重估 δ，置换分布应围绕 0，真实 δ = −8 应落在尾部。Stata 用 `permute`（注意：它置换的是 group 的全部效应，检验的是「group 与 y 无关」的整体零假设，比纯三重交互零假设更严格）；R 用医院内重排（保留医院结构）。
- **安慰剂 2（伪时点）**：需 ≥ 3 期数据，把政策时点前移，用「伪政策」前数据估计 δ 应 ≈ 0；本模拟仅两期，只能给示意代码。
- **替换结局**：相关结局（采购数量 y_qty，δ ≈ −3）方向一致、量级不同属正常；无关结局（耗材费用 y_dev，δ ≈ 0）是安慰剂结局，显著则提示混杂。
- **聚类层级敏感性**：主结果按处理分配层级（医院）聚类；敏感性可做多向聚类（reghdfe `vce(cluster id time)`；fixest 的 `vcov` / `cluster` 多变量写法以帮助文档为准）。

**代码**：

```stata
* ---------- 动态检验思路（示意，需多期数据；本模拟两期无法执行） ----------
* 假设 time = -2..2，政策时点 = 0，基准期 = -1：
* reghdfe y ib(-1).time##i.treated##i.group, absorb(id) vce(cluster id)
* 关注各期 1.time#1.treated#1.group 系数（政策前应 ≈ 0）
* 画图：ssc install coefplot; coefplot, keep(*.time#1.treated#1.group) vertical yline(0)
* 具体 keep 匹配规则以 help coefplot 为准

* ---------- 安慰剂 1：伪第三维度（Stata permute，200 次） ----------
* 随机置换 group，破坏品种维度结构；真实 δ = -8 应落在置换分布左尾之外
permute group delta = _b[1.treated#1.post#1.group], ///
        reps(200) seed(2026): reg y i.treated##i.post##i.group, vce(cluster id)

* ---------- 安慰剂 2：伪时点（示意，需 time = 0..3 的多期数据） ----------
* gen post_fake = (time == 1)        // 把政策提前到 t=1，只用真政策前数据
* reg y i.treated##i.post_fake##i.group if time < 2, vce(cluster id)  // 期望 δ ≈ 0

* ---------- 替换结局 ----------
reghdfe y_qty i.treated##i.post##i.group, absorb(id time) vce(cluster id)  // 相关结局：期望 δ ≈ -3
reghdfe y_dev i.treated##i.post##i.group, absorb(id time) vce(cluster id)  // 安慰剂结局：期望 δ ≈ 0

* ---------- 聚类层级敏感性：多向聚类（reghdfe 支持） ----------
reghdfe y i.treated##i.post##i.group, absorb(id time) vce(cluster id time)
```

```r
# ---------- 安慰剂 1（R 版）：伪第三维度，医院内随机交换品种标签，200 次 ----------
set.seed(2026)
perm_delta <- replicate(200, {
  d <- dat
  d$group_p <- ave(d$group, d$id, FUN = sample)      # 每家医院内部重排，保留医院结构
  coef(feols(y ~ treated*post*group_p | id + time, data = d))["treated:post:group_p"]
})
hist(perm_delta, main = "伪第三维度：δ 的置换分布（200 次）")
abline(v = -8, col = "red", lwd = 2)                 # 真实 δ = -8 应落在左尾之外
mean(perm_delta <= -8)                               # 置换单侧 p 值（期望接近 0）

# ---------- 替换结局 ----------
coef(feols(y_qty ~ treated*post*group | id + time, cluster = ~id, data = dat))["treated:post:group"]  # 期望 ≈ -3
coef(feols(y_dev ~ treated*post*group | id + time, cluster = ~id, data = dat))["treated:post:group"]  # 期望 ≈ 0

# 伪时点（示意，需 ≥3 期数据）：把政策时点前移后用真政策前数据估计 δ，期望 ≈ 0；
# 写法同上，仅替换 post 变量与子样本（以 fixest 帮助文档为准）
```

---

### 第 5 步：多期扩展简述（交错 DDD）

**方法（点到为止）**：真实政策常多批落地（如各省集采执行时间不同），此时静态「前后」二分会把异质时点压平，且交错处理下的两两比较存在负权重问题。现状：① 传统做法仍是静态 DDD + 三重事件研究（triple event study，见第 4 步动态检验）；② Callaway & Sant'Anna (2021)、Sun & Abraham (2021)、de Chaisemartin & D'Haultfœuille (2020)、Borusyak et al. (2022) 等交错 DID 估计器主要针对两维设定，三重差分扩展可先在第三维切片上做「差之差」再套用 CS 类估计器，或使用将 CS 框架推广到 DDD 的新文献；Olden & Møen (2022) 系统梳理了 DDD 的识别条件，建议先读。**交错 DID 与 CS 类估计器的完整工作流（含代码）见同仓库的《DID 助手》Skill**，本 Skill 不再展开。

---

### 第 6 步：报告清单

**方法**：正式报告至少覆盖六块——

1. **三维定义**：时间维度（政策时点 + 政策文件依据）、处理维度（受政策约束 vs 不受约束）、第三维度（分层依据：如集采目录 vs 非集采），并论证第三维度选择（外生性、偏误同质性的理由）；
2. **各组均值表**：2×2×2 八个单元格的均值、SD、N（第 0 步输出）；
3. **主回归表**：逐步回归——只放主效应 → 加两两交互 → 加三重交互；报 δ、聚类稳健 SE、95% CI、N 与聚类数；
4. **DDD 分解表**：两个 2×2 DID 系数 + 差值（第 3 步），展示 DDD ＝ DID1 − DID2 与主回归 δ 一致，并标注两个偏误的方向与大小；
5. **稳健性**：伪第三维度、伪时点（若多期）、替换结局、事件研究图（若多期）、聚类层级敏感性；
6. **局限**：偏误同质假设的论证强度、第三维度与政策的相关性、溢出可能（集采价格联动民营 / 非集采品种）、8 单元格样本均衡性与外部效度。

**代码**：

```stata
* 主回归表：逐步（仅主效应 → +两两交互 → +三重交互）
reg y i.treated i.post i.group, vce(cluster id)
est store m1
reg y i.treated i.post i.group i.treated#i.post i.treated#i.group i.post#i.group, vce(cluster id)
est store m2
reg y i.treated##i.post##i.group, vce(cluster id)
est store m3
estimates table m1 m2 m3, b(%9.2f) se stats(N)
* 报告时另附 95% CI（reg 输出自带）与聚类数（60 家医院）
```

```r
# 主回归表：逐步（fixest 的 etable；模型 SE 已在估计时按 id 聚类）
m1 <- feols(y ~ treated + post + group, cluster = ~id, data = dat)
m2 <- feols(y ~ treated*post + treated*group + post*group, cluster = ~id, data = dat)
m3 <- feols(y ~ treated*post*group, cluster = ~id, data = dat)
etable(m1, m2, m3)          # 选项以 ?etable 为准
```

---

## 常见错误清单

- [ ] 只放三重交互、漏掉两两交互项（尤其 treated×post 与 post×group）→ δ 吞入偏误，模型不饱和
- [ ] 把三重交互系数直接当因果、不交代识别假设（偏误同质性、无预期、SUTVA）
- [ ] 混淆 DDD 与三因素 ANOVA：统计设定相同，但 ANOVA 无「政策」与因果承诺；DDD 的全部含义在识别假设与分解表
- [ ] 聚类层级错误：按「医院 × 品种 × 时点」聚类（过度聚类）或忽略医院层面相关；应按处理分配层级（医院）聚类，再做多向聚类敏感性
- [ ] 第三维度与处理相关：第三维度本身受政策影响（如目录因集采扩容），或第三维度选择未论证外生性
- [ ] 仍要求两个维度各自满足平行趋势——要求过强；DDD 只需「偏误不随第三维度变化」，报告里要写清楚这一点
- [ ] 分解表方向写反：DID1 − DID2 的减数与被减数弄反，正负号错且与主回归 δ 对不上
- [ ] 两期数据硬做动态事件研究或伪时点（不可行）；两期只能做伪第三维度 + 替换结局 + 假设论证
- [ ] permute / 随机化安慰剂不设种子、置换时打乱医院内部结构（R 版应先按 id 分组再重排）
- [ ] reghdfe 吸收 id 后 treated 主效应被 drop（共线标注），却仍强行解读其主效应
- [ ] 固定效应 / 对数变换下不交代 δ 的解释单位（万元/月 vs 百分点近似）
- [ ] 不报分解表与 8 组均值表，读者无法核对三重交互的构成

## 输出格式（DDD 报告模板）

```
【三维定义】
时间维度（政策时点及文件依据）；处理维度（受政策约束 vs 不受约束）；第三维度（分层依据）；
第三维度选择论证（外生性、偏误同质性理由）。

【描述统计】
表 1：2×2×2 八个单元格的均值、SD、N（公立/民营 × 集采/非集采 × 政策前/后）。

【主回归】
表 2：逐步回归（主效应 → +两两交互 → +三重交互），报 δ、聚类稳健 SE、95% CI、N、聚类数；
固定效应版本（reghdfe / feols）与 pooled OLS 并列。

【DDD 分解】
表 3：DID1（维度 A 的 2×2 DID，第三维度切片 1）− DID2（第三维度切片 0）＝ δ；
标注两个偏误的方向与大小；附镜像分解。

【稳健性】
表 4：伪第三维度（置换 p 值）、伪时点（若多期）、替换结局、事件研究图（若多期）、
聚类层级敏感性（多向聚类）。

【局限】
识别假设（偏误同质）论证；第三维度与政策相关性；溢出可能（价格联动、替代效应）；
8 单元格样本均衡性；外部效度。
```

## 使用提示

- 命令与选项随版本更新：运行 `help reghdfe`、`help permute`、R 侧 `help(feols)` 核对；不确定的语法一律以官方帮助文档为准。
- 建议流程：先用第 0 步模拟数据跑通全部代码（分解表应精确还原 δ = −8），再套用到真实数据；真实数据先跑两个 2×2 DID 与 8 组均值表，判断是否需要 DDD。
- 聚类层级以「处理分配的层级」为准（本例：医院）；敏感性用多向聚类（reghdfe `vce(cluster id time)`）。
- 两期数据无法做动态检验与伪时点，务必如实说明，不要硬造趋势图。
- 本 Skill 提供方法与代码模板；政策背景判断、第三维度选择与最终结论由研究者负责。

---

## 引用 / Citation

中文：杜思娴. 三重差分助手：DDD 卫生政策效果评估 Skill [EB/OL]. (2026). https://naturedu.github.io/socialmedicine/.

English: Du, S. (2026). *Triple Differences Assistant: DDD for health policy evaluation skill* [Skill definition]. https://naturedu.github.io/socialmedicine/.
