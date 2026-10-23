# 画图与PPT工作流：来源、能力与边界

本组12份公开应用手册由杜思娴的既有科研图与PPT任务中可复用的需求重新整理，结合本机技能能力编写。只提炼方法、编辑性和验收经验，不公开聊天原文、个人文件、未发表方案、账号与本机路径。

## 能力分类

科研画图涵盖数据图、多面板、JAMA八类图、政策评估与卫生经济、机制/DAG、基金技术路线和图形摘要；PPT涵盖论文汇报、开题中期答辩、图片重建、图片型演示和教学分镜。质量检查单列，便于不同入口共用。

## 工具与公开上游

- [Matplotlib保存图形文档](https://matplotlib.org/stable/api/_as_gen/matplotlib.pyplot.savefig.html)：多格式导出、DPI与边界参数。实际格式受后端影响。
- [python-pptx官方入门](https://python-pptx.readthedocs.io/en/latest/user/quickstart.html)：创建文字、图片、形状和幻灯片。写出PPTX不等于完成渲染验收。
- [Yuan1z0825/nature-skills](https://github.com/Yuan1z0825/nature-skills)：科研图与论文转PPT能力来源入口；不在此复制其完整实现。
- [c-narcissus/paper-framework-figure-studio-pro](https://github.com/c-narcissus/paper-framework-figure-studio-pro)：论文框架图协同设计的上游入口；其当前人机交互流程由上游说明约束。
- [ningzimu/codex-ppt-skill](https://github.com/ningzimu/codex-ppt-skill)：图片型PPT生成。此处不捆绑该软件或生成配额。
- [ningzimu/image-to-editable-ppt-skill](https://github.com/ningzimu/image-to-editable-ppt-skill)：图片转对象可编辑PPT的专用工作流。此处不捆绑CLI、OCR授权或生成凭据。

公开上游为来源与可选实现入口，不表示已在所有环境安装、运行或验证。本次没有调用付费生成或OCR服务。两个官方库文档于2026-10-23读取；软件接口、期刊指南和费用在实际执行时再核对。

## 本库原创脚本

`scripts/plot_effects.py`只绘制已有估计与区间，不拟合模型；`scripts/build_editable_deck.py`从JSON生成简洁可编辑幻灯片底稿；`scripts/audit_slides.py`只做有限结构检查。它们不替代统计审查、专用重建软件或逐页视觉验收。依赖为matplotlib和python-pptx，按执行任务安装；不会自动安装或调用外部服务。

## 许可

本次原创说明与脚本沿用仓库MIT许可。被引用论文、图像、字体、第三方软件及服务适用各自许可。公开内容不包含用户原论文图、私人参考文件、上游完整技能实现或账户设置。
