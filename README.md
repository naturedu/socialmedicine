# 明迹 TraceHonest · AI 学术检查助手

面向作者与编辑的 **AI 写作透明化工具**。让 AI 的使用「被看见」，而不是「被隐藏」。

## 功能

- **注册与登录（演示版）**：姓名、邮箱、验证码、机构。验证码为前端模拟，账号保存在浏览器本地；接真实后端需另配邮件服务与数据库。
- **透明化自检**：勾选 AI 使用环节与人工参与程度，生成「该向读者 / 编辑说明什么」的报告（不是 AI 检测器）。
- **披露声明生成器**：按工具、环节、参与程度生成中 / 英文披露声明草稿。
- **编辑审阅清单**：原创性、事实数据、披露规范三组自查项，进度保存在本地。
- **中文学术排版润色助手**：全半角标点规范化、破折号统一、去冗余表达、句长检查。定位为写作质量工具，不针对任何 AI 检测器优化，不承诺「通过审查」。
- **AI 痕迹风险提示**：本地启发式特征统计（句长分布、套话密度、标点特征、句首重复），给出概率性提示而非结论，用于自我披露与编辑复核。
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

中文：杜思贤. 明迹 TraceHonest：AI 学术检查助手 [EB/OL]. (2026). https://naturedu.github.io/tracehonest/.

English: Du, S. (2026). *TraceHonest: An AI academic transparency assistant* [Web application]. https://naturedu.github.io/tracehonest/.

作者 / Author：杜思贤 (Du Sixian) · dusixian16@163.com
