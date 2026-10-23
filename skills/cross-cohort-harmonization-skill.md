---
name: cross-cohort-harmonization
description: 把CHARLS、HRS、ELSA、SHARE、KLoSA、LASI、MHAS及扩展研究按共同概念协调。
---

# 🧭 HRS家族 · 跨国协调与外部验证

核验日期：2026-10-23。把CHARLS、HRS、ELSA、SHARE、KLoSA、LASI、MHAS及扩展研究按共同概念协调。


## 🌍 先定义比较的共同目标

明确是比较各国人群水平、相同年龄结构下差异、国别内暴露关联，还是预测模型迁移。CLHLS高龄调查、NHANES健康检查与HRS家族核心队列的总体/设计不同，可作有说明的平行研究，不能因都含健康变量就当同一产品。

### 协调字典必填列

`concept / study / release / wave / original_question / original_var / universe / recall_window / unit / coding / proxy / mode / derivation / harmonized_name / comparability / unresolved / source`。

可比性分四级：直接可比、经明确转换后可比、只可概念性并列、当前不可比。Gateway统一命名降低清洗成本，但研究特有前缀/构造和题体差异仍需回查。部分产品为一人一行跨波宽表；提取成长表前查真实可用波次。

|概念|先核对什么|可接受操作|不能自动做到|
|---|---|---|---|
|ADL/IADL|任务、严重程度、是否使用辅助|同一任务/阈值交集，保留特有项|困难数相同不等于同样失能|
|抑郁|CESD/EURO-D、题数、回顾期|量表分开，验证共同项目或潜变量|统一Z分数不证明量尺一致|
|认知|词数/轮数、读看、语言/教育/代理|分域及验证的协调分数|原始总分不能直接横排为认知高低|
|步行/握力|距离、计时/速度、试次/器具|确认单位后换算并作程序敏感性|速度换算不修复选择和流程差异|
|医疗支出|个人/家庭、年/月/两年、报销前后|同口径窗口和价格年，明确PPP目标|乘12不证明每月支出稳定|
|慢病|自报、用药、体测/实验室|分别定义，与测量敏感性比较|不同检出机会不能仅用国家FE消除|

## 设计三条路线

**国别内估计后汇总**：按各自设计与权重估计同定义效应及SE，再作有解释的Meta或多层汇总；检查国家异质性和构成差异。国家少时不做大量国家层变量Meta回归。

**协调后合并个体数据**：预先确定每国等权、人口目标权重或其他标准化目标。统一年龄/年份窗口，保留研究、国家、原始ID及设计单元，构造`study:id`防跨库碰撞。不能把每个调查原权重无说明拼接后称全球代表。

**外部预测验证**：训练/插补/特征选择冻结于开发样本，按国家留出验证；报告AUC/误差、校准截距斜率、亚组和决策用途。变量可比性不足时重新定义目标或只作部分验证；不把外部重拟合称纯外部验证。

## 时间与缺失

相同wave号不代表相同年份。以实际访问日期构造年龄与暴露窗口，识别疫情及访问方式差异。跨国“缺一项”可能是没有问过、模块未放出、该人不合资格或拒答，分别记录；未问项目不能由其他国家平均数随意补齐。若用IRT/多组CFA处理量表，先检查共同锚题、DIF与测量不变性，不能用复杂模型掩盖无共同题目。

## 推荐输出

共同概念字典、波次/年份矩阵、题级可比性矩阵、年龄与样本流程、权重目标说明、国别结果森林图、留一国家/去代理/共同项目敏感性。先给每国可解释结果，再解释合并结果适用于什么人群。

```r
# 标准化层示意；不改变原始ID，不公开对应表。
stopifnot(all(c("study","id","visit_date") %in% names(d)))
d$key <- paste(d$study, d$id, sep=":")
stopifnot(!anyDuplicated(d[c("key","visit_date")]))
# study内真实设计单元与权重需单独核对，key不是PSU。
```

## 官方出处与版本边界

- [Gateway Harmonized Data](https://www.g2aging.org/harmonized-data/overview?dataset=2)：跨研究产品导航；统一变量仍有研究特定差异。
- [HRS Documentation](https://hrs.isr.umich.edu/documentation)：问卷、代码本、数据说明及跨波问题对照入口。
- [MHAS Documentation](https://www.mhasweb.org/Documentation/Home.aspx)：抽样权重、跨波合并、直接/代理/家属问卷和问题对照。
- [Harmonized CHARLS](https://charls.pku.edu.cn/sj/Harmonized_CHARLS.htm)：本机D版需与官网所用发布版对应。
