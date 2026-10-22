# Skill：DCE 设计助手（离散选择实验设计与分析，Stata / R）

**版本** 1.0 · **作者** 杜思娴 (Du Sixian) · **许可** MIT · **更新** 2026-10-23

## 用途

一份可复用的「离散选择实验（Discrete Choice Experiment, DCE）」设计—分析工作流：从属性与水平设定、正交 / D-效率实验设计、选择集构造与分块，到 Stata（`clogit` / `mixlogit` / `lclogit2`）与 R（`mlogit` / `gmnl`）的模型估计、支付意愿（WTP）计算与结果报告。**每一步都给出「方法 + 代码」**，可直接作为提示词喂给大语言模型，也可作为操作手册照做。

## 适用范围（明确边界）

允许：
- 帮助研究者完成 DCE 全流程的设计与分析（健康经济学、环境经济学、交通、市场营销等陈述性偏好研究）
- 给出正交主效应设计、部分因子设计、D-效率设计的方法与 Stata/R 代码
- 用条件 logit（clogit）、混合 logit（mixlogit）、潜类别模型（latent class）估计偏好与 WTP

**不允许：**
- 替研究者做属性与水平的最终专业判断（需领域专家意见与利益相关者访谈支撑）
- 承诺设计或结果一定可发表；不替代计量经济学教科书与期刊审稿要求
- 在未检验 IIA、未说明分布假设的情况下武断下结论

## 软件准备

方法：Stata 17 及以上、R ≥ 4.2。分析命令 `mixlogit`、`lclogit2`、`dcreate` 来自 SSC（作者 Arne Hole）；R 侧用 `DoE.base`（正交表）、`AlgDesign`（D-效率设计）、`mlogit` / `gmnl`（分析）。

```stata
* Stata（联网安装一次）
ssc install mixlogit, replace
ssc install lclogit2, replace
ssc install dcreate,  replace
```

```r
# R
install.packages(c("DoE.base", "AlgDesign", "support.CEs", "mlogit", "gmnl"))
```

## 工作流程总览（8 步）

1. 确定属性与水平 → 2. 正交 / D-效率实验设计 → 3. 设计质量检查 → 4. 选择集构造与分块 → 5. 问卷与预测试 → 6. 样本量与 long 数据整理 → 7. clogit / mixlogit / 潜类别估计 → 8. 解读与报告。以下每一步均为「方法 + 代码」。

---

### 第 1 步：确定属性与水平

**方法**：文献综述 + 定性访谈（专家、患者/消费者、决策者）确定候选属性；一般 4–7 个属性、每个 2–4 个水平。水平需可实现、可理解、覆盖现实政策范围；「价格 / 费用」属性建议连续或至少 3 个水平，便于计算 WTP。全因子规模 = 各属性水平数相乘，用于判断是否需要缩减设计。

**代码**：

```stata
* Stata：生成 2^4 全因子（16 行），用于观察所有组合
clear
set obs 16
gen a = mod(_n-1, 2)              // 0/1
gen b = mod(int((_n-1)/2), 2)
gen c = mod(int((_n-1)/4), 2)
gen d = mod(int((_n-1)/8), 2)
list
```

```r
# R：属性水平表与全因子规模
levels <- list(费用 = c(10, 30, 50),   # 元/次
               候诊 = c(1, 3, 7),      # 天
               连续性 = c(0, 1),       # 0=不同医生 1=同一医生
               目录 = c(0, 1))         # 0=基础目录 1=扩展目录
sapply(levels, length)                 # 各属性水平数
full <- expand.grid(levels)            # 全因子组合
nrow(full)                             # 3*3*2*2 = 36
```

---

### 第 2 步：正交设计与 D-效率设计

**方法**：

- **正交主效应设计（orthogonal main-effects plan）**：在「主效应可估」前提下，把全因子压缩进正交表 Ln(m^k)（如 L8(2^7)、L9(3^4)、L36(2^11×3^12)）。要求：每列各水平出现次数相等（水平平衡），任意两列的水平组合出现次数相等（相关 = 0）。
- **部分因子设计 2^(k-p)**：用生成元压缩。例：4 个两水平属性取 8 行、生成元 d = a×b×c（模 2），得到分辨率 IV 设计——主效应相互正交，且不与任何两因子交互混杂。
- **D-效率设计（推荐，可充分利用先验、能排除不可行组合）**：极大化信息矩阵行列式。Stata 用 `dcreate`，R 用 `AlgDesign::optFederov` / `idefix`，商业软件可用 Ngene 或 SAS PROC OPTEX。

**代码**：

```stata
* Stata：2^(4-1) 分辨率 IV 正交主效应设计（8 行，生成元 d = a*b*c 模 2）
clear
set obs 16
gen a = mod(_n-1, 2)
gen b = mod(int((_n-1)/2), 2)
gen c = mod(int((_n-1)/4), 2)
gen d = mod(int((_n-1)/8), 2)
keep if mod(a+b+c+d, 2) == 0
list, sep(0)

* Stata：3^4 的 L9 正交设计（9 行）
clear
set obs 27
gen a = mod(_n-1, 3)
gen b = mod(int((_n-1)/3), 3)
gen c = mod(int((_n-1)/9), 3)
keep if mod(a+b+c, 3) == 0

* Stata：D-效率设计（dcreate，SSC）。示例：3 个属性、每选择集 2 个方案、12 个选择集
matrix b0 = J(1, 3, 0)                    // 先验参数（默认 0）
dcreate i.x1 i.x2 i.x3, nalt(2) nset(12) bmat(b0) seed(2026)
* 注：dcreate 要求因子变量写法；详细选项以 help dcreate 为准
```

```r
# R：正交主效应设计（DoE.base）
library(DoE.base)
des24 <- oa.design(nlevels = c(2, 2, 2, 2))    # 2^4 → 8 行 L8
des33 <- oa.design(nlevels = c(3, 3, 3, 3))    # 3^4 → 9 行 L9
as.data.frame(des24)

# R：D-效率设计（AlgDesign）
library(AlgDesign)
full36 <- expand.grid(x1 = c(0, 1, 2), x2 = c(0, 1, 2), x3 = c(0, 1), x4 = c(0, 1))
dopt <- optFederov(~ ., data = full36, nTrials = 16, criterion = "D")
dopt$design                                  # 选中的 16 个 profile
dopt$D                                       # D-效率值
```

---

### 第 3 步：检查设计质量

**方法**：四项检查——① 正交性：任意两列相关 ≈ 0；② 水平平衡：每列各水平出现次数相等；③ 无主导（dominance）：同一选择集内不存在「在所有属性上都不差于另一方案」的方案；④ 效率：D-效率尽可能高（可与全因子对照）。不通过则换正交表、换生成元或增加行数。

**代码**：

```stata
* Stata：水平平衡 + 两两相关
tab1 a b c d
pwcorr a b c d
```

```r
# R：水平平衡、相关矩阵与设计效率
apply(des24, 2, table)                       # 水平平衡
round(cor(as.data.frame(des24)), 3)          # 正交性：非对角应 ≈ 0
eval.design(~ ., dopt$design)                # AlgDesign：方差膨胀、D/G 效率
```

---

### 第 4 步：构造选择集与分块

**方法**：把设计行**两两随机配对**组成选择集（典型：2 个方案 + 1 个 opt-out「都不选」）；配对时避免重复组合与主导对。每名受访者作答 6–10 个选择集；超过问卷容量则**分块（block）**，块间随机分配给受访者。选择集顺序、方案左右位置均随机化，并生成多个问卷版本。

**代码**：

```r
# R：随机配对、分块
library(dplyr)
set.seed(2026)
prof  <- as.data.frame(des24) |> sample_frac(1)      # 随机打乱
pairs <- matrix(seq_len(nrow(prof)), ncol = 2, byrow = TRUE)
nset  <- nrow(pairs)                                  # 选择集数
nblock <- 2; per <- 2                                 # 2 个块、每块 2 题
block  <- rep(1:nblock, each = per, length.out = nset)
out <- data.frame(choice_set = rep(1:nset, each = 2),
                  block = rep(block, each = 2),
                  alt = rep(1:2, times = nset),
                  prof[as.vector(t(pairs)), ])
# opt-out 在问卷中额外提供“都不选”；数据里记 alt == 3、各属性 = 0
```

```stata
* Stata：为每个选择集追加 opt-out 行（alt == 3，属性全为 0）
local nset 4
forvalues s = 1/`nset' {
    set obs `=_N+1'
    replace choice_set = `s' if _n == _N
    replace alt = 3 if _n == _N
    foreach v in a b c d {
        replace `v' = 0 if _n == _N
    }
}
```

---

### 第 5 步：问卷与预测试

**方法**：预测试分两轮——① think-aloud 认知访谈 5–10 人，检查属性表述是否被正确理解；② 小样本 30–50 份，检查：是否存在「永远选同一方案 / 永远选 opt-out」的受访者、是否有主导选项、任务负担与完成时间是否合理。据结果修正水平、措辞或题数。

**代码**：

```stata
* Stata：预测试数据体检——受访者选择 opt-out 的次数分布
egen n_optout = total(choice == 1 & alt == 3), by(id)
tab n_optout
* 提示：某受访者所有题都选 opt-out，说明属性或任务设计可能有问题
```

```r
# R：同一检查
library(dplyr)
dat |> group_by(id) |>
  summarise(n_optout = sum(choice == 1 & alt == 3),
            n_A      = sum(choice == 1 & alt == 1),
            n_total  = n_distinct(choice_set))
```

---

### 第 6 步：样本量与 long 数据整理

**方法**：

- **样本量**（Orme 经验法则）：n ≥ 500 × c / (t × a)，其中 c = 水平数最多的属性的水平数，t = 每受访者选择集数，a = 每选择集方案数（不含 opt-out）。例：c = 3、t = 8、a = 2 → n ≥ 500×3/16 ≈ 94；正式研究按预算与检验力要求上调。
- **数据格式**：long（长表），每行 = 受访者 × 选择集 × 方案；必需变量 `id`、`choice_set`、`alt`、`choice`（1/0）与各属性取值；opt-out 行属性全为 0。
- **编码**：连续属性用原始数值；分类属性用 effects coding（-1/0/1）或虚拟变量，全流程保持一致，报告时注明。

**代码**：

```stata
* Stata：示例 long 数据（1 名受访者、2 个选择集、各 3 个方案）
clear
input id choice_set alt choice a b c d
1 1 1 1 0 0 1 1
1 1 2 0 1 1 0 0
1 1 3 0 0 0 0 0
1 2 1 0 1 0 1 0
1 2 2 1 0 1 0 1
1 2 3 0 0 0 0 0
end

* 宽表 → 长表（宽表每行一个选择集，选项变量带后缀 _1/_2/_3）
reshape long choice_ a_ b_ c_ d_, i(id choice_set) j(alt)
rename (choice_ a_ b_ c_ d_) (choice a b c d)

* effects coding 示例：三水平属性 a（0/1/2 → -1/0/1）
recode a (0 = -1) (1 = 0) (2 = 1)
```

```r
# R：dfidx 构造选择数据（mlogit 用）
library(mlogit)
md <- dfidx(dat, idx = c("id", "alt"), choice = "choice")
```

---

### 第 7 步：模型估计（Stata 与 R 对应）

#### 7.1 条件 logit（`clogit`）

**方法**：随机效用模型 U = β'x + ε，ε 为独立同分布 I 型极值分布，则方案选择概率 P = exp(V)/Σexp(V)。适用前提是 IIA（无关方案独立性）；可用「子集删除」的系数稳定性直觉检验。违反 IIA → 改用 mixlogit 或潜类别模型。同一受访者的多个选择相关，标准误需 `vce(cluster id)`。**WTP = −β_属性 / β_费用**（费用系数为负）。

**代码**：

```stata
clogit choice a b c d, group(choice_set) vce(cluster id)
est store clogit

* WTP：d 为费用属性时的属性 b 的 WTP（delta 方法，含 95% CI）
nlcom wtp_b: -_b[b] / _b[d]

* IIA 直觉检验：删除 opt-out 后系数应大体稳定
clogit choice a b c d if alt != 3, group(choice_set) vce(cluster id)
```

```r
# R：clogit（survival）与 mlogit 等价实现
library(survival)
clogit(choice ~ a + b + c + d + strata(choice_set), data = dat)

library(mlogit)
m1 <- mlogit(choice ~ a + b + c + d | 0, data = md)
summary(m1)
```

#### 7.2 混合 logit（`mixlogit`）

**方法**：允许系数在个体间服从分布（正态 / 对数正态等），捕捉**偏好异质性**；随机系数 SD 显著即存在异质性。费用属性常用对数正态（保持负号），抽样用 Halton 序列 `nrep(500)`。与 clogit 比较 AIC/BIC（`fitstat`）判断是否需要异质性设定。

**代码**：

```stata
* 随机系数：a、b、c 正态，d 固定
mixlogit choice a b c d, group(choice_set) id(id) rand(a b c) nrep(500)
est store mixl
fitstat                                     // AIC/BIC，与 clogit 比较

* 对数正态费用 + 相关随机参数（ln(1) = rand() 中第 1 个随机参数取对数正态）
mixlogit choice a b c d, group(choice_set) id(id) rand(a b c) ln(1) corr nrep(500)

* WTP：mixlwtp（SSC）或 delta 方法；具体语法以 help mixlwtp 为准
```

```r
# R：混合 logit（mlogit rpar）
m2 <- mlogit(choice ~ a + b + c + d | 0, data = md,
             rpar = c(a = "n", b = "n", c = "n"),
             R = 500, halton = NA, panel = TRUE)
summary(m2)
```

#### 7.3 潜类别 logit（latent class，`lclogit2`）

**方法**：假设存在 K 个不可观测的偏好类别，各类别内系数不同（类别内同质、类别间异质）。**类别数 K 用 BIC/AIC 选择**（`lclogit2` 默认输出）。类成员平均概率用 `lclogitprob`；刻画「谁属于哪类」可用类成员协变量模型 `lclogitml`（成员方程放入年龄、收入等），或事后与个体特征交叉描述。

**代码**：

```stata
lclogit2 choice a b c d, group(choice_set) id(id) nclasses(2) seed(2026)
lclogit2, nclasses(3) seed(2026)            // 比较 BIC/AIC 选类别数
est store lc3
lclogitprob, cpprob(3)                      // 各类别平均成员概率
estat lcmean, post                          // 各类别协变量均值（刻画类别特征）

* 类成员协变量模型（membership 方程放入 age、income）
lclogitml choice a b c d, group(choice_set) id(id) nclasses(3) membership(age income)

* WTP：lcwtp（lclogit2 附带），语法以 help lcwtp 为准；
* 或手工取各类别系数比值并配合 delta 方法
```

```r
# R：潜类别 logit（gmnl）
library(gmnl)
lc <- gmnl(choice ~ a + b + c + d | 0 | 0 | 0 | 1, data = md,
           model = "lc", panel = TRUE, Q = 3)
summary(lc)
```

---

### 第 8 步：结果解读与报告

**方法**：

- **主表**：clogit / mixlogit / 潜类别三模型并列，报系数（SE）；mixlogit 报均值与 SD；潜类别报各类别系数与成员概率。
- **WTP 表**：WTP = −β_x / β_cost，95% CI 用 delta 方法（`nlcom`）或 Krinsky-Robb（`mixlwtp` 等），报告所用方法。
- **文字结论**：系数方向与显著性 → 政策含义；SD 显著或类别差异 → 细分人群偏好。
- **报告规范**：建议对照 ISPOR conjoint checklist：属性与水平依据、设计类型与效率、预测试、估计方法与分布假设、WTP 区间。

**代码**：

```stata
* WTP 与置信区间（clogit，delta 方法）
nlcom wtp_b: -_b[b] / _b[d], post
estimates store wtp_b

* 三模型并列输出
estimates table clogit mixl lc3, b(%9.3f) se stats(N aic bic)
```

```r
# R：delta 方法 WTP（car::deltaMethod）
library(car)
deltaMethod(coef(m1), "-b/d")               # 按实际系数名替换 b、d
```

---

## 常见错误清单

- [ ] 用 `mlogit` 当 `clogit` 用（未指定 `group()` / `strata()`）→ 系数有偏
- [ ] 忘记 `vce(cluster id)` → 标准误低估
- [ ] opt-out 编码不一致（有的 0、有的缺失）
- [ ] effects coding 与虚拟变量混用、编码前后不一致
- [ ] 不检验 IIA 就下结论
- [ ] 把分类水平的 1/2/3 直接当连续变量解释
- [ ] 未报告设计类型、效率与预测试信息
- [ ] mixlogit 随机分布选择无依据（如费用却用对称正态）

## 输出格式（分析报告模板）

```
【设计与数据】
属性/水平表；设计类型（正交 / D-效率）与效率值；选择集与块数；预测试结果；样本量与法则依据。

【模型估计】
表 1：clogit 主结果；表 2：mixlogit 均值 + SD；表 3：潜类别各类别系数与成员概率（附 AIC/BIC 选 K 的依据）。

【WTP】
WTP = -β_x / β_cost 及 95% CI（注明 delta / Krinsky-Robb 方法）。

【结论与局限】
方向性结论 + 偏好异质性 + 局限（IIA、分布假设、设计假设、外部效度）。
```

## 使用提示

- 命令与选项随版本更新，运行 `help clogit` / `help mixlogit` / `help lclogit2` / `help dcreate` 核对。
- 设计阶段建议流程：先全因子/正交表做基线，再用 `dcreate` 或 `AlgDesign` 做 D-效率设计，比较 D 值后定稿。
- 本 Skill 提供方法与代码模板；研究背景、属性取舍与最终结论由研究者负责。

---

## 引用 / Citation

中文：杜思娴. DCE 设计助手：离散选择实验设计与 Stata/R 分析 Skill [EB/OL]. (2026). https://naturedu.github.io/socialmedicine/.

English: Du, S. (2026). *DCE Design Assistant: Discrete choice experiment design and Stata/R analysis skill* [Skill definition]. https://naturedu.github.io/socialmedicine/.
