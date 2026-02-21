"""
Build eco_backend_api_plan_98338452.plan.md from source fragments.

Source directory: .cursor/plans/eco_backend_api_sources/
Fragments are concatenated in numeric order (00_frontmatter.md, 01_intro_decisions.md, ...).
Output: .cursor/plans/eco_backend_api_plan_98338452.plan.md

Run from repo root:
    python cursor_scripts/build_eco_plan.py
"""
from pathlib import Path


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    sources_dir = repo_root / ".cursor" / "plans" / "eco_backend_api_sources"
    out_path = repo_root / ".cursor" / "plans" / "eco_backend_api_plan_98338452.plan.md"

    if not sources_dir.is_dir():
        raise FileNotFoundError(f"Sources directory not found: {sources_dir}")

    fragments: list[tuple[int, Path]] = []
    for p in sources_dir.iterdir():
        if p.suffix == ".md" and p.name[:2].isdigit():
            try:
                idx = int(p.name[:2])
                fragments.append((idx, p))
            except ValueError:
                continue
    fragments.sort(key=lambda x: x[0])

    parts: list[str] = []
    for _, path in fragments:
        parts.append(path.read_text(encoding="utf-8").rstrip())
    out_content = "\n\n".join(parts) + "\n"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(out_content, encoding="utf-8")
    print(f"Built: {out_path}")


if __name__ == "__main__":
    main()
