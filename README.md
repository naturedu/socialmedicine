# 普贤 (Puxian) · AI 学术检查助手

面向作者与编辑的 **AI 写作透明化工具**。让 AI 的使用「被看见」，而不是「被隐藏」。

## 功能

- **检测与润色工作台（核心）**：中 / English 一键切换。检测为 6 项指标加权打分（句长变异系数、套话密度、破折号密度、句首重复、用词多样性、冒号密度），每一项展示「你的值 / 参考区间 / 得分」，总分 100 可复核；页面附完整计分规则与已知局限说明（检测是概率性提示，不是结论）。润色做简洁化：标点规范、破折号统一、去冗余、长句提示，定位为写作质量工具，不针对任何 AI 检测器优化。
- **注册与登录（演示版）**：姓名、邮箱、验证码、机构。验证码为前端模拟，账号保存在浏览器本地；接真实后端需另配邮件服务与数据库。
- **披露声明生成器**：按工具、环节、参与程度生成中 / 英文披露声明草稿。
- **可复用 Skill**：`skills/academic-copyediting-skill.md` 是一份可移植的「学术写作规范润色」提示词定义，可喂给任何大语言模型使用；定位为写作质量工具，明确不做检测器规避。

## 本地运行

纯静态页面，无构建步骤。直接打开 `index.html`，或用任意静态服务器：

```bash
python -m http.server 8000
# 或
npx serve .
```

## 部署到 GitHub Pages

1. 推送本仓库到 GitHub。
2. 仓库 Settings → Pages → Source 选 `main` 分支、`/ (root)`，保存。
3. 稍等片刻，访问 `https://<用户名>.github.io/<仓库名>/`。

## 定位与边界

本工具 **不** 提供：去 AI 水印、规避 AI 检测、把 AI 生成内容伪装成人类原创等功能。检测器是概率判断，存在误报；可靠的做法是保留来源信息、如实披露使用情况、做好人工把关。

## 技术栈

原生 HTML / CSS / JavaScript，无依赖，无构建。

## 引用与署名 / Citation

本工具免费开源（MIT）。若在论文或报告中使用了本工具，请按以下格式引用：

中文：杜思娴. 普贤（Puxian）：AI 学术检查助手 [EB/OL]. (2026). https://naturedu.github.io/tracehonest/.

English: Du, S. (2026). *Puxian: An AI academic transparency assistant* [Web application]. https://naturedu.github.io/tracehonest/.

作者 / Author：杜思娴 (Du Sixian) · dusixian16@163.com
