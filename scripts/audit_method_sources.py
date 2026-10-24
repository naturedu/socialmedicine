"""Check public source links/DOI metadata; this is not full-text or code validation."""
import argparse
import concurrent.futures
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]


def check(item):
    key, source = item
    url = source["url"]
    target = "https://api.crossref.org/works/" + quote(url.split("doi.org/", 1)[1], safe="") if "doi.org/" in url else url
    try:
        with urlopen(Request(target, headers={"User-Agent": "Puxian-public-source-link-audit/1.0"}), timeout=25) as response:
            raw = response.read(350000)
            final = response.url
            if target.startswith("https://api.crossref.org/"):
                data = json.loads(raw)["message"]
                title = " / ".join(data.get("title", []))
                if not title: raise ValueError("DOI title missing")
                state, scope = "DOI登记元数据可读取", "Crossref题名与DOI；未据此声称阅读全文"
            elif raw.startswith(b"%PDF"):
                title, state, scope = source["title"], "官方PDF可访问", "链接与PDF格式；未逐页核对"
            else:
                text = raw.decode("utf-8", errors="replace")
                match = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
                title = html.unescape(re.sub(r"\s+", " ", match[1])).strip() if match else ""
                state, scope = "页面可访问", "HTTP与页面标题；不等于全文论断或代码已验证"
            return key, {"verification": state, "verificationScope": scope, "resolvedTitle": title,
                         "resolvedUrl": final, "checkedDate": datetime.now(timezone.utc).date().isoformat()}
    except Exception as exc:
        return key, {"verification": "本次连接未成功", "verificationScope": "保留来源入口，不能据此断言链接失效；正式使用需回访",
                     "checkedDate": datetime.now(timezone.utc).date().isoformat(), "checkError": type(exc).__name__}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    path = ROOT / "data/method-authorities.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for key, result in pool.map(check, data["sources"].items()):
            data["sources"][key].update(result)
            print(key, result["verification"], result.get("resolvedTitle", ""), flush=True)
    if args.write:
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")


if __name__ == "__main__": main()
