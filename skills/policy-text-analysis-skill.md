---
name: policy-text-analysis
description: 对卫生政策文本开展三维框架、PMC、LDA/BERTopic、条款关系抽取和LLM辅助编码，保留出处并用人工金标准验证，连接实际实施时间与政策评价。
---

# 📝 卫生政策文本：把文件读成有出处的变量

## 先确认要测量什么

“政策写了什么”“政策如何形成与扩散”“政策实施有什么效果”是不同问题。三维框架可组织工具×对象×目标；PMC可描述预设内容的覆盖；LDA/BERTopic可辅助探索主题；监督模型或LLM可提取具体条款。工具名称不能代替理论概念与测量规则。

## 建库与编码流程

1. 定义政策范围、发文层级、文种、地域和时间窗；检索官方来源，保留标题、文号、发布日、生效日、启动服务日、失效日及URL。
2. 保存原文与版本。附件、修订版和转发文件分别标识；依据文号、文本相似度和人工复核去重，不能把地方转发当作完全独立创新。
3. 确定单位：文件、条款或句子。跨条款的例外、附表与定义不能因切分被丢失。
4. 写codebook：概念定义、纳入/排除、正反例、多标签规则、否定与条件句处理、证据定位格式。
5. 在按地区/时间/文种分层抽取的样本上双人独立编码，分歧仲裁后锁定测试集，再评价模型。按文件/政策家族划分训练测试，避免相近条款泄漏。
6. PMC指标的有无、强度或计分规则逐项给出处；主题结果要回读代表文本并检查不同主题数与随机种子。
7. 将文本变量与执行和结局数据连接时核对时间及区域口径；文书完整度不等于执行效果。

## 最低数据结构

```text
doc_id, version_id, title, document_number, issuer, region
publish_date, effective_date, service_start_date, source_url
clause_id, original_text, label_human1, label_human2, label_final
label_model, evidence_quote, page_or_clause, model_version, prompt_version
```

`evidence_quote`需尽量短，公开输出遵守原文许可。政策数据没有生效日期时保留缺失，不能自动用发布日期代替。

## R：对人工/模型标签做基本核验

```r
# 0/1教学标签；真实任务应保留无法判断、缺失及多标签规则
gold <- c(1,0,1,0,1,0,1,0)
pred <- c(1,0,0,0,1,1,1,0)
tab <- table(factor(gold,levels=0:1),factor(pred,levels=0:1))
precision <- tab[2,2]/sum(tab[,2])
recall <- tab[2,2]/sum(tab[2,])
c(precision=precision,recall=recall,F1=2*precision*recall/(precision+recall))
# 稀有标签、空分母、地区/年份分层及区间需在正式分析中单独处理。
```

三维框架和PMC的核心是可复核编码，并不要求Stata/R执行某个“自动理论验证”命令。LDA与BERTopic输出也不是经过验证的因果变量。

## LLM辅助编码的请求模板

> 仅依据所给条款及定义编码。输出doc_id、clause_id、标签、短证据定位和无法判断原因；不得补充文本未出现的预算、责任机构或生效日期。遇到例外、否定或跨条款引用时标记人工复核。按锁定codebook处理，不因先验印象推断政策质量。

记录模型、日期、提示词、温度等设置及人工修订率；模型自报“信心高”不能替代验证。更详细的人机评价见医疗AI评价Skill。可参考 [Codebook LLMs：将LLM作为测量工具评价](https://doi.org/10.1017/pan.2025.10017)，把编码定义、人工标注和独立测试作为测量验证的一部分。

## 报告与易错点 🐾

交付政策目录、codebook、逐条证据表、人工一致性、独立测试表现及错误分类。主题分析报告预处理、停用词、词典/嵌入模型及参数。不能把PMC高分写成“健康改善”，也不能把语义相似直接解释为地区间学习机制。新增指标须说明为何测到目标概念，保留不同解释的可能。
