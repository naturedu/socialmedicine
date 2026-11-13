# 精简研究与 Codex 维护技能

这组技能将项目通用经验写成独立、按需加载的入口。既有方法教程、数据库说明和代码仍按原路径使用；本组不复制原始聊天、私人稿件、研究数据、账户配置或本机诊断报告。

| 技能 | 用途 |
|---|---|
| [codex-performance-audit](codex-performance-audit/SKILL.md) | 区分客户端卡顿、推理延迟与指令负担；只读规模审计 |
| [privacy-safe-skill-distillation](privacy-safe-skill-distillation/SKILL.md) | 提炼通用方法、白名单隐私扫描和有范围的 GitHub 同步 |
| [research-state-handoff](research-state-handoff/SKILL.md) | 保留权威成果、证据和未完成项的接续摘要 |
| [academic-paper-orchestrator](academic-paper-orchestrator/SKILL.md) | 仅对跨阶段研究任务进行路由 |
| [paper-writing-workflow](paper-writing-workflow/SKILL.md) | 证据驱动写作、普通返修和审稿回复 |
| [academic-cover-letter](academic-cover-letter/SKILL.md) | 一页三段式学术投稿信，含院徽占位、可编辑 Word、中文原生批注与完整范例；覆盖首投、改投、返修和自然表达润色 |
| [academic-research-verification](academic-research-verification/SKILL.md) | 分开核验文献身份、读取深度和论断支持 |
| [revision-control](revision-control/SKILL.md) | 正式修订的版本、对象关系和用户确认状态 |

## 使用与兼容

按需把某个完整技能目录安装到 Codex 的技能目录，或通过可用的 skill-installer 指定本仓库及对应路径。无需全部安装；有同名技能时先比较版本并备份，保留原有脚本/素材，不能直接覆盖整个目录。入口采用标准 `SKILL.md`，无需特定模型或新增插件。

新会话可按任务自动发现，也可显式使用名称，例如 `$codex-performance-audit` 或 `$paper-writing-workflow`。本组不包含批注 UI；已有工作台应保留原本地实现和接口说明。

投稿信可使用 `$academic-cover-letter`，例如：“根据我的当前稿件与目标期刊写一页三段式英文 cover letter，说明投稿信息、科学问题与证据支持的增量、期刊读者适配；去掉空泛套话，直接给可编辑 Word 并加通用中文写作批注。”完整技能目录包含入口、界面元数据、10 份按需参考、2 份工作材料和 3 份 Word 文件（填写版、批注版、完整合成范例）；无需另装插件。默认 A4、11 pt、连续三段正文，无分块小标题；期刊规则使用时仍须复查，必要披露优先于一页偏好。

框架分三层：入口仅保留任务选择和关键约束；参考资料只在相关分支读取；脚本承接可重复的确定性检查。全局指令不复制方法手册，不为普通局部修改建立整稿工作台，也不默认增加多代理或重复确认。

## 验证与边界

Python 脚本仅用标准库。运行 `python -m unittest discover -s tests -p test_lean_skills.py` 检查隐私扫描的敏感字符串、不回显、路径越界、二进制和符号链接处理，以及规模统计。扫描清单为相对文件路径的 JSON 数组：

```sh
python skills/privacy-safe-skill-distillation/scripts/scan_release.py --root . --manifest skills/lean-release-manifest.json
python skills/codex-performance-audit/scripts/inventory.py --root skills
```

自动扫描只是辅助，不能识别全部未公开研究信息或替代许可审查。体积降低不等于实测速度提升；减少描述和条件读取遵循 [OpenAI 的技能精简建议](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)，配置应核对[当前文档](https://learn.chatgpt.com/docs/config-file/config-reference)。

代码与原创说明沿用仓库 [MIT 许可](../LICENSE)。现有第三方技能、模板、论文和数据的许可不因此改变。
