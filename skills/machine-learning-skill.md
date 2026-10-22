# Skill：机器学习助手（卫生经济与社会医学预测建模，Stata / R）

**版本** 1.0 · **作者** 杜思娴 (Du Sixian) · **许可** MIT · **更新** 2026-10-23

## 用途

一份可复用的「机器学习预测建模」工作流：面向社会医学与卫生经济学研究者，覆盖从预测目标定义、模拟数据生成、训练—验证—测试拆分、缺失值处理与标准化，到 LASSO / 弹性网、随机森林、XGBoost 的建模，AUC / 校准 / RMSE 评估与 DeLong 比较，SHAP 解释，直至 TRIPOD 报告与部署落地的全流程。典型场景：**住院费用预测、30 天再入院风险、慢病并发症风险、医保基金支出预测**。**每一步都给出「方法 + 代码」**，可直接作为提示词喂给大语言模型，也可作为操作手册照做。

**定位边界（预测 ≠ 因果）**：本 Skill 服务**预测建模与风险分层**（prediction / risk stratification），不服务因果推断。模型回答「谁的风险更高、费用预计多少」，不回答「干预某个因素是否会改变结局」。变量重要性与 SHAP 值描述的是**预测贡献**，不代表因果效应；如需因果结论，应使用目标试验、工具变量、双重差分等设计并在混杂控制下另行估计。

## 适用范围（明确边界）

允许：
- 帮助研究者完成预测建模全流程（二分类 / 多分类 / 连续回归）的设计、训练、评估与报告
- 给出数据拆分、缺失值处理、标准化、LASSO / 弹性网（R `glmnet`、Stata `lasso` / `elasticnet`）、随机森林（`ranger`、`rforest`）、XGBoost（`xgboost`）的方法与代码
- 用 AUC（95% CI）、Brier 分数、校准曲线、RMSE / MAE 评估模型，用 DeLong 检验或 bootstrap CI 比较模型
- 用变量重要性与 SHAP（`shapviz`）解释模型，按 TRIPOD 核心条目撰写报告并给出部署清单

**不允许：**
- 把预测模型当作因果模型使用（SHAP、重要性、回归系数均非因果效应）
- 承诺模型可直接用于临床或医保决策（须经外部验证、前瞻性研究、伦理与监管审批）
- 替研究者做结局定义、预测变量取舍与风险阈值的最终专业判断（需临床 / 医保专家确认）
- 替代统计学与机器学习教科书、TRIPOD 声明全文与期刊审稿要求

## 软件准备

方法：Stata 17 及以上（内置 `lasso`、`elasticnet`、`boosting`；`svmachines` 需 Stata 18），随机森林命令 `rforest` 来自 SSC（作者 Schonlau & Zou）；R ≥ 4.2，核心包 `glmnet`、`ranger`、`xgboost`、`pROC`、`shapviz`、`caret`、`rms`、`mice`、`Matrix`、`DALEX`。

```stata
* Stata（联网安装一次）
ssc install rforest, replace
```

```r
# R
install.packages(c("glmnet", "ranger", "xgboost", "pROC", "shapviz",
                   "caret", "rms", "mice", "Matrix", "DALEX"))
```

## 工作流程总览（6 步）

1. 问题定义与数据准备（生成模拟数据、拆分 70/15/15、缺失处理、标准化）→ 2. 基线模型与变量筛选（logistic / 线性回归、LASSO、弹性网与 λ 路径）→ 3. 树模型与集成（随机森林、XGBoost 与调参）→ 4. 模型评估与比较（AUC、校准、Brier、RMSE / MAE、DeLong）→ 5. 可解释性（变量重要性、SHAP）→ 6. 报告与落地（TRIPOD 对照、防泄漏清单、外部验证）。以下每一步均为「方法 + 代码」。

---

### 第 1 步：问题定义与数据准备

**方法**：

- **预测目标**：先定分类还是回归。高费用 yes/no、30 天再入院、并发症发生为**分类**（评估指标 AUC + 校准）；住院费用、医保基金支出、住院天数为**回归**（评估指标 RMSE / MAE / R²，右偏结局建议取对数）。
- **时点规则（防泄漏的第一道关）**：结局必须定义在明确时点（如出院后 30 天内非计划再入院）；预测变量必须在该时点**之前已可获得**。任何发生在结局之后的信息（如出院后检查、结算后诊断升级）都禁止作为特征。
- **数据拆分**：训练 70% / 验证 15% / 测试 15%（本演示 N=1000 → 700/150/150），或交叉验证（CV）。调参只碰验证集，测试集仅在最终评估时**使用一次**。
- **缺失值处理**：先判断机制（MCAR/MAR/MNAR）。演示用中位数插补；正式研究建议多重插补（MICE），且插补必须在**交叉验证折内**进行，不能先在全量数据上插补再拆分。
- **标准化**：数值变量做 z-score，均值与标准差**只用训练集计算**，再套用到验证 / 测试集（防泄漏）。树模型对单调变换不敏感，但 LASSO / 逻辑回归 / SHAP 解读需要。
- **模拟数据（贯穿全程）**：N = 1000 名住院患者；特征 age（年龄）、sex（1=女）、comorb（合并症计数）、los（住院天数）、insurance（医保类型：城职/城居/新农合）与 5 个纯噪声变量 z1–z5（用于演示变量筛选应将其剔除）；结局 highcost（高费用 yes/no，约 25% 阳性）与 cost（总费用，右偏）。真实信号只藏在 age、comorb、los、insurance、sex 中。

**代码**：

```r
# ---- R：生成模拟数据（N = 1000，可全程复现）----
set.seed(2026)
n <- 1000
dat <- data.frame(
  id        = 1:n,
  age       = round(rnorm(n, 65, 12)),        # 年龄
  sex       = rbinom(n, 1, 0.52),             # 1 = 女
  comorb    = rpois(n, 1.5),                  # 合并症计数
  insurance = sample(c("城职", "城居", "新农合"), n, replace = TRUE,
                     prob = c(0.4, 0.3, 0.3)),
  los       = rpois(n, 7) + 1                 # 住院天数
)
dat$age    <- pmin(pmax(dat$age, 18), 95)
dat$comorb <- pmin(dat$comorb, 8)
for (k in 1:5) dat[[paste0("z", k)]] <- rnorm(n)   # 纯噪声特征

# 结局：同一套真实信号驱动两个结局（分类 + 连续）
lp <- -5 + 0.03 * dat$age + 0.45 * dat$comorb + 0.12 * dat$los +
      0.40 * (dat$insurance == "城职") + 0.25 * dat$sex
dat$highcost <- rbinom(n, 1, plogis(lp))      # 高费用 yes/no（约 25%）
dat$cost <- exp(7.5 + 0.01 * dat$age + 0.18 * dat$comorb + 0.05 * dat$los +
                0.25 * (dat$insurance == "城职") + 0.9 * dat$highcost +
                rnorm(n, 0, 0.5))             # 总费用（元，右偏）
table(dat$highcost); summary(dat)

# ---- 人为制造 10% MCAR 缺失（演示缺失处理用）----
set.seed(2)
dat$comorb[sample(n, 100)] <- NA

# ---- 70 / 15 / 15 拆分 ----
set.seed(3)
dat$split <- sample(rep(1:3, c(700, 150, 150)))   # 1=训练 2=验证 3=测试
tr <- dat[dat$split == 1, ]; va <- dat[dat$split == 2, ]; te <- dat[dat$split == 3, ]

# ---- 缺失值处理：用训练集中位数插补三组（演示；正式研究用 MICE 且在 CV 折内）----
m_med <- median(tr$comorb, na.rm = TRUE)
tr$comorb <- ifelse(is.na(tr$comorb), m_med, tr$comorb)
va$comorb <- ifelse(is.na(va$comorb), m_med, va$comorb)
te$comorb <- ifelse(is.na(te$comorb), m_med, te$comorb)

# 多重插补示例（正式研究用；注意应在 CV 折内进行）
# library(mice)
# imp <- mice(dat[, c("age","sex","comorb","los","highcost","cost")], m = 5, seed = 4)
# fit <- with(imp, glm(highcost ~ age + sex + comorb + los, family = binomial))
# pool(fit)

# ---- 标准化：只在训练集上计算均值 / SD，再套用到三组 ----
for (v in c("age", "comorb", "los")) {
  m <- mean(tr[[v]]); s <- sd(tr[[v]])
  tr[[paste0(v, "_s")]] <- (tr[[v]] - m) / s
  va[[paste0(v, "_s")]] <- (va[[v]] - m) / s
  te[[paste0(v, "_s")]] <- (te[[v]] - m) / s
}
```

```stata
* ---- Stata：生成同一套模拟数据 ----
clear
set seed 2026
set obs 1000
gen id = _n
gen age = round(rnormal(65, 12))
replace age = min(max(age, 18), 95)
gen sex = rbinomial(1, 0.52)
gen comorb = min(rpoisson(1.5), 8)
gen u = runiform()
gen ins = cond(u < 0.4, 1, cond(u < 0.7, 2, 3))   // 1=城职 2=城居 3=新农合
label define inslab 1 "城职" 2 "城居" 3 "新农合"
label values ins inslab
gen los = rpoisson(7) + 1
forvalues k = 1/5 {
    gen z`k' = rnormal()                         // 纯噪声特征
}
gen lp = -5 + 0.03*age + 0.45*comorb + 0.12*los + 0.40*(ins == 1) + 0.25*sex
gen highcost = rbinomial(1, invlogit(lp))
gen cost = exp(7.5 + 0.01*age + 0.18*comorb + 0.05*los + 0.25*(ins == 1) + 0.9*highcost + rnormal(0, 0.5))
gen lncost = ln(cost)
tab highcost

* ---- 人为制造 10% MCAR 缺失 ----
set seed 2026
replace comorb = . if runiform() < 0.10

* ---- 70 / 15 / 15 拆分（1=训练 2=验证 3=测试）----
splitsample, generate(svar, replace) split(0.70 0.15 0.15) rseed(3)
tab svar

* ---- 缺失值处理：训练集中位数插补（演示；正式研究用 mi impute chained）----
summarize comorb if svar == 1, detail
replace comorb = r(p50) if missing(comorb)

* 多重插补示例（正式研究用）
* mi set mlong
* mi register imputed comorb
* mi impute chained (pmm) comorb = age sex los highcost cost, add(5) rseed(4)

* ---- 标准化：以训练集均值 / SD 为基准 ----
foreach v in age comorb los {
    quietly summarize `v' if svar == 1
    gen `v'_s = (`v' - r(mean)) / r(sd)
}
```

---

### 第 2 步：基线模型与变量筛选

**方法**：

- **基线模型**：分类用 logistic 回归（报告 OR 与 95% CI），回归用线性回归（右偏费用先取对数）。基线模型是所有复杂模型的「及格线」：复杂模型若不能显著超越它，优先用简单模型。
- **LASSO（L1）与弹性网（L1+L2）**：对系数施加收缩，自动把无用变量（如噪声 z1–z5）压缩为 0，实现变量筛选。λ 用交叉验证选择：`lambda.min`（CV 误差最小，模型较大）与 `lambda.1se`（1 个标准误法则，模型更小更稳），正式报告建议用 `lambda.1se`。弹性网 `alpha=0.5` 在高相关变量场景更稳。
- **自适应 LASSO**：先普通 LASSO 得到初始系数，再按其倒数加权做第二遍 LASSO，降低对无关变量的误选率。
- **逐步回归（stepwise）**只作敏感性分析，不能当因果筛选工具；不要用全量数据选变量后再拆 CV 评估（泄漏）。
- glmnet 默认对矩阵做标准化（`standardize = TRUE`），与第 1 步的手工标准化互为保险；系数解读时注意区分原始尺度与标准化尺度。

**代码**：

```r
# ---- 模型矩阵（glmnet 不接受因子，需 model.matrix；含噪声变量观察收缩效果）----
library(glmnet)
xvars <- c("age_s", "sex", "comorb_s", "los_s", "z1", "z2", "z3", "z4", "z5", "insurance")
f <- as.formula(paste("~", paste(xvars, collapse = " + ")))
x_tr <- model.matrix(f, data = tr)[, -1]
x_va <- model.matrix(f, data = va)[, -1]
x_te <- model.matrix(f, data = te)[, -1]
y_tr <- tr$highcost; y_te <- te$highcost

# ---- 基线 logistic（不收缩，作为及格线）----
base <- glm(highcost ~ age_s + sex + comorb_s + los_s + insurance + z1 + z2 + z3 + z4 + z5,
            data = tr, family = binomial)
summary(base)

# 备选：逐步回归（仅作敏感性分析）
# library(MASS)
# stepAIC(base, direction = "both", trace = FALSE)

# ---- 基线线性回归（连续费用，取对数）----
lm_base <- lm(log(cost) ~ age_s + sex + comorb_s + los_s + insurance, data = tr)
summary(lm_base)

# ---- LASSO（alpha = 1），10 折 CV 选 λ ----
set.seed(7)
cv_lasso <- cv.glmnet(x_tr, y_tr, family = "binomial", alpha = 1, nfolds = 10)
plot(cv_lasso)                                # CV 误差曲线（两条虚线 = lambda.min / 1se）
coef(cv_lasso, s = "lambda.min")              # 噪声变量 z1–z5 应为 0
coef(cv_lasso, s = "lambda.1se")              # 更保守（1-SE 法则，模型更小）

# ---- 弹性网（alpha = 0.5）----
set.seed(8)
cv_en <- cv.glmnet(x_tr, y_tr, family = "binomial", alpha = 0.5, nfolds = 10)
coef(cv_en, s = "lambda.1se")

# ---- λ 路径图（系数随 log(λ) 增大被收缩至 0 的轨迹）----
plot(cv_lasso$glmnet.fit, xvar = "lambda", label = TRUE)
abline(v = log(cv_lasso$lambda.1se), lty = 2)

# ---- 连续结局版：LASSO 回归（对数费用）----
set.seed(9)
cv_lasso_reg <- cv.glmnet(x_tr, log(tr$cost), alpha = 1, nfolds = 10)
coef(cv_lasso_reg, s = "lambda.1se")
```

```stata
* ---- 基线 logistic（含噪声变量，作为及格线）----
logit highcost age_s sex comorb_s los_s i.insurance z1-z5 if svar == 1
est store base

* ---- 基线线性回归（对数费用）----
regress lncost age_s sex comorb_s los_s i.insurance if svar == 1

* ---- LASSO（Stata 16+），CV 选 λ ----
lasso logit highcost age_s sex comorb_s los_s i.insurance z1-z5 if svar == 1, selection(cv) rseed(7)
cvplot                                     // CV 均方误差曲线
coefpath                                    // λ 路径（系数收缩轨迹）
lassocoef, display(coef, standardized)      // 选后系数：噪声变量应被剔除

* ---- 自适应 LASSO：先 CV 选 λ，再加自适应权重重估 ----
lasso, select(adaptive)
lassocoef, display(coef, standardized)

* ---- 弹性网（Stata 17+）----
elasticnet logit highcost age_s sex comorb_s los_s i.insurance z1-z5 if svar == 1, selection(cv) alpha(0.5) rseed(8)
lassocoef, display(coef, standardized)

* ---- 连续结局版：LASSO 回归 ----
lasso linear lncost age_s sex comorb_s los_s i.insurance z1-z5 if svar == 1, selection(cv) rseed(9)
lassocoef, display(coef, standardized)
```

---

### 第 3 步：树模型与集成

**方法**：

- **随机森林（bagging）**：Bootstrap 抽样 + 每次分裂随机抽取特征子集（分类取 mtry ≈ √p，回归取 ≈ p/3），数百棵树投票 / 取均值。能自动捕捉非线性与交互，OOB 误差可近似无偏估计泛化性能。ranger 是 C++ 实现，速度远快于 randomForest，接口一致。
- **XGBoost（boosting）**：梯度提升 + 正则化（`max_depth`、`eta`、`subsample`、`colsample_bytree`），逐步纠错前一轮的残差；配合**早停**（early stopping）防止过拟合。调参在**验证集**上进行（手动网格或 caret），测试集只用于最终评估。
- 两者都是「黑箱」，需要第 5 步的 SHAP 解释支撑临床应用；树模型对变量单调变换不敏感，但仍建议统一用第 1 步的标准化数据以便跨模型比较。

**代码**：

```r
# ---- 统一建模数据框（特征 + 结局）----
feats <- c("age_s", "sex", "comorb_s", "los_s", "insurance",
           "z1", "z2", "z3", "z4", "z5", "highcost")
tr_m <- tr[, feats]; va_m <- va[, feats]; te_m <- te[, feats]

# ---- 随机森林（ranger；分类结局须为 factor）----
library(ranger)
set.seed(11)
rf <- ranger(factor(highcost) ~ ., data = tr_m,
             num.trees = 500, mtry = 3, min.node.size = 10,
             importance = "impurity", probability = TRUE)
rf                                          # OOB 预测误差
rf$variable.importance                      # 变量重要性
p_rf_va <- predict(rf, data = va_m)$predictions[, "1"]   # 验证集概率（调参用）
p_rf_te <- predict(rf, data = te_m)$predictions[, "1"]   # 测试集概率（仅评估一次）

# ---- XGBoost：xgb.cv 单组参数 + 早停 ----
library(xgboost)
library(Matrix)
mtr <- sparse.model.matrix(highcost ~ . - 1, data = tr_m)
mva <- sparse.model.matrix(highcost ~ . - 1, data = va_m)
mte <- sparse.model.matrix(highcost ~ . - 1, data = te_m)
dtrain <- xgb.DMatrix(mtr, label = tr_m$highcost)
dval   <- xgb.DMatrix(mva, label = va_m$highcost)
dtest  <- xgb.DMatrix(mte, label = te_m$highcost)

set.seed(12)
cvx <- xgb.cv(params = list(objective = "binary:logistic", eval_metric = "auc",
                            eta = 0.05, max_depth = 3,
                            subsample = 0.8, colsample_bytree = 0.8),
              data = dtrain, nrounds = 500, nfold = 5,
              early_stopping_rounds = 20, verbose = 0)
cvx$best_iteration                                   # 最佳轮数
max(cvx$evaluation_log$test_auc_mean)                # CV AUC

# ---- XGBoost：手动小网格（验证集早停选参）----
grid <- expand.grid(eta = c(0.05, 0.1), max_depth = c(2, 3, 4))
res <- lapply(seq_len(nrow(grid)), function(i) {
  p <- list(objective = "binary:logistic", eval_metric = "auc",
            eta = grid$eta[i], max_depth = grid$max_depth[i],
            subsample = 0.8, colsample_bytree = 0.8)
  xgb.train(params = p, data = dtrain, nrounds = 500,
            watchlist = list(val = dval), early_stopping_rounds = 20, verbose = 0)
})
va_auc <- sapply(res, function(m) m$best_score)       # 各组合验证集 AUC
best_i <- which.max(va_auc)
grid[best_i, ]                                        # 最优参数
best_n <- res[[best_i]]$best_iteration                # 最优轮数

# 用最优参数 + 最优轮数在「训练+验证」上重训，测试集只评估一次
full <- xgb.DMatrix(rbind(mtr, mva), label = c(tr_m$highcost, va_m$highcost))
bst <- xgb.train(params = res[[best_i]]$params, data = full, nrounds = best_n)
p_xgb_te <- predict(bst, dtest)
xgb.importance(model = bst)                           # Gain / Cover 重要性

# ---- 等价写法：caret 网格调参（二选一）----
library(caret)
set.seed(13)
cg <- expand.grid(nrounds = 300, max_depth = c(2, 3, 4), eta = c(0.05, 0.1),
                  gamma = 0, colsample_bytree = 0.8,
                  min_child_weight = 1, subsample = 0.8)
ctrl <- trainControl(method = "cv", number = 5, classProbs = TRUE,
                     summaryFunction = twoClassSummary)
fit_caret <- train(x = tr_m[, -ncol(tr_m)], y = factor(tr_m$highcost),
                   method = "xgbTree", trControl = ctrl, tuneGrid = cg,
                   metric = "ROC")
fit_caret$bestTune
```

```stata
* ---- 随机森林（rforest，SSC；不支持因子变量写法，先造虚拟变量）----
tab ins if svar == 1, gen(ins_)
rforest highcost age_s sex comorb_s los_s ins_2 ins_3 z1-z5 if svar == 1, type(class) iterations(500) numvars(3) seed(11) vimp
* 预测概率的变量命名与后处理以 help rforest 为准；
* 调参（numvars / depth / lsize）应在验证集（svar == 2）上比较 AUC 后进行

* ---- 官方替代：梯度提升 boosting（Stata 17+）、svmachines（Stata 18）----
* boosting highcost age_s sex comorb_s los_s ins_2 ins_3 z1-z5 if svar == 1
* 语法与调参选项以 help boosting 为准
```

---

### 第 4 步：模型评估与比较

**方法**：

- **分类模型三件套**：① 区分度（discrimination）= AUC（C 统计量），报 95% CI（bootstrap）；② 校准（calibration）= 校准曲线 + 校准截距/斜率（良好时截距≈0、斜率≈1）与 Brier 分数（越小越好，同时反映区分度与校准）；③ 阈值相关指标（敏感性/特异性/Youden 指数）按用途选取，不平衡结局下不用 accuracy、改用 PR 曲线。树模型与 XGBoost 常「AUC 高但校准差」，必须报告校准。
- **回归模型**：RMSE / MAE / R² 在对数尺度上计算（本演示结局取 log），解释时注明尺度。
- **模型比较**：同一测试集上多个模型 → 相关样本，用 **DeLong 检验**（`pROC::roc.test` / Stata `roccomp`）或 bootstrap CI；比较必须只在测试集做一次，否则「测试集泄漏」。
- **防乐观偏差**：训练集表现一律不作为结论；嵌套 CV（nested CV）是「调参 + 评估」同时进行的严格做法。

**代码**：

```r
library(pROC)

# ---- 各模型在测试集的预测概率（基线 / LASSO 出自 glm 与 glmnet）----
p_base_te  <- predict(base, newdata = te, type = "response")
p_lasso_te <- drop(predict(cv_lasso, newx = x_te, s = "lambda.1se", type = "response"))
# p_rf_te、p_xgb_te 来自第 3 步

roc_base  <- roc(y_te, p_base_te)
roc_lasso <- roc(y_te, p_lasso_te)
roc_rf    <- roc(y_te, p_rf_te)
roc_xgb   <- roc(y_te, p_xgb_te)

auc(roc_base); auc(roc_lasso); auc(roc_rf); auc(roc_xgb)
ci.auc(roc_rf)                                   # bootstrap 95% CI（默认 2000 次）

# ---- 模型比较：DeLong 检验（相关样本）----
roc.test(roc_rf, roc_base, method = "delong")    # RF vs 基线 logistic
roc.test(roc_xgb, roc_rf, method = "delong")     # XGB vs RF

# ---- ROC 曲线叠加 ----
plot(roc_base, col = "grey50", lwd = 2)
plot(roc_lasso, add = TRUE, col = "steelblue", lwd = 2)
plot(roc_rf, add = TRUE, col = "firebrick", lwd = 2)
plot(roc_xgb, add = TRUE, col = "darkgreen", lwd = 2)
legend("bottomright", legend = c("logistic", "LASSO", "RF", "XGBoost"),
       col = c("grey50", "steelblue", "firebrick", "darkgreen"), lwd = 2)

# ---- 阈值（Youden）与敏感性 / 特异性 ----
coords(roc_xgb, "best", ret = c("threshold", "sensitivity", "specificity"))

# ---- 校准：Brier 分数 + 校准曲线（截距≈0、斜率≈1 为校准良好）----
brier <- function(p, y) mean((p - y)^2)
brier(p_base_te, y_te); brier(p_rf_te, y_te); brier(p_xgb_te, y_te)

library(rms)
val.prob(p_xgb_te, y_te, statloc = FALSE)        # 校准图 + Brier + 校准截距/斜率
# 校准差 → Platt scaling / isotonic regression 等再校准，或回退简单模型

# ---- 回归（对数费用）：RMSE / MAE / R² ----
p_lm_te   <- predict(lm_base, newdata = te)
p_lreg_te <- drop(predict(cv_lasso_reg, newx = x_te, s = "lambda.1se"))
y_cont <- log(te$cost)
rmse <- function(p, y) sqrt(mean((p - y)^2))
mae  <- function(p, y) mean(abs(p - y))
rmse(p_lm_te, y_cont);   mae(p_lm_te, y_cont)
rmse(p_lreg_te, y_cont); mae(p_lreg_te, y_cont)
1 - sum((p_lreg_te - y_cont)^2) / sum((y_cont - mean(y_cont))^2)   # R²
```

```stata
* ---- 各模型预测概率（基线 / LASSO 用各自 predict 产出）----
logit highcost age_s sex comorb_s los_s i.insurance z1-z5 if svar == 1
predict p_base, pr
lasso logit highcost age_s sex comorb_s los_s i.insurance z1-z5 if svar == 1, selection(cv) rseed(7)
predict p_lasso, pr
* （rforest / boosting 的预测变量按各自 postestimation 命令生成）

* ---- 单模型 ROC 与 AUC ----
roctab highcost p_base if svar == 3, graph
* logit 拟合后可用 lroc（含 AUC 与 ROC 图）

* ---- 多模型比较（DeLong 法与 Hanley–McNeil 法，只评估测试集）----
roccomp highcost p_base p_lasso p_rf p_xgb if svar == 3, graph

* ---- 校准：重拟合检验截距/斜率（应接近 0/1）+ Hosmer–Lemeshow + Brier ----
logit highcost p_xgb if svar == 3
estat gof, group(10)
gen b2 = (highcost - p_xgb)^2 if svar == 3
summarize b2                                // r(mean) 即 Brier 分数

* ---- 回归指标：RMSE / MAE（对数费用）----
gen e2 = (lncost - p_lreg)^2 if svar == 3
summarize e2
display "RMSE = " sqrt(r(mean))
gen ae = abs(lncost - p_lreg) if svar == 3
summarize ae
display "MAE = " r(mean)
```

---

### 第 5 步：可解释性

**方法**：

- **全局解释**：变量重要性排序——树模型用杂质重要性（impurity）或更稳健的置换重要性（permutation）；XGBoost 用 Gain / Cover；SHAP 用平均 |SHAP|。三者结论可能不同，报告时注明方法。
- **局部解释（SHAP）**：对**每名患者**把预测概率分解为各特征的加性贡献（基线概率 + 各特征 SHAP 值之和 = logit 预测）。蜂群图（beeswarm）看整体方向，瀑布图（waterfall）看单个患者「哪些特征把风险推高、哪些拉低」。
- **临床用法**：SHAP 支持「为什么这个患者被标为高风险」的个体化解释，用于病例管理与沟通；但 SHAP ≠ 因果——「住院天数 SHAP 最大」不意味着「缩短住院天数即可降费用」。
- 变量重要性 / SHAP 都依赖模型本身；模型换了、相关性结构变了，解释也会变，报告时注明模型与数据集。

**代码**：

```r
library(shapviz)

# ---- SHAP 值（XGBoost，测试集）----
sv <- shapviz(bst, X_pred = mte)
sv_importance(sv, kind = "both")                 # 平均|SHAP|条形图 + 蜂群图
sv_importance(sv, kind = "beeswarm")             # 蜂群图：颜色 = 特征取值方向
sv_dependence(sv, v = "age_s")                   # 依赖图：年龄的非线性贡献

# ---- 单个患者瀑布图 ----
i_hi <- which.max(p_xgb_te)                      # 测试集中预测风险最高者
sv_waterfall(sv, row_id = i_hi)

# ---- 随机森林置换重要性（比杂质重要性更稳健）----
set.seed(14)
rf_p <- ranger(factor(highcost) ~ ., data = te_m, num.trees = 500,
               importance = "permutation", probability = TRUE)
rf_p$variable.importance

# ---- 备选：DALEX（模型无关解释）----
# library(DALEX)
# ex <- explain(bst, data = as.data.frame(as.matrix(mte)), y = te_m$highcost)
# plot(model_parts(ex))                        # 置换重要性
```

**临床解读示例**（模拟数据，仅示意）：测试集中某患者 78 岁、合并症 3 项、住院 15 天、城职医保、女性，XGBoost 预测高费用概率 0.62。其瀑布图显示：`los_s` 贡献 +0.15（最大推高因素）、`comorb_s` +0.09、`age_s` +0.04、`insurance城职` +0.02，被 `sex` −0.01 与噪声特征 ≈ 0 部分抵消。临床表述：「该患者风险主要来自长住院天数与多合并症，建议纳入病例管理（出院规划、康复转介）」。注意这只是**预测解释**；若想主张「干预住院天数可降低费用」，需因果设计另行论证。

```stata
* ---- Stata 侧可解释性 ----
* rforest 变量重要性：vimp 选项生成的 _rf_v_* 变量（见 help rforest）
* lasso / elasticnet 的标准化系数即一种可解释性输出
lassocoef, display(coef, standardized)
* 局限：Stata 官方目前无 SHAP 实现；完整的 SHAP 分析建议在 R（shapviz）侧完成
```

---

### 第 6 步：报告与落地

**方法**：按 TRIPOD（Transparent Reporting of a multivariable prediction model for Individual Prognosis Or Diagnosis）核心条目自查；做一遍防过拟合 / 数据泄漏终检；在论文限制部分写明「预测 ≠ 因果」；部署前必须完成外部验证。

#### 6.1 TRIPOD 核心条目对照表

| TRIPOD 条目 | 要点 | 本流程对应做法 |
| --- | --- | --- |
| 1 标题与摘要 | 标题注明「预测模型的开发 / 验证」 | 写「预测模型」，不写「危险因素研究」 |
| 3a–4a 数据来源与参与者 | 队列 / 医院 / 医保数据库、纳排标准、机构与时间 | 真实研究需完整描述；本 Skill 为模拟数据仅作教学 |
| 5a–5b 结局与预测因子 | 定义、测量方法、评估时点 | 如「30 天再入院 = 出院后 30 天内非计划再入院」 |
| 6a 结局定义 | 明确的观察时间窗 | 高费用 = 出院结算总额 ≥ 样本上四分位数 |
| 8 样本量 | 事件数、EPV（每变量事件数） | logistic 经验 EPV ≥ 10；样本小时优先正则化模型 |
| 9 缺失数据 | 缺失比例、机制假设、处理方法 | 中位数演示；正式用 MICE 且在 CV 折内 |
| 10a–10d 模型构建与收缩 | 变量筛选、调参、内部验证 | CV-LASSO、验证集早停、70/15/15 拆分 |
| 11 模型表现 | 区分度 + 校准，报 CI | AUC（95% CI）、Brier、校准截距/斜率 |
| 12 模型使用方式 | 评分 / 列线图 / 公式，如何算个体风险 | SHAP 瀑布图 + 完整公式或代码 |
| 15a–15b 个体预测示例 | 至少展示一个具体个体的预测 | 第 5 步临床解读示例 |
| 16 局限 | 内部验证 vs 外部验证的差距 | 明确声明未经外部验证时的适用范围 |
| 19 模型比较 | 与现有简单模型比较 | DeLong：RF / XGB vs logistic |
| 22 更新与推广 | 模型维护与再校准计划 | 校准漂移定期重估（见 6.4） |

#### 6.2 防过拟合 / 数据泄漏终检清单

- [ ] 标准化、插补、特征筛选全部在训练集上拟合，再套用到验证 / 测试
- [ ] 调参只用验证集；测试集只在最终评估时使用一次
- [ ] 插补与变量筛选在交叉验证折内进行（或嵌套 CV）
- [ ] 没有使用结局发生之后才可获得的信息作为特征
- [ ] λ、早停轮数等由数据自动选择，而非人工挑「好看的」
- [ ] 复杂模型与 logistic 基线并列报告，并说明增量价值
- [ ] 未用训练集表现代替泛化表现

#### 6.3 预测 ≠ 因果声明（写入论文限制部分）

> 本模型旨在**预测**（住院费用 / 再入院风险），不解释因果机制。变量重要性与 SHAP 值反映预测贡献，不代表干预该变量即可改变结局；如需因果推断，应采用目标试验、工具变量、双重差分等设计并在混杂控制下另行估计。

#### 6.4 部署提示（外部验证必要性）

- **外部验证**：至少在**不同时间、不同机构或不同地区**的独立数据上验证一次，报告 AUC / 校准的下降幅度；仅内部验证（含 CV）不能支持临床 / 医保推广。
- **前瞻性验证**：在目标使用场景下做前瞻队列验证，确认数据完整性与可用时点。
- **校准漂移监控**：上线后定期用新数据重估 Brier / 校准斜率，设定触发再校准的阈值。
- **合规**：医保与临床数据须脱敏；临床决策支持类应用需伦理审查与相应软件 / 器械监管程序；建议随模型发布「模型卡片」（人群、时点、性能、限制）。

---

## 常见错误清单

- [ ] 数据泄漏：在全量数据上标准化 / 插补 / 选特征，再拆分或 CV → 表现虚高
- [ ] 在测试集上反复调参再报结果 → 测试集泄漏
- [ ] 只在训练集上评估模型，把训练表现当结论
- [ ] 只用准确率（accuracy）评价不平衡结局 → 应报 AUC + 校准 + PR 曲线
- [ ] 只看 AUC 不看校准：树 / 提升模型常 AUC 高但校准差 → 报 Brier 与校准图
- [ ] 不平衡结局随意下采样 / 过采样后不校正预测概率
- [ ] 把变量重要性 / SHAP / 系数当作因果效应
- [ ] 结局与预测变量时点错位（用了结局之后的信息）
- [ ] 整行删除缺失值导致选择偏倚；插补未纳入结局变量（应纳入以减少偏倚，且在 CV 折内）
- [ ] 连续费用直接建模不处理右偏与极端值 → 取对数或考虑 Tweedie / 分位数回归
- [ ] 小样本（事件数少）上复杂模型不做正则化与内部验证
- [ ] Stata：`rforest` / `boosting` 直接写 `i.` 因子变量报错 → 先 `tab` 造虚拟变量
- [ ] 报告 SHAP / 重要性却不注明所用模型、数据集与方法（impurity / permutation / SHAP 结论可不同）

## 输出格式（预测建模报告模板）

```
【问题与数据】
预测目标（分类/回归）、结局定义与观察时点、数据来源与样本量、拆分方案（70/15/15 或 CV）、
缺失比例与处理方法、标准化说明。

【模型构建】
表 1：基线 logistic / 线性回归（OR 或系数 + 95% CI）；
表 2：LASSO / 弹性网（λ 选择法则、入选变量与系数）；
表 3：RF 与 XGBoost（超参数、调参方式、早停轮数）。

【模型表现】
表 4：测试集 AUC（95% CI）、Brier、校准截距/斜率（分类）或 RMSE / MAE / R²（回归）；
模型比较（DeLong p 值或 bootstrap CI）。

【解释】
变量重要性排序（注明方法）；1–2 名患者的 SHAP 瀑布图与临床解读。

【结论与落地】
TRIPOD 条目对照、防泄漏清单核对结果、局限（内部 vs 外部验证）、
部署与校准漂移监控计划、预测 ≠ 因果声明。
```

## 使用提示

- 命令与选项随版本更新：Stata 运行 `help lasso` / `help elasticnet` / `help rforest` / `help roccomp` / `help boosting`，R 运行 `?cv.glmnet` / `?ranger` / `?xgb.cv` / `?roc.test` / `?shapviz` 核对。
- 建议流程：logistic 基线 → LASSO 筛变量 → RF / XGBoost → 测试集一次性评估 + DeLong / 校准比较；复杂模型不比 logistic 显著好时，优先简单模型。
- 全程固定随机种子（`set.seed` / `set seed`）保证可复现；模拟数据只用于走通流程，真实结论须以真实数据 + 外部验证为准。
- 本 Skill 提供方法与代码模板；研究背景、结局与变量取舍、风险阈值及最终结论由研究者负责。

---

## 引用 / Citation

中文：杜思娴. 机器学习助手：卫生经济与社会医学预测建模 Skill [EB/OL]. (2026). https://naturedu.github.io/socialmedicine/.

English: Du, S. (2026). *Machine Learning Assistant: Predictive modeling for health economics and social medicine skill* [Skill definition]. https://naturedu.github.io/socialmedicine/.
