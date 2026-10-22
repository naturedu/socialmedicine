# Skill：定性方法与结构方程专题（扎根理论 / SEM / 多层SEM / fsQCA，R / Stata）

**版本** 1.0 · **作者** 杜思娴 (Du Sixian) · **许可** MIT · **更新** 2026-10-23

## 用途

一份可复用的「定性方法与结构方程」专题教程，覆盖社会医学与卫生管理研究中四个高频方法：**扎根理论**（质性理论建构）、**结构方程模型 SEM**（潜变量测量与路径）、**多层/多重嵌套 SEM**（嵌套数据）、**fsQCA 模糊集定性比较分析**（组态因果）。每个专题都是「方法 + 代码」，R 与 Stata 双轨，可作为提示词喂给大语言模型，也可作为操作手册照做。

## 适用范围（明确边界）

允许：
- 指导研究者完成四个专题的建模、估计、解读与报告
- 给出可运行的 R（lavaan / QCA / quanteda）与 Stata（sem / gsem / fuzzy）代码
- 帮助理解方法适用条件与常见错误

**不允许：**
- 替研究者做理论建构与质性编码（扎根理论以人工编码为主，软件只是辅助）
- 保证模型拟合一定达标；不替代教科书与期刊审稿要求
- 把探索性结果当作验证性结论发表

## 软件准备

方法：R ≥ 4.2（lavaan、QCA、quanteda）；Stata 16+（sem、gsem 内置，fuzzy 来自 SSC）。质性编码软件可选 NVivo / MAXQDA / Atlas.ti（中国场景常用 NVivo）。

```stata
* Stata（联网安装一次）
ssc install fuzzy, replace
```

```r
# R
install.packages(c("lavaan", "QCA", "quanteda"))
```

## 工作流程总览（4 个专题）

1. 扎根理论 → 2. SEM → 3. 多层 SEM → 4. fsQCA。选型建议：有访谈/文本想**建构理论**用专题 1；有量表与理论模型想**检验潜变量关系**用专题 2；数据**嵌套**（患者-科室-医院）用专题 3；中小样本想回答**哪些条件组合**导致结果用专题 4。

---

### 专题 1：扎根理论（Grounded Theory）

**方法**：

- **三级编码**：开放式编码（逐句贴标签）→ 主轴编码（范畴归类与关系，如因果/情境/策略/结果）→ 选择性编码（核心范畴与故事线）。
- **理论抽样与饱和**：按新出现的范畴决定下一步采谁；新资料不再产生新范畴即饱和。
- **备忘录**：编码全程记录想法，是理论的原料。
- **流派**：Strauss-Corbin 偏结构化程序（编码范式）；Charmaz 偏建构主义（理论是研究者与资料共建的）。报告注明所循流派。
- **报告规范**：COREQ 清单（研究团队与反思性、研究设计、分析发现三大域）。质性分析以**人工编码为主**；文本挖掘只做词频/共现提示。

**代码**（R 文本辅助，编码仍由人完成）：

```r
library(quanteda)
# 示例访谈（虚构片段，演示用）
interviews <- data.frame(
  id = 1:6,
  text = c(
    "医保报销比例提高以后，我们村慢病患者愿意按时复诊了，负担轻了很多。",
    "村卫生室药品不全，想开的药经常没有，只能去镇上，路远还要排队。",
    "签约的家庭医生上门测血压，老人觉得被重视，依从性好多了。",
    "镇卫生院设备老化，有些检查做不了，来回县里要一整天。",
    "报销手续以前要跑好几趟，现在村卫生室直接结算，方便多了。",
    "宣传不够，很多老人根本不知道慢病门诊能报销多少。")
)
corp <- corpus(interviews, text_field = "text", docid_field = "id")
toks <- tokens(corp, remove_punct = TRUE)
dfmat <- dfm(toks)
textstat_frequency(dfmat, n = 20)               # 高频词 → 开放编码线索
fcm(toks, context = "window", window = 5) |>    # 词共现 → 主轴编码线索
  textplot_network(min_freq = 2)
```

**输出要求**：编码表（范畴—子范畴—原始引文）、理论模型图（核心范畴与关系）、饱和度说明、研究者立场（反思性）。

---

### 专题 2：结构方程模型（SEM）

**方法**：

- **测量模型（CFA）**：潜变量由多个条目测量；看标准化载荷（≥0.5，理想 ≥0.7）、组合信度 CR（≥0.7）、平均方差抽取 AVE（≥0.5）。
- **结构模型**：潜变量间的路径系数与显著性。
- **拟合指标**：CFI/TLI ≥ 0.90（理想 ≥0.95）、RMSEA < 0.08（理想 <0.06）、SRMR < 0.08；卡方显著不单独作为拒绝依据（大样本敏感）。
- **修正指数**：只在理论允许时加路径/相关；禁止数据驱动乱改。
- **样本量**：经验规则每个自由参数 10–20 例；至少 200 例为宜。
- **注意**：探索性与验证性不能混用同一数据（理想：EFA 定结构 → CFA 验证；或拆分样本）。

**代码**（示例：健康素养 HL → 自我效能 SE → 依从性 AD）：

```r
library(lavaan)
set.seed(2026)
n <- 300
HL <- rnorm(n); SE <- 0.6 * HL + rnorm(n, 0, sqrt(1 - 0.36)); AD <- 0.5 * SE + rnorm(n, 0, sqrt(1 - 0.25))
d <- data.frame(
  x1 = 0.7 * HL + rnorm(n, 0, 0.7), x2 = 0.8 * HL + rnorm(n, 0, 0.6), x3 = 0.75 * HL + rnorm(n, 0, 0.65),
  y1 = 0.7 * SE + rnorm(n, 0, 0.7), y2 = 0.8 * SE + rnorm(n, 0, 0.6), y3 = 0.75 * SE + rnorm(n, 0, 0.65),
  z1 = 0.7 * AD + rnorm(n, 0, 0.7), z2 = 0.8 * AD + rnorm(n, 0, 0.6), z3 = 0.75 * AD + rnorm(n, 0, 0.65))

model <- '
  HL =~ x1 + x2 + x3
  SE =~ y1 + y2 + y3
  AD =~ z1 + z2 + z3
  SE ~ HL
  AD ~ SE
'
fit <- sem(model, data = d)
summary(fit, standardized = TRUE, fit.measures = TRUE)
fitMeasures(fit, c("chisq", "df", "cfi", "tli", "rmsea", "srmr"))
```

```stata
* Stata：等价写法（数据需先导入）
sem (HL -> x1 x2 x3) (SE -> y1 y2 y3) (AD -> z1 z2 z3) ///
    (SE <- HL) (AD <- SE), method(mlmv) standardized
estat gof, stats(all)
```

---

### 专题 3：多层 / 多重嵌套 SEM（Multilevel SEM）

**方法**：

- **适用**：数据嵌套（患者—科室—医院、居民—社区），观测不独立。
- **先验检验**：计算 ICC（组内相关），ICC 明显大于 0（如 >0.05）才需要多层。
- **分解**：组内（within，个体层面）与组间（between，机构层面）关系分别估计；组间结论不能套到个体。
- **样本量经验**：组数至少 30–50（组数是多层的关键），每组个体可少（如 10–20）。
- **随机设定**：随机截距最常见；随机斜率需理论与似然比检验支持。

**代码**：

```r
library(lavaan)
set.seed(2026)
H <- 30; m <- 20; n <- H * m
d <- data.frame(hospital = rep(1:H, each = m))
d$ueff <- rnorm(H, 0, 0.5)[d$hospital]          # 医院随机效应
d$HL <- 0.4 * d$ueff + rnorm(n)
d$SE <- 0.5 * d$HL + 0.3 * d$ueff + rnorm(n)
d$x1 <- 0.7 * d$HL + rnorm(n, 0, 0.7); d$x2 <- 0.8 * d$HL + rnorm(n, 0, 0.6); d$x3 <- 0.75 * d$HL + rnorm(n, 0, 0.65)
d$y1 <- 0.7 * d$SE + rnorm(n, 0, 0.7); d$y2 <- 0.8 * d$SE + rnorm(n, 0, 0.6); d$y3 <- 0.75 * d$SE + rnorm(n, 0, 0.65)

model2 <- '
  level: 1
    HLw =~ x1 + x2 + x3
    SEw =~ y1 + y2 + y3
    SEw ~ HLw
  level: 2
    HLb =~ x1 + x2 + x3
    SEb =~ y1 + y2 + y3
    SEb ~ HLb
'
fit2 <- sem(model2, data = d, cluster = "hospital")
summary(fit2)
```

```stata
* Stata：gsem 多层（医院随机截距）；语法细节以 help gsem 为准
gsem (HL -> x1 x2 x3) (SE -> y1 y2 y3) (SE <- HL M1[hospital]), vce(cluster hospital)
estat icc
```

---

### 专题 4：fsQCA 模糊集定性比较分析

**方法**：

- **思想**：组态视角——同一结果可由**多条路径**（条件组合）达成；非对称因果（有 A 导致 Y，不意味无 A 导致无 Y）。与回归互补：回归问净效应，fsQCA 问组合。
- **校准**：直接法三锚点（完全隶属 = 0.95、交叉点 = 0.5、完全不隶属 = 0.05），锚点要有理论与样本分布依据；常用样本 5%/50%/95% 分位或量表既定标准。
- **必要性**：单一条件一致性 ≥ 0.9 视为必要条件；覆盖率高说明必要但不足以充分。
- **充分性**：真值表（频率阈值与一致性阈值，通常 0.75–0.8）→ 布尔最小化得到复杂解/简约解/中间解；报告中间解（结合理论方向性假设），一致性与原始/唯一覆盖率。
- **样本**：中小样本（10–50 例）组态研究；条件数 4–6 个为宜（条件多则组合爆炸）。
- **稳健性**：锚点微调、一致性阈值 ±0.05、增删案例，看组态是否稳定。

**代码**：

```r
library(QCA)
set.seed(2026)
n <- 30
d <- data.frame(
  score = rnorm(n, 70, 15),          # 成效评分
  res   = rnorm(n, 20, 8),           # 资源投入
  staff = rnorm(n, 10, 4),           # 人员配置
  inc   = rnorm(n, 0.5, 0.2),        # 激励机制
  it    = rnorm(n, 3, 1.2))          # 信息化
d <- data.frame(
  成效   = calibrate(d$score, c(60, 75, 90)),
  资源   = calibrate(d$res, c(10, 20, 30)),
  人员   = calibrate(d$staff, c(5, 10, 15)),
  激励   = calibrate(d$inc, c(0.2, 0.5, 0.8)),
  信息化 = calibrate(d$it, c(1, 3, 5)))

tt <- truthTable(d, outcome = "成效", n.cut = 1, incl.cut = 0.8)
tt
sol <- minimize(tt, include = "?")   # 中间解
sol
XYplot(tt$tt$资源, d$成效, xlab = "资源", ylab = "成效")   # 必要条件散点（对单一条件判断必要性）
```

```stata
* Stata：SSC 的 fuzzy 包做模糊集校准与操作（以 help fuzzy 为准）
ssc install fuzzy
fzcalc zy, low(60) cross(75) high(90)
```

---

## 常见错误清单

- [ ] 扎根理论：只贴词频不做理论建构；小样本宣称饱和；混淆描述与理论；不写反思性
- [ ] SEM：把探索性结果当验证性报告；只看卡方显著性；无理论依据按修正指数乱加路径；载荷不达标仍强解
- [ ] 多层 SEM：组数很少却做多层；把组间系数套到个体；忽略聚类稳健标准误；不做 ICC 先验
- [ ] fsQCA：校准锚点拍脑袋不给理由；把组态解当净效应；条件数与样本量失衡；只报覆盖率不报一致性；不报告反事实分析
- [ ] 通用：代码与数据不可复现；把 R/Stata 输出原样贴进论文而不做文字解读

## 输出格式（专题报告模板）

```
【研究问题与方法选择】
为什么用这个方法（数据形态 + 研究问题的匹配说明）。

【数据与变量】
样本来源、嵌套结构（多层）、校准锚点（fsQCA）、访谈资料（扎根）。

【结果】
专题 2/3：模型图、标准化载荷与路径系数表、拟合指标表（判断标准并列）。
专题 1：编码表 + 理论模型图 + 饱和度说明。
专题 4：真值表 + 组态解表（一致性/覆盖率）+ 必要性检验。

【讨论与局限】
结合理论的解释；方法局限（如截面数据因果弱、锚点敏感性）。
```

## 使用提示

- 四个专题与 `socialmedicineskills.md` 速查手册的 G 类条目互相链接；理论框架部分（Andersen、TPB 等）见手册 F 类。
- R 包与 Stata 命令随版本更新，运行前核对帮助文档；lavaan 多层模型参数较多时留意收敛警告。
- 本 Skill 提供方法与代码模板；理论建构、编码与最终结论由研究者负责。

---

## 引用 / Citation

中文：杜思娴. 定性方法与结构方程专题教程：扎根理论 / SEM / 多层SEM / fsQCA Skill [EB/OL]. (2026). https://naturedu.github.io/socialmedicine/.

English: Du, S. (2026). *Qualitative methods and structural equation modeling: Grounded theory, SEM, multilevel SEM, and fsQCA* [Skill definition]. https://naturedu.github.io/socialmedicine/.
