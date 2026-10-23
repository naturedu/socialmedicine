---
name: network-meta-analysis
description: 为三个及以上干预的比较开展网状Meta分析，检查传递性、网络连通、多臂相关、异质性与不一致性，生成效应表和证据确定性评价。
---

# 🕸️ 网状 Meta：让没有直接交手的干预，也能谨慎比较

## 适用与边界

当问题是“健康教育、数字随访、家庭医生和常规管理，哪种更能改善血压控制？”且存在共同对照连接各干预时，可考虑 network meta-analysis（NMA）。它整合直接与间接证据；不能靠统计软件把临床上不可比的研究变得可比。只有两个干预时通常先做常规成对 Meta。见 [Cochrane 第11章](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-11)。

## 启动时先确认

收集 PICO、方案/注册信息、检索截止日期、干预节点定义、结局与时间点、每臂样本量及事件数或均数/SD。先写节点划分规则：数字管理的频率、是否含医生决策、干预持续时间不同，能否合并须有临床理由。

交付：研究筛选表、臂级数据、效应修饰因素表、网络图、联赛表、诊断结果与逐比较证据评价。缺少数据就标记缺口，不补造 SD、样本量或比较关系。

## 操作路线

1. **先画可比性地图。** 按比较组列出基线风险、年龄、疾病严重度、干预强度、背景治疗及随访时间；解释这些效应修饰因素为何足够接近。传递性是实质判断，不能用一个不显著的检验替代。
2. **保留原始试验结构。** 同一试验不同论文合并识别；多臂试验共用 `study_id`，不能把共享对照当作独立重复样本。结局方向统一，OR/RR/HR 先转到对数尺度。
3. **检查网络。** 不连通的子网络不能直接比较；节点稀疏、单一小试验支撑的比较应特别标注。检查零事件和连续性校正方案。
4. **设定模型。** 依据临床异质性、研究数量与方案选择共同效应或随机效应；明确 τ² 估计方法和共同异质性假设。不要仅凭 Q 检验决定模型。
5. **诊断来源分歧。** 检查全局不一致性与局部直接/间接分歧；无闭环或证据很少时，部分诊断不可识别或功效不足，应报告“无法充分检验”。
6. **最后才讨论排序。** 同时给相对效应、区间、绝对获益及证据确定性。P-score/SUCRA 是排序摘要，不能独立证明临床优势。

## R：可复现的玩具网络

以下数据完全为教学构造。每条是一个独立双臂试验，`TE` 为 log(OR)，事件表示不良结局；示例不含多臂研究。

```r
library(netmeta)
d <- data.frame(
  study = paste0("trial", 1:6),
  t1 = c("education","digital","family","digital","family","family"),
  t2 = c("usual","usual","usual","education","education","digital"),
  TE = log(c(.85,.72,.76,.87,.91,1.05)),
  seTE = c(.14,.16,.17,.19,.20,.18)
)
fit <- netmeta(TE, seTE, t1, t2, studlab=study, data=d,
  sm="OR", reference.group="usual", common=FALSE, random=TRUE,
  method.tau="REML", small.values="desirable")
summary(fit)
netgraph(fit)
netleague(fit)
netsplit(fit)
decomp.design(fit)
netrank(fit, small.values="good")
sessionInfo()
```

臂级真实数据应使用 `pairwise()` 等受支持的转换保留多臂协方差；不要照搬此玩具表人为拆分三臂试验。参数与诊断函数以所装版本 [netmeta 官方文档](https://search.r-project.org/CRAN/refmans/netmeta/html/netmeta.html) 为准。

Stata 项目先记录版本并核对 `help network` 或所用实现的帮助页；`network` 扩展与 Stata 内置 `meta` 不是同一套接口。无法确认命令版本时，提供数据结构与 R 路线，不杜撰可运行的 Stata 语句。

## 证据确定性与报告

按照 [PRISMA-NMA](https://www.prisma-statement.org/nma) 报告。可用 [CINeMA](https://cinema.ispm.unibe.ch/) 逐比较评价：研究内偏倚、报告偏倚、间接性、不精确性、异质性与不一致性；保留判断理由，不只填颜色。

方法段写清节点定义、效应指标、多臂处理、零事件规则、异质性模型与诊断。结果段同时解释网络薄弱位置、直接/间接证据分歧和绝对效应；若结局是血压下降而非不良事件，须重新核对“数值越大/越小越好”的方向。

## 小心这几个坑 🐾

- 把健康人、重症患者、不同随访终点接到同一网络，缺乏效应修饰因素核对。
- 拿最高排序直接写“最佳干预”，忽略区间重叠与低确定性。
- 把不一致性检验不显著写成“已证明一致”。
- 混合 RCT 与观察性研究却不说明设计差异、偏倚及分层方案。

## 可复制请求

> 请先检查我的节点定义、传递性和网络连通性，再提出 NMA 方案。按研究保留多臂相关；输出效应表、诊断、证据确定性和解释边界。若不适合合并，请给分层或叙述综合方案。
