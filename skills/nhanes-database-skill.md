---
name: nhanes-database
description: 从XPT与Doc File核对到周期合并、组件权重、survey分析和死亡链接。
---

# 🧪 NHANES · 复杂抽样与健康检查实操

核验日期：2026-10-23。从XPT与Doc File核对到周期合并、组件权重、survey分析和死亡链接。


## 本机资料与研究单位

已定位`DEMO_I/BMX_I/MCQ_I/ALQ_I/DR1TOT_I/SMQ_I`及J后缀等XPT和课程脚本。这里确认的是文件存在；课程中的模型、孟德尔随机化结果和发表结论未逐个复现。先核对Doc File的周期、题体、适用年龄与样本，不能根据课程目录推断变量质量。

NHANES连续周期通常是重复横断面。`SEQN`用于同周期模块连接，不代表同一人跨周期追踪；时间趋势的单位是调查周期，不是个人年龄增长轨迹。外部死亡链接则是基线调查接随访结局，需要核对资格与适用发布版。

## 🧩 四层合并顺序

1. 每个XPT先核对SEQN是否唯一。膳食食物条目等一人多行表不能直接与人口表一对一；先决定使用每日总量、食物日或事件单位。
2. 在同周期合并DEMO、体测、问卷和实验室；保留未成功连接情况和每项资格。不要因inner join而悄悄改变样本总体。
3. 逐周期核对检测方法、单位、检出限、问卷和样本年龄。特殊码、低于检出限和真零分开；转换规则逐项锁定。
4. 再纵向堆叠周期，用`cycle + SEQN`作审计键并设正确合并权重。跨周期趋势先检查测量可比，不能仅控制cycle就修复实验室方法改变。

## 权重小抄：按组件选，按设计估计

访谈、MEC、空腹/环境化学等子样本及饮食组件的权重适用范围不同。先查每个分析字段的Doc File，选能覆盖该分析样本的相应权重，并保留分层`SDMVSTRA`与PSU`SDMVPSU`。2021—2023采血组件增加相应采血权重考虑，不能把早期MEC范例无条件套入新实验室分析。[CDC权重教程](https://wwwn.cdc.gov/nchs/nhanes/tutorials/weighting.aspx)

两个完整且可合并的常规2年周期，常见做法是在适用条件下将原2年权重除2；这不是所有年份通用公式。2017—March2020是3.2年特殊发布，不能再并入其内部2017—2018造成重复；不完整2019—March2020不得单独作全国估计。若与一个前期2年周期合并，CDC示例按2/5.2与3.2/5.2分配周期贡献。具体组件仍按相应指南核对。[特殊周期指南](https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/overviewBrief.aspx?Cycle=2017-2020)

### R：仅示范2015—2016普通MEC成人BMI

```r
library(haven)
library(survey)
dem <- read_xpt("DEMO_I.XPT")
bmx <- read_xpt("BMX_I.XPT")
stopifnot(!anyDuplicated(dem$SEQN), !anyDuplicated(bmx$SEQN))
d <- merge(dem, bmx, by="SEQN", all.x=TRUE, sort=FALSE)
stopifnot(nrow(d)==nrow(dem))
# BMI为MEC测量；此例不含实验室子样本或多周期。
z <- subset(d, !is.na(WTMEC2YR) & WTMEC2YR>0 &
               !is.na(SDMVPSU) & !is.na(SDMVSTRA))
des <- svydesign(ids=~SDMVPSU, strata=~SDMVSTRA,
                 weights=~WTMEC2YR, nest=TRUE, data=z)
adult <- subset(des, RIDAGEYR>=20)
svymean(~BMXBMI, adult, na.rm=TRUE)
confint(svymean(~BMXBMI, adult, na.rm=TRUE))
# 补报未加权人数、BMI缺失率与估计可靠性；不将缺失直接当健康。
```

### Stata：同一周期的分析层

```stata
* d 已在周期内按 SEQN 合并，字段经Doc File核对。
isid SEQN
svyset SDMVPSU [pweight=WTMEC2YR], strata(SDMVSTRA)
gen byte adult = RIDAGEYR>=20 if !missing(RIDAGEYR)
svy, subpop(adult): mean BMXBMI
* 保留完整设计再subpop，不先只保留成人破坏设计方差。
```

## 非线性、交互与死亡关联

RCS用于预定连续暴露形状，事先选择结点、参考值和合理范围；使用支持设计的拟合/方差方法，报告整体和非线性检验、置信带及尾部人数，不追逐阈值。分层显著与不显著不等于两组有交互；检验交互项并报告尺度。

死亡链接先核对可链接资格、随访起点/截止、时间单位、事件编码及调查权重。公共LMF有部分随访时间或死因保护性替换；不能把它当完整临床病程。普通NHANES横断面生物标志物关联不证明因果；外部GWAS的MR还需独立核对人群、工具变量和假设，不能由NHANES回归“验证”全部MR条件。

## 最小报告清单

列周期与组件文件、合并排除、分析资格、设计变量、权重及跨周期公式、检测方法与单位、缺失/检出限、未加权N及加权区间、亚组有效样本/PSU支持、模型和敏感性。代码是数据接口，未在R/Stata执行；本次没有替课程或示例结果背书。

## 官方出处与版本边界

- [NHANES FAQ](https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/faq.aspx)：逐文件Doc File与可用变量入口。
- [NHANES Demographics Variable List](https://wwwn.cdc.gov/Nchs/Nhanes/Search/variablelist.aspx?Component=Demographics)：SEQN、SDMVSTRA、SDMVPSU和权重的逐周期核对。
- [NHANES Sample Design](https://wwwn.cdc.gov/nchs/nhanes/tutorials/SampleDesign.aspx)：复杂抽样设计与方差估计。
- [NHANES Weighting](https://wwwn.cdc.gov/nchs/nhanes/tutorials/weighting.aspx)：按分析组件选择权重及合并周期。
- [NHANES 2017—March 2020 Guidance](https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/overviewBrief.aspx?Cycle=2017-2020)：疫情前特殊周期；不能拆出不完整2019—2020进行总体估计。
- [NHANES August 2021—August 2023 Guidance](https://wwwn.cdc.gov/nchs/nhanes/continuousnhanes/OverviewBrief.aspx?Cycle=2021-2023)：设计变化、非应答和采血权重。
- [NCHS Using Linked Data](https://www.cdc.gov/nchs/linked-data/about-access/index.html)：公共死亡链接和受限链接；部分随访/死因值为保护隐私替代。
