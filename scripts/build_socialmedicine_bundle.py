"""Build installable, public text-only Skill bundles from explicit repository paths."""
import argparse
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOGUES = ["methods", "code-library", "tools", "library", "figures", "institutions", "journals",
              "sources", "insurance-timeline", "method-sources", "method-authorities", "database-skills", "database-sources", "visual-skills",
              "public-topic-records", "public-topic-analysis", "public-topic-taxonomy"]
EXTENSIONS = {".md", ".py", ".R", ".do", ".json", ".txt", ".yaml", ".yml"}


def write_bundle(path, files):
    manifest = []
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in sorted(files.items()):
            info = zipfile.ZipInfo(name, (2026, 10, 24, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            archive.writestr(info, content)
            manifest.append({"path": name, "bytes": len(content), "sha256": hashlib.sha256(content).hexdigest()})
    path.with_suffix(".manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None:
            raise ValueError("Invalid ZIP")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(output):
    output.mkdir(parents=True, exist_ok=True)
    files = {}
    for source in sorted((ROOT / "skills").rglob("*")):
        if not source.is_file() or "__pycache__" in source.parts:
            continue
        if source.suffix not in EXTENSIONS and source.name != "LICENSE":
            continue
        relative = source.relative_to(ROOT / "skills").as_posix()
        if relative.startswith(("skill-download-stats/", "nssfc-project-synthesis/", "nsfc-health-synthesis/")):
            continue  # Pack the administration skill separately.
        name = "SKILL.md" if relative == "socialmedicineskills.md" else relative
        content = source.read_text(encoding="utf-8-sig")
        if relative != "socialmedicineskills.md":
            content = content.replace("](socialmedicineskills.md)", "](SKILL.md)").replace("](../socialmedicineskills.md)", "](../SKILL.md)")
        files["socialmedicineskills/" + name] = content.encode("utf-8")
    # Public metadata only: no figures, user photographs, PDFs or full manuscripts.
    for catalogue in CATALOGUES:
        source = ROOT / "data" / (catalogue + ".json")
        if source.exists():
            files["socialmedicineskills/assets/data/" + source.name] = source.read_bytes()
    files["socialmedicineskills/LICENSE"] = (ROOT / "LICENSE").read_bytes()
    files["socialmedicineskills/THIRD_PARTY_NOTICES.md"] = (ROOT / "THIRD_PARTY_NOTICES.md").read_bytes()
    stats = {"skill-download-stats/"+p.relative_to(ROOT / "skills/skill-download-stats").as_posix(): p.read_bytes()
             for p in (ROOT / "skills/skill-download-stats").rglob("*")
             if p.is_file() and p.suffix in EXTENSIONS and "__pycache__" not in p.parts}
    stats["skill-download-stats/LICENSE"] = (ROOT / "LICENSE").read_bytes()
    sums = []
    for name, payload in [("socialmedicineskills.zip", files), ("skill-download-stats.zip", stats)]:
        digest = write_bundle(output / name, payload)
        sums.append(f"{digest}  {name}")
        print(f"Built {name}: {len(payload)} files")
    (output / "SHA256SUMS.txt").write_text("\n".join(sums)+"\n", encoding="utf-8")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "dist")
    build(parser.parse_args().output)
