---
name: skill-download-stats
description: 为 GitHub 发布的 Skill 安装包建立可复查的下载计数和定期快照，区分 Release 附件下载、网页点击、安装人数及调用次数。
---

# Skill 下载记录

适用于维护者统计公开 GitHub Release 附件。不会在 Skill 安装或调用时添加追踪代码。

## 先确定统计口径

- 使用 GitHub REST API 的附件 `download_count`，按附件 ID 保存。它不是独立人数、成功安装数或实际调用数。
- 网页点击、仓库 clone、GitHub 自动生成的 Source code ZIP、Raw Markdown 和镜像下载不在此统计内。
- 重复下载和维护者测试可能计入；不采集或推断 IP、设备、用户问题、私人文档或身份。
- 仅统计配置中列出的附件文件名；首次读取是基线，不能把既有总量说成当天新增。

## 读取与记录

在本技能目录执行（Python 3.10+，仅标准库）：

```sh
python scripts/collect_downloads.py --repo naturedu/socialmedicine --asset socialmedicineskills.zip --asset skill-download-stats.zip --output download-records.json
```

公共仓库可匿名读取；遇到速率限制可通过环境变量 `GH_TOKEN` 提供有读取权限的令牌，不把令牌写入文件或输出。脚本读取全部已发布、非预发布版本和分页附件，保存原始计数及日期快照。请求失败、字段缺失或计数倒退时返回失败并保留原文件，不用 0 补缺。

同一天更新覆盖当天快照，不把多次读取累加。附件消失时保留最后观测值并标注已不可见；累计为“已观测附件历史计数”，并列展示当前可见附件计数。附件新建或重传会有新 ID，不能沿用旧 ID；不要覆盖旧附件来冒充同一个计数。

## 部署到另一个仓库

先生成经过公开范围检查的 ZIP，确认解压后有 `技能名/SKILL.md` 及实际引用的支持文件。只有用户要求发布时才创建版本和上传附件；当前技能的安装不授权发布、定时任务或修改其他仓库。

用固定附件名在不同 Release 保存版本；分享 `https://github.com/OWNER/REPO/releases/latest/download/ASSET.zip`。排除草稿与预发布。发布多个不同用途的包时，各包数字分别列出，总和仅为附件下载次数。

定期记录可使用 GitHub Actions；参考本仓库 [工作流配置模板](https://github.com/naturedu/socialmedicine/blob/main/docs/skill-download-stats.workflow.yml)。在已获授权且凭据有 `workflow` 权限时，将模板保存为 `.github/workflows/skill-download-stats.yml`。配置默认每天保存一次并支持手动运行；本仓库目前只提供模板，未启用定时归档。计划任务可能延迟或停用，应展示实际更新时间；不承诺实时。GitHub 自身的累计下载计数不依赖该工作流。

## 交付与检查

交付下载入口、统计 JSON、按版本/附件的计数、首次记录和最后更新、口径说明。检查空仓库、分页、重复读取、新旧版本、附件删除/重传、API 失败和计数倒退。统计页面读取失败要显示不可用或上次快照。

依据：[GitHub Release Assets API](https://docs.github.com/en/rest/releases/assets)；[GitHub 工作流触发规则](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)。接口与执行环境需按当前文档核对。
