"""Read public GitHub release counts; no end-user telemetry. Python 3.10+."""
import argparse
import copy
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


def integer(value, field):
    if type(value) is not int or value < 0:
        raise ValueError(f"Invalid or missing {field}")
    return value


def github_get(path):
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "skill-download-stats",
               "X-GitHub-Api-Version": "2026-03-10"}
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if token:
        headers["Authorization"] = "Bearer " + token
    request = Request("https://api.github.com" + path, headers=headers)
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def paginated(path, get=github_get):
    page = 1
    while True:
        rows = get(path + "?" + urlencode({"per_page": 100, "page": page}))
        if not isinstance(rows, list):
            raise ValueError("Expected a GitHub list response")
        yield from rows
        if len(rows) < 100:
            return
        page += 1


def fetch_assets(repo, names, get=github_get):
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
        raise ValueError("Expected owner/repository")
    found = []
    for release in paginated(f"/repos/{repo}/releases", get):
        if release.get("draft") or release.get("prerelease"):
            continue
        release_id = integer(release.get("id"), "release id")
        if not release.get("published_at") or not release.get("tag_name"):
            raise ValueError("Missing release metadata")
        for asset in paginated(f"/repos/{repo}/releases/{release_id}/assets", get):
            if asset.get("name") not in names:
                continue
            if asset.get("state") != "uploaded":
                raise ValueError("Selected release asset is not fully uploaded")
            url = asset.get("browser_download_url", "")
            if not url.startswith(f"https://github.com/{repo}/releases/download/"):
                raise ValueError("Unexpected download URL")
            found.append({"id": integer(asset.get("id"), "asset id"), "name": asset["name"],
                          "tag": release["tag_name"], "releaseId": release_id,
                          "publishedAt": release["published_at"], "url": url,
                          "downloadCount": integer(asset.get("download_count"), "download_count")})
    if len({a["id"] for a in found}) != len(found):
        raise ValueError("Duplicate asset id; retry the snapshot")
    return found


def merge_snapshot(previous, current, repo, names, now):
    """Pure merge. Preserve absent assets, reject regressions, upsert UTC day."""
    if previous is not None:
        if previous.get("schemaVersion") != 1 or previous.get("repository") != repo:
            raise ValueError("Existing record has a different schema/repository")
        if sorted(previous.get("assetNames", [])) != sorted(names):
            raise ValueError("Asset scope changed; start a separate record")
        if now < previous.get("updatedAt", ""):
            raise ValueError("Snapshot time moved backwards")
    record = copy.deepcopy(previous) if previous else {
        "schemaVersion": 1, "repository": repo, "assetNames": sorted(names),
        "startedAt": now, "metric": "github_release_asset_download_count",
        "scope": "Release附件下载次数；非独立人数、成功安装或调用。排除源码ZIP、Raw、clone和镜像。",
        "timezone": "UTC", "assets": [], "daily": []}
    old = {a["id"]: a for a in record["assets"]}
    for asset in old.values():
        asset["available"] = False
    for asset in current:
        before = old.get(asset["id"])
        if before and asset["downloadCount"] < integer(before.get("downloadCount"), "saved count"):
            raise ValueError("GitHub counter regressed; retaining prior snapshot")
        old[asset["id"]] = {**asset, "available": True,
                            "firstSeenAt": before["firstSeenAt"] if before else now, "lastSeenAt": now}
    record["assets"] = sorted(old.values(), key=lambda a: a["id"])
    record["updatedAt"] = now
    record["observedTotal"] = sum(integer(a.get("downloadCount"), "saved count") for a in old.values())
    record["availableTotal"] = sum(a["downloadCount"] for a in old.values() if a["available"])
    record["byPackage"] = {name: sum(a["downloadCount"] for a in old.values() if a["name"] == name)
                           for name in sorted(names)}
    day = now[:10]
    prior_days = [d for d in record["daily"] if d["day"] < day]
    # This is a change since the prior recorded day, not a claimed full calendar-day count.
    delta = record["observedTotal"] - prior_days[-1]["observedTotal"] if prior_days else None
    record["daily"] = prior_days + [{"day": day, "recordedAt": now,
        "observedTotal": record["observedTotal"], "availableTotal": record["availableTotal"],
        "increaseSincePreviousRecord": delta, "packages": record["byPackage"].copy()}]
    return record


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", required=True)
    parser.add_argument("--asset", action="append", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        previous = json.loads(args.output.read_text(encoding="utf-8")) if args.output.exists() else None
        assets = fetch_assets(args.repo, set(args.asset))
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        result = merge_snapshot(previous, assets, args.repo, sorted(set(args.asset)), now)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.output.with_name(args.output.name + ".tmp")
        temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(args.output)
        print(f"Recorded {len(assets)} current assets; observed total {result['observedTotal']}")
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, OSError) as exc:
        # Do not print headers, tokens or remote response bodies.
        print(f"Collection failed ({type(exc).__name__}); existing snapshot unchanged.", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
