"""Publish the curated method-source mapping as a portable Skill reference."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build():
    data = json.loads((ROOT / "data/method-authorities.json").read_text(encoding="utf-8"))
    methods = json.loads((ROOT / "data/methods.json").read_text(encoding="utf-8"))
    assert set(data["methods"]) == {m["id"] for m in methods}, "Method coverage mismatch"
    lines = ["# 方法原始论文与官方来源", "", data["note"], "",
             "点击方法名称可进入代表性来源；其他来源按报告、设计或软件用途选择。来源可访问和DOI元数据核对不代表全文审读或教学代码执行。", ""]
    for method in methods:
        rows = [data["sources"][key] for key in data["methods"][method["id"]]]
        assert rows, method["id"]
        lines += [f"## {method['id']} · {method['name']}", ""]
        for row in rows:
            lines.append(f"- [{row['title']}]({row['url']}) — {row['type']}。{row['scope']}。核对：{row['checkedDate']}，{row['verification']}。")
        lines.append("")
    (ROOT / "skills/references/method-authorities.md").write_text("\n".join(lines).rstrip()+"\n", encoding="utf-8")
    print(f"Built source reference for {len(methods)} methods")


if __name__ == "__main__": build()
