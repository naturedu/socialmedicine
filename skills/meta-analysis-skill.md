# Skill：Meta 分析助手（系统评价效应合并，Stata / R）

**版本** 1.0 · **作者** 杜思娴 (Du Sixian) · **许可** MIT · **更新** 2026-10-23

## 用途

一份可复用的「系统评价与 Meta 分析」工作流：从 PICO 问题、PRISMA 检索—筛选—纳入流程与数据提取，到 Stata（官方 `meta` 命令族；SSC 的 `metan` / `metareg` / `metabias`）与 R（`meta`、`metafor`）的效应量计算（OR/RR 对数尺度、MD/Hedges' g）、固定/随机效应合并、森林图、异质性检验与亚组/meta 回归、发表偏倚评估，以及 PRISMA 2020 报告与 GRADE 证据分级。**每一步都给出「方法 + 代码」**；一组自洽的虚构示例数据（8 项 RCT，二分类结局 OR 与连续结局 MD/SMD 各一组）贯穿全部步骤，可直接作为提示词喂给大语言模型，也可作为操作手册照做。典型场景：「某新型降糖/降压干预对结局的 RCT 汇总」或「某慢病管理项目对住院率的 OR 汇总」。

## 适用范围（明确边界）

允许：
- 帮助研究者完成 RCT / 观察性研究系统评价的效应量合并、异质性检验、亚组/meta 回归与发表偏倚评估全流程
- 给出二分类（OR / RR）与连续（MD / SMD）结局的效应量与标准误计算、固定/随机效应模型、森林图、发表偏倚检验的 Stata / R 代码
- 用示例数据演示 PRISMA 2020 报告要点与 GRADE 证据分级方法

**不允许：**
- 替研究者做文献检索、纳入排除与偏倚风险评价的最终专业判断（需双人独立筛选、第三方仲裁与领域知识支撑）
- 承诺结果一定可发表；不替代 Cochrane Handbook、PRISMA 2020 声明与期刊审稿要求
- 在异质性来源未讨论、偏倚风险未评价的情况下武断下结论

## 软件准备

方法：Stata 17 及以上（官方 `meta` 命令族需 Stata 16+；`confunnel` 需 Stata 17+；`meta bias` 需 Stata 18+）；R ≥ 4.2。`metan`、`metareg`、`metabias` 为社区命令，来自 SSC（作者 Harris、Harbord 等，Stata Journal 文献见各自 help 文件）；R 侧用 `meta`（Schwarzer 等）与 `metafor`（Viechtbauer）。

```stata
* Stata（联网安装一次；metafunnel 一般随 metan 附带，缺失时单独安装）
ssc install metan, replace
ssc install metareg, replace
ssc install metabias, replace
```

```r
# R
install.packages(c("meta", "metafor"))
```

## 工作流程总览（7 步）

1. 研究问题与检索（PICO + PRISMA）→ 2. 效应量与标准误计算 → 3. 固定/随机效应模型 → 4. 森林图 → 5. 异质性、亚组与 Meta 回归 → 6. 发表偏倚评估 → 7. 报告清单与证据分级。以下每一步均为「方法 + 代码」。

---

### 第 1 步：研究问题与检索（PICO + PRISMA）

**方法**：

- **PICO(S) 问题**（示例贯穿全篇）：P = 2 型糖尿病成年患者；I = 社区慢病管理项目（个案管理 + 电话随访）；C = 常规门诊照护；O1 = 12 个月内住院（二分类，OR）；O2 = HbA1c 较基线变化（连续，MD/SMD）；S = RCT。
- **检索**：先注册方案（如 PROSPERO）；检索式 = PICO 要素 + 布尔逻辑 + 主题词（MeSH / Emtree）+ 研究设计过滤器；数据库示例 PubMed、Embase、Cochrane Central、CBM、CNKI、万方；辅以灰色文献与纳入研究的参考文献回溯。检索式全文必须留存（报告附录）。
- **筛选**：双人独立按「标题/摘要 → 全文」两轮筛选，分歧由第三人仲裁；逐条记录排除原因；管理工具 EndNote / Covidence / RevMan。
- **PRISMA 2020 流程图**（识别 → 筛选 → 纳入资格 → 纳入）各段数字必须完整、排除原因分类必须可核查。示例：
- **数据提取表字段**：作者、年份、国家、设计、随访时长；两组样本量与基线特征；结局定义与测量时点；二分类 → 两组事件数/总数；连续 → 两组 n、均值、SD（缺 SD 时由 CI、SE、P 值或中位数-IQR 按 Wan 等方法换算并注明）；偏倚风险条目（随机序列、分配隐藏、盲法、失访）。

**代码**：

```text
PRISMA 2020 流程示例（虚构数字，与后文 8 项研究自洽）：
识别：数据库检索 n = 2347（PubMed 812；Embase 1030；Cochrane Central 301；CBM/CNKI/万方 204）
      去重后 n = 1682
筛选：标题/摘要初筛排除 n = 1548（与研究问题无关 1201；综述/评论 210；非目标人群 137）
纳入资格：全文评估 n = 134，排除 n = 126
      （非 RCT 21；不报告目标结局 58；重复发表 12；无法获取数据 17；其他 18）
纳入：进入定量合成 n = 8
```

```stata
* Stata：示例数据录入（8 项 RCT，虚构演示数据）
* et/nt = 试验组住院事件数/总数；ec/nc = 对照组住院事件数/总数
* m_t/sd_t/m_c/sd_c = 两组 HbA1c 变化值(%)的均值/标准差
* mode：1 = 个案管理+电话随访，0 = 单纯电话随访（第 5 步亚组用）
clear
input str10 study year et nt ec nc m_t sd_t m_c sd_c mode
"Zhang" 2018 45 150 68 150 -1.0  0.7  -0.30 0.8  1
"Li"    2019 40 140 64 140 -1.1  0.75 -0.25 0.85 1
"Wang"  2019 60 150 62 150 -0.4  0.8  -0.25 0.75 0
"Chen"  2020 38 130 60 128 -0.9  0.7  -0.20 0.75 1
"Liu"   2021 64 160 62 155 -0.35 0.85 -0.30 0.8  0
"Zhao"  2022 36 100 37 100 -0.5  0.8  -0.30 0.8  0
"Sun"   2023 48 130 50 130 -0.45 0.8  -0.25 0.75 0
"Xu"    2024 42 135 63 132 -1.0  0.75 -0.25 0.8  1
end
label define mode_lb 1 "个案管理+电话随访" 0 "单纯电话随访"
label values mode mode_lb
```

```r
# R：同一份示例数据
dat <- data.frame(
  study = c("Zhang", "Li", "Wang", "Chen", "Liu", "Zhao", "Sun", "Xu"),
  year  = c(2018, 2019, 2019, 2020, 2021, 2022, 2023, 2024),
  et = c(45, 40, 60, 38, 64, 36, 48, 42),
  nt = c(150, 140, 150, 130, 160, 100, 130, 135),
  ec = c(68, 64, 62, 60, 62, 37, 50, 63),
  nc = c(150, 140, 150, 128, 155, 100, 130, 132),
  m_t  = c(-1.0, -1.1, -0.4, -0.9, -0.35, -0.5, -0.45, -1.0),
  sd_t = c(0.7, 0.75, 0.8, 0.7, 0.85, 0.8, 0.8, 0.75),
  m_c  = c(-0.3, -0.25, -0.25, -0.2, -0.3, -0.3, -0.25, -0.25),
  sd_c = c(0.8, 0.85, 0.75, 0.75, 0.8, 0.8, 0.75, 0.8),
  mode = c(1, 1, 0, 1, 0, 0, 0, 1))   # 1=个案管理+电话随访，0=单纯电话随访
```

---

### 第 2 步：效应量与标准误计算

**方法**：

- **二分类（OR / RR，均在对数尺度计算，lnOR/lnRR 渐近正态）**。四格表单元：a = 试验组事件、b = 试验组非事件、c = 对照组事件、d = 对照组非事件。
  - lnOR = ln((a·d)/(b·c))；**SE(lnOR) = sqrt(1/a + 1/b + 1/c + 1/d)**
  - lnRR = ln((a/(a+b))/(c/(c+d))) = ln((a·nc)/(c·nt))；SE(lnRR) = sqrt(1/a − 1/(a+b) + 1/c − 1/(c+d))
  - 95% CI：exp(lnOR ± 1.96·SE)；出现零单元时各格 +0.5 连续性校正，或改用 Peto OR / Mantel-Haenszel。
- **连续**：
  - MD = m_t − m_c；SE(MD) = sqrt(sd_t²/n_t + sd_c²/n_c)（仅同单位、同量表结局可直接合并）
  - **Hedges' g**：s_pooled = sqrt(((n_t−1)sd_t² + (n_c−1)sd_c²)/(n_t+n_c−2))；小样本校正 J = 1 − 3/(4(n_t+n_c) − 9)；g = MD/s_pooled · J；SE(g) ≈ sqrt((n_t+n_c)/(n_t·n_c) + g²/(2(n_t+n_c)))
  - 度量选择：单位可比 → MD；单位/量表不可比 → SMD；SMD 按 Cohen 标准解读（0.2 小 / 0.5 中 / 0.8 大）；同一分析只用一个度量，SMD 与 MD 不得混入同一合成。
- **数据口径**：变化值（change from baseline）优先；不得把变化值与终值、调整与未调整估计混入同一分析。

**代码**：

```stata
* ---- 手工计算（先核对，再交给批量命令）----
gen a = et                      // 试验组事件
gen b = nt - et                 // 试验组非事件
gen c = ec                      // 对照组事件
gen d = nc - ec                 // 对照组非事件
gen lnOR   = ln((a*d)/(b*c))
gen selnOR = sqrt(1/a + 1/b + 1/c + 1/d)
gen OR     = exp(lnOR)
gen loOR   = exp(lnOR - 1.96*selnOR)
gen hiOR   = exp(lnOR + 1.96*selnOR)
gen lnRR   = ln((a/nt)/(c/nc))
gen selnRR = sqrt(1/a - 1/nt + 1/c - 1/nc)
* 零单元处理：a b c d 各 +0.5 后按上式重算（或 metan ..., peto）

* ---- 连续：MD 与 Hedges' g ----
gen MD    = m_t - m_c
gen seMD  = sqrt(sd_t^2/nt + sd_c^2/nc)
gen sp    = sqrt(((nt-1)*sd_t^2 + (nc-1)*sd_c^2)/(nt+nc-2))
gen J     = 1 - 3/(4*(nt+nc) - 9)
gen g     = MD/sp*J
gen seg   = sqrt((nt+nc)/(nt*nc) + g^2/(2*(nt+nc)))
list study year OR loOR hiOR MD seMD g seg

* 单研究核对：esize 逐条 immediate 形式（语法以 help esize 为准）
esize twosample 150 -1.0 0.7 150 -0.3 0.8, hedgesg
```

```r
# R：手工计算（与 Stata 公式一致）
dat$a <- dat$et; dat$b <- dat$nt - dat$et
dat$c <- dat$ec; dat$d <- dat$nc - dat$ec
dat$lnOR   <- with(dat, log((a*d)/(b*c)))
dat$selnOR <- with(dat, sqrt(1/a + 1/b + 1/c + 1/d))
dat$MD   <- dat$m_t - dat$m_c
dat$seMD <- with(dat, sqrt(sd_t^2/nt + sd_c^2/nc))
sp <- with(dat, sqrt(((nt-1)*sd_t^2 + (nc-1)*sd_c^2)/(nt+nc-2)))
J  <- with(dat, 1 - 3/(4*(nt+nc) - 9))
dat$g   <- dat$MD/sp*J
dat$seg <- with(dat, sqrt((nt+nc)/(nt*nc) + g^2/(2*(nt+nc))))

# R：metafor::escalc（由原始数据直接计算，推荐；结果 yi/vi 与手工一致）
library(metafor)
dat.or  <- escalc(measure = "OR",  ai = et, n1i = nt, ci = ec, n2i = nc,
                  data = dat, slab = study)
dat.rr  <- escalc(measure = "RR",  ai = et, n1i = nt, ci = ec, n2i = nc,
                  data = dat, slab = study)
dat.md  <- escalc(measure = "MD",  m1i = m_t, sd1i = sd_t, n1i = nt,
                  m2i = m_c, sd2i = sd_c, n2i = nc, data = dat, slab = study)
dat.smd <- escalc(measure = "SMD", m1i = m_t, sd1i = sd_t, n1i = nt,
                  m2i = m_c, sd2i = sd_c, n2i = nc, data = dat, slab = study)
# 注：escalc 的 "SMD" 默认即 Hedges' g（含小样本校正）；参数名以 ?escalc 为准
```

---

### 第 3 步：固定效应与随机效应模型

**方法**：

- **固定效应**（Stata 官方现称 common-effect）：假设单一真实效应；权重 w_i = 1/v_i；合并 = Σw_i·y_i/Σw_i；SE = 1/sqrt(Σw_i)。
- **随机效应**：真实效应服从分布，权重 w_i = 1/(v_i + τ²)；τ² 估计方法：DL（DerSimonian-Laird，`metan` 默认）、REML（官方 `meta regress` 与 `metafor` 默认，推荐）、PM 等，**报告时必须注明**。
- **模型选择**：先看异质性——Q 检验 p 值、I²（< 25% 低、25–50% 中等、50–75% 实质、> 75% 高）、τ²。注意：Q 检验力低，p > 0.05 ≠ 无异质性；模型应在方案中预规定。稳妥做法：默认随机效应（推断可外推到研究总体分布），同时报固定效应作敏感性分析；I² 大时优先解释异质性来源（见第 5 步），而非机械换模型。
- **预测区间**（prediction interval）：反映真实效应分布范围，与置信区间含义不同，建议报告。

**代码**：

```stata
* ---- 官方 meta 命令族（Stata 16+；fixed 为 common 的兼容旧称）----
meta set lnOR selnOR, studylabel(study) esize(OR)
meta summarize, fixed random                 // Q、I²、tau² + 合并估计
meta esize, fixed random(dlaird)             // 合并估计；REML 用 random(reml)
meta esize, random(reml)                     // 方法子选项以 help meta esize 为准

* ---- SSC metan（经典）----
* 二分类四变量顺序 = 试验组事件 试验组总数 对照组事件 对照组总数（不是四格表 a b c d！）
metan et nt ec nc, or fixed random label(namevar=study, yearvar=year) sortby(year)

* 连续六变量 = n1 mean1 sd1 n2 mean2 sd2；md 或 hedges（选项以 help metan 为准）
metan nt m_t sd_t nc m_c sd_c, md fixed random label(namevar=study, yearvar=year)
metan nt m_t sd_t nc m_c sd_c, hedges fixed random label(namevar=study, yearvar=year)
```

```r
# R：meta 包
library(meta)
m.or <- metagen(TE = lnOR, seTE = selnOR, studlab = study, data = dat,
                sm = "OR", fixed = TRUE, random = TRUE,
                method.tau = "REML", prediction = TRUE)
m.md <- metacont(n.e = nt, mean.e = m_t, sd.e = sd_t,
                 n.c = nc, mean.c = m_c, sd.c = sd_c,
                 studlab = study, data = dat, sm = "MD",
                 fixed = TRUE, random = TRUE, method.tau = "REML")
m.smd <- update(m.md, sm = "SMD")            // 默认 Hedges' g
summary(m.or)

# 也可直接由四格表计数（metabin，参数名注意 event.e/n.e/event.c/n.c）
m.or2 <- metabin(event.e = et, n.e = nt, event.c = ec, n.c = nc,
                 studlab = study, data = dat, sm = "OR", method = "MH",
                 fixed = TRUE, random = TRUE, method.tau = "REML")
```

---

### 第 4 步：森林图

**方法**：方块大小 ∝ 权重（随机效应下小研究权重被抬升）；横线 = 研究内 95% CI；菱形 = 合并估计（宽度 = 95% CI）；竖线 = 无效线（OR/RR 为 1，MD/SMD 为 0）。读图顺序：① 菱形与无效线关系；② 各方块与 CI 的分布、离群研究；③ 结合 I² 判断方向是否一致。报告注明尺度（对数或原始值）、权重列、「有利于谁」的方向标注与所用模型（固定/随机 + τ² 方法）。

**代码**：

```stata
* 官方
meta forestplot, esrefline(1) fixed random          // OR 无效线 = 1
* 连续结局：先 meta set g seg, studylabel(study) esize(hedgesg)，无效线 = 0
meta forestplot, esrefline(0) random
graph export forest_or.png, replace width(2000)     // 导出高清图

* metan 自带森林图（lcols/rcols 控制列；favours 以 # 分隔左右文字）
metan et nt ec nc, or random label(namevar=study, yearvar=year) sortby(year) ///
    forestplot(lcols(study year) rcols(OR loOR hiOR) favours(慢病管理降低住院 # 常规照护降低住院))
```

```r
# R：meta 包
forest(m.or, sortvar = year, leftcols = c("studlab", "year"),
       rightcols = c("effect", "ci"), test.overall = TRUE)

# R：metafor（atransf = exp 把对数尺度还原为 OR；refline = 1 为无效线）
res <- rma(yi, vi, data = dat.or, method = "REML")
forest(res, slab = dat.or$study, atransf = exp, refline = 1,
       xlab = "OR（对数尺度）")
```

---

### 第 5 步：异质性检验与亚组分析、Meta 回归

**方法**：

- **Q 检验**：H0 各研究真实效应相同；检验力低，解读需谨慎。**I²**：研究间真实差异所致变异占比，判定标准 25 / 50 / 75%；**τ²**：绝对量纲（结局尺度上），I² 与 τ² 都要报告。残余 I²（I²_res）用于 meta 回归后衡量协变量解释了多少异质性。
- **亚组分析**：按方案预规定的研究特征分组（设计、随访时长、干预强度等）；结论看组间差异检验，而非各组内是否显著；注意生态谬误（研究水平协变量不能推断个体水平因果）。
- **Meta 回归**：研究数少时极易过拟合，经验法则**每 10 项研究至多 1 个协变量**；未预登记一律标为探索性。Stata 官方 `meta regress` 默认 REML + Knapp–Hartung；SSC `metareg` 默认矩估计（mm，可 reml）。

**代码**：

```stata
* ---- 亚组（mode：1=个案管理+电话随访，0=单纯电话随访）----
* 官方：subgroup() 森林图 + 分组合并
meta forestplot, subgroup(mode) addoverall
meta esize if mode == 1, random
meta esize if mode == 0, random
* 或 SSC metan 的 by()
metan et nt ec nc, or random by(mode) label(namevar=study, yearvar=year)

* ---- Meta 回归（协变量 year：发表年份趋势）----
meta regress year                     // 官方：REML + Knapp–Hartung（以 help meta regress 为准）
metareg lnOR year, wsse(selnOR) mm    // SSC metareg；REML 用 metareg ..., wsse(selnOR) reml
* metareg 输出含 tau² 与 I²_res；语法细节以 help metareg 为准
```

```r
# R：亚组（byvar 须在 metagen 的原始 data 中）
update(m.or, byvar = mode)
forest(update(m.or, byvar = mode))

# R：meta 回归
metareg(m.or, ~ year)                                # meta 包（默认 REML，以 help(metareg) 为准）
rma(yi, vi, mods = ~ year, data = dat.or, method = "REML")   # metafor
rma(yi, vi, mods = ~ mode, data = dat.or, method = "REML")   # 二分类协变量等价于亚组
```

---

### 第 6 步：发表偏倚评估

**方法**：

- **漏斗图**（效应量 vs 标准误/精度）：目测对称性。**漏斗图不对称 ≠ 发表偏倚**：也可能来自真实异质性、小研究效应、方法学质量差异或机遇；研究数 < 10 时目测与检验均不可靠。
- **统计检验**：Egger（线性回归，连续结局较适用）、Begg（秩相关）；二分类推荐 Harbord / Peters（优于 Egger）。
- **轮廓增强漏斗图**（contour-enhanced funnel）：辅助区分——「缺失」研究多落在无统计学显著区域时更提示发表偏倚。
- **trim-and-fill**：估计「缺失」研究数并给出调整后估计，属敏感性分析，不是纠偏证明。
- 检验力低时报告「未检出明显证据」，而非「无发表偏倚」。

**代码**：

```stata
* 官方（Stata 16+/17+/18+）
meta funnelplot, esrefline(1)
confunnel                       // 轮廓增强漏斗图（Stata 17+；选项以 help confunnel 为准）
meta bias, egger begg harbord   // Stata 18+；以 help meta bias 为准

* SSC（metafunnel 一般随 metan 附带；以 ssc describe metan 为准）
metafunnel _ES _seES
metabias lnOR selnOR, egger     // Egger：效应量与 SE 两变量
metabias lnOR selnOR, begg      // Begg 秩相关（选项名以 help metabias 为准）
metabias a b c d, harbord       // Harbord：四格表单元 a b c d
```

```r
# R：meta 包
funnel(m.or)
metabias(m.or, method.bias = "linreg")   // Egger（加权线性回归）
metabias(m.or, method.bias = "rank")     // Begg 秩相关
tf <- trimfill(m.or); summary(tf); funnel(tf)

# R：metafor
funnel(res)
regtest(res, model = "rma")              // Egger（meta 回归法）
trimfill(res)                            // 输出 k0 与调整后估计
```

---

### 第 7 步：报告清单与证据分级（PRISMA 2020 + GRADE）

**方法**：

- **PRISMA 2020**：27 项清单中与统计最相关的——检索可复现（数据库、日期、完整检索式）；筛选流程数字与排除原因；偏倚风险评价工具（RCT：RoB 2；观察：ROBINS-I）；效应量定义与合成方法（固定/随机、τ² 估计方法）；异质性、亚组/敏感性、发表偏倚；证据确定性（GRADE）；注册号与资金来源。
- **结果表**：研究水平（效应量、95% CI、权重）+ 汇总水平（模型、合并估计、Q/I²/τ²）+ 亚组/meta 回归 + 敏感性分析。
- **GRADE**：RCT 起始「高」，按 5 个降级域（偏倚风险、不一致性、间接性、不精确性、发表偏倚）与 3 个升级域（大效应、剂量-反应、残余混杂方向）调整 → 高/中/低/极低。逐条写出理由，勿只给等级。

**代码**：

```stata
* 汇总表所需数字（填入报告模板）
meta summarize, fixed random
meta forestplot, fixed random            // 报告用图；graph export 导出高清格式
```

```r
# R：一键提取汇总表关键数字（meta 包）
with(m.or, c(Q = Q, df.Q = df.Q, p.Q = pval.Q, I2_pct = I2*100,
             tau2 = tau2, tau = tau, OR_rand = exp(TE.random),
             lo_rand = exp(lower.random), hi_rand = exp(upper.random),
             p_rand = pval.random))
m.or$w.random                            // 各研究随机效应权重（%）
```

---

## 常见错误清单

- [ ] 只报合并效应不报 I² / Q / τ²，或「I² 大就随机、I² 小就固定」机械切换（模型与 τ² 估计方法应在方案中预规定，并常同时报告两种模型）
- [ ] 把漏斗图不对称当作发表偏倚的「铁证」（可能来自异质性、小研究效应、方法学差异；< 10 项研究时目测不可靠）
- [ ] `metan` 四变量顺序/含义混淆：metan 的 a b c d = 试验组事件/总数/对照组事件/总数，**不是**四格表单元（单元式才是 1/a+1/b+1/c+1/d 的 a b c d）
- [ ] SE(lnOR) 公式用错（应为 sqrt(1/a+1/b+1/c+1/d)，a/b/c/d 为四格表单元）；零单元未做 +0.5 校正或未改用 Peto/MH
- [ ] SMD 与 MD 混用：同一合成中混入两种度量，或把 SMD 当 MD 解释（SMD 无原始单位，需按 Cohen 标准解读）
- [ ] 连续结局把「变化值」与「终值」、不同时点、调整与未调整估计混入同一分析
- [ ] 忽略研究内相关：同一研究多个结局/多组/多时点重复计入（双重计数）；整群随机或交叉设计未校正
- [ ] meta 回归过拟合：8–10 项研究放多个协变量（经验法则每 10 项研究 ≤ 1 个协变量；未预登记标为探索性）
- [ ] 亚组结论用研究内比较的逻辑解释（生态谬误）；只看亚组内显著性、不做组间差异/meta 回归检验
- [ ] Egger/Begg 检验在 < 10 项研究时检验力低，p > 0.05 就宣称「无发表偏倚」
- [ ] 把 trim-and-fill 调整后估计当成「真实效应」，而非敏感性分析
- [ ] 森林图 CI 跨 1（OR/RR）或跨 0（MD/SMD）仍写「显著」
- [ ] 权重含义不说明（固定与随机权重不同，随机效应下小研究权重被抬升）
- [ ] 报告不附检索式、排除原因、偏倚风险评价与 PRISMA 清单（不可复现）

## 输出格式（Meta 分析报告模板）

```
【Meta 分析报告模板】

一、背景与问题：PICO 一句话 + 注册号（如 PROSPERO CRD…）
二、方法：数据库与检索式（附录）；纳入/排除标准；筛选流程（PRISMA 2020 流程图）；
     偏倚风险工具（RoB 2 / ROBINS-I）；效应量定义（OR/RR/MD/SMD）；
     合成模型（固定/随机 + τ² 估计方法 DL/REML）；异质性、亚组/敏感性、发表偏倚计划
三、结果：
   表 1 纳入研究特征（作者、年份、国家、设计、样本量、干预/对照、结局定义、随访时长）
   表 2 每项研究效应量（95% CI）与权重（固定/随机）
   表 3 汇总（示例输出，以实际运行结果为准）：
       结局        研究数  合并效应量(95% CI)   模型        Q(df), p      I²    τ²
       住院(OR)    8       0.69 (0.53–0.88)     随机(REML)  14.6(7), 0.04  52%   0.07
       HbA1c(MD)   8       …                   随机(REML)  …              …     …
   图 1/图 2 森林图（标注方向、模型与权重）
   表 4 亚组 / meta 回归（如有）：分组效应量、组间差异 p、回归系数(95% CI)、I²_res
   图 3 漏斗图（可加轮廓增强）+ Egger/Begg p 值 + trim-and-fill 调整估计
四、讨论：异质性来源、临床/政策含义、局限（检索语言、灰色文献、研究数少、混杂）
五、GRADE：每结局确定性（高/中/低/极低）与逐条理由。
   示例（住院结局）：8 项 RCT 起点「高」；
   - 偏倚风险 −1（多数未报告分配隐藏/盲法）；
   - 不一致性 −1（I² ≈ 52%，方向一致但幅度差异大）；
   → 确定性「低」。
六、利益冲突与资金来源
```

## 使用提示

- 命令与选项随版本更新：Stata 侧 `help meta` / `help metan` / `help metareg` / `help metabias` / `help confunnel`；R 侧 `help(metagen)` / `help(metacont)` / `help(metabin)` / `help(escalc)` / `help(rma)` 核对。
- Stata 16+ 官方 `meta` 命令族与 SSC `metan` 是两套体系（变量、结果存储与图形语法不同），勿混用；建议初学先手工 gen lnOR/selnOR 或 `escalc` 核对数字，再交给批量命令，两边结果一致再继续。
- 二分类结局选 OR 还是 RR 应在研究问题层面（发病率 vs 患病率人群）确定；零单元多（稀有事件）用 Peto OR（`metan et nt ec nc, peto`）或 MH 法。
- 本 Skill 提供方法与代码模板；文献检索策略、纳入排除与最终结论由研究者负责。

---

## 引用 / Citation

中文：杜思娴. Meta 分析助手：系统评价效应合并 Skill [EB/OL]. (2026). https://naturedu.github.io/socialmedicine/.

English: Du, S. (2026). *Meta-Analysis Assistant: Systematic review effect synthesis skill* [Skill definition]. https://naturedu.github.io/socialmedicine/.
