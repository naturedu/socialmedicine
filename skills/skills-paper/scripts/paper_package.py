#!/usr/bin/env python3
"""Initialize a paper dossier or inventory it. Never assesses scientific readiness."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile

GROUPS = (
    "00_原始数据", "01_CoverLetter", "02_TitlePage",
    "03_Manuscript", "04_Supplementary",
)
DIRECTORIES = GROUPS + (
    "00_原始数据/raw", "00_原始数据/analysis", "00_原始数据/code",
    "00_原始数据/provenance", "03_Manuscript/figures", "_work", "_checks",
)
REPORT = "_checks/package_inventory.json"
TEMPLATES = Path(__file__).resolve().parent.parent / "assets" / "project-template"


def linked(path):
    return path.is_symlink() or (hasattr(path, "is_junction") and path.is_junction())


def checked_root(value, create=False):
    if not str(value).strip():
        raise ValueError("Project root must not be empty.")
    candidate = Path(value).expanduser().absolute()
    if any(linked(p) for p in (candidate, *candidate.parents)):
        raise ValueError("Project root must not pass through a symbolic link or junction.")
    if create:
        candidate.mkdir(parents=True, exist_ok=True)
    root = candidate.resolve(strict=True)
    if not root.is_dir():
        raise ValueError("Project root must be a directory.")
    return root


def checked_path(root, relative):
    path = root / relative
    path.resolve(strict=False).relative_to(root)
    chain = (path, *path.parents)
    for entry in chain:
        if entry == root:
            break
        if linked(entry):
            raise ValueError("Project paths must not contain symbolic links or junctions.")
    return path


def initialize(root):
    templates = sorted(p for p in TEMPLATES.rglob("*") if p.is_file())
    if not templates:
        raise ValueError("Bundled project templates are missing.")
    # Validate intended targets before writing; preserve all pre-existing files.
    for name in DIRECTORIES:
        dest = checked_path(root, name)
        if dest.exists() and not dest.is_dir():
            raise ValueError("An expected project directory is occupied by a file.")
    for src in templates:
        dest = checked_path(root, src.relative_to(TEMPLATES))
        if dest.exists() and not dest.is_file():
            raise ValueError("An expected template file is occupied by a directory.")
    for name in DIRECTORIES:
        checked_path(root, name).mkdir(parents=True, exist_ok=True)
    created, preserved = [], []
    for src in templates:
        relative = src.relative_to(TEMPLATES)
        dest = checked_path(root, relative)
        dest.parent.mkdir(parents=True, exist_ok=True)
        try:
            with dest.open("xb") as stream:
                stream.write(src.read_bytes())
            created.append(relative.as_posix())
        except FileExistsError:
            preserved.append(relative.as_posix())
    return {"action": "init", "created_templates": created,
            "preserved_templates": preserved, "readiness": "NOT_ASSESSED"}


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def walk_error(error):
    raise error


def inventory(root):
    files = []
    # Traverse only the dossier's own groups. Do not follow linked research data.
    for name in (*GROUPS, "_work", "_checks"):
        folder = checked_path(root, name)
        if not folder.exists():
            continue
        if not folder.is_dir():
            raise ValueError("An expected project directory is occupied by a file.")
        for current, dirs, names in os.walk(folder, followlinks=False, onerror=walk_error):
            for child in (*dirs, *names):
                checked_path(root, (Path(current) / child).relative_to(root))
            for filename in sorted(names):
                path = Path(current) / filename
                relative = path.relative_to(root).as_posix()
                if relative == REPORT:
                    continue
                before = path.stat()
                digest = sha256(path)
                after = path.stat()
                if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                    raise ValueError("A file changed while it was being inventoried; retry after saving.")
                files.append({"path": relative, "bytes": after.st_size, "sha256": digest})
    files.sort(key=lambda row: row["path"])
    groups = [{"directory": group, "exists": (root / group).is_dir(),
               "file_count": sum(row["path"].startswith(group + "/") for row in files)}
              for group in GROUPS]
    report = {
        "scope": "Local file inventory only; no content, provenance, privacy or scientific validation.",
        "readiness": "NOT_ASSESSED", "groups": groups, "files": files,
    }
    destination = checked_path(root, REPORT)
    destination.parent.mkdir(parents=True, exist_ok=True)
    # Replace only this script's own inventory, never source data or a manuscript.
    temp = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=destination.parent,
                                         suffix=".tmp", delete=False) as stream:
            temp = Path(stream.name)
            json.dump(report, stream, ensure_ascii=False, indent=2)
            stream.write("\n")
        os.replace(temp, destination)
    finally:
        if temp is not None and temp.exists():
            temp.unlink()
    return {"action": "inventory", "report": REPORT, "file_count": len(files),
            "groups": groups, "readiness": "NOT_ASSESSED"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("init", "inventory"))
    parser.add_argument("--root", required=True, help="Local project directory")
    args = parser.parse_args()
    try:
        root = checked_root(args.root, create=args.action == "init")
        result = initialize(root) if args.action == "init" else inventory(root)
    except (OSError, ValueError) as exc:
        parser.exit(2, f"Cannot complete {args.action}: {exc}\n")
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
