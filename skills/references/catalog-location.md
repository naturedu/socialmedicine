# 数据目录与使用

仓库根目录的 `data/` 提供 JSON 和 CSV，网页通过同源静态资源使用。安装版技能将索引放在 `assets/data/`；不要依赖维护者机器路径。

| 文件 | 内容 | 使用边界 |
|---|---|---|
| methods.json / code-library.json / tools.json | 方法、代码片段、原有工具 | 代码片段可能依赖同一手册的前文 |
| library.json | 合并题录与出处 | 有继承核验状态，不声称全部本轮重读 |
| figures.json | 图源、页码、引用、修改及权利状态 | 原图实际文件在仓库 assets/figures |
| institutions.json | 国内外机构和相关院系入口 | 部分扩展院系需官方复核，不是招生目录 |
| journals.json / user-journals.json | 合并期刊与用户指定清单 | 历史 IF、分区和时长未重新核验，不当作现行指标 |
| sources.json | 文献、健康数据、规范与项目入口 | 公开入口不等于全文或微观数据可自由使用 |
| insurance-timeline.json | 国家医保关键节点 | 不是全量政策法规库，不代替地方落地核对 |
| grants.json | 盖茨基金会公开资助快照 | 承诺金额，不是实际拨款 |
| moe-projects.json | 2025 年教育部一般项目正式立项附件 | 不是所有年份所有教育部项目 |

大表使用 JSON/CSV 按条件检索，输出总命中和可复查 ID；页面分页不改变实际纳入数量。项目下载和外部来源回访需保持来源与日期。
