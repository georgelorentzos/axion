import os
import sys

EXCLUDED_DIRS = {
    # General
    ".git", ".github", ".vscode", ".idea",
    "__pycache__", ".pytest_cache", ".mypy_cache",
    "node_modules", ".next", ".nuxt",
    "dist", "build", "out",
    ".env", "venv", "env", ".venv",
    "migrations", "alembic",
    ".tox", ".nox",
    "coverage", ".coverage",
    ".turbo", ".cache",
    "egg-info", ".eggs",
    "site-packages",
    ".parcel-cache",
    ".svelte-kit",
    "storybook-static",
    ".angular",
}

EXCLUDED_FILES = {
    ".env", ".env.local", ".env.production", ".env.development",
    ".gitignore", ".dockerignore", ".eslintignore", ".prettierignore",
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "poetry.lock", "Pipfile.lock",
    ".DS_Store", "Thumbs.db",
    "requirements.txt",
}

FRONTEND_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx",
    ".css", ".scss", ".sass", ".less",
    ".html", ".json", ".svg",
}

BACKEND_EXTENSIONS = {
    ".py", ".sql", ".toml", ".yaml", ".yml", ".cfg", ".ini",
}


def should_skip_dir(dirname: str) -> bool:
    lower = dirname.lower()
    for excluded in EXCLUDED_DIRS:
        if lower == excluded.lower():
            return True
    if lower.endswith(".egg-info"):
        return True
    return False


def should_skip_file(filename: str) -> bool:
    return filename.lower() in {f.lower() for f in EXCLUDED_FILES}


def is_binary(filepath: str) -> bool:
    try:
        with open(filepath, "rb") as f:
            chunk = f.read(1024)
            return b"\x00" in chunk
    except Exception:
        return True


def count_lines(path: str, extensions: set[str]) -> dict:
    results = {}
    total = 0

    for root, dirs, files in os.walk(path):
        dirs[:] = [d for d in dirs if not should_skip_dir(d)]

        for filename in sorted(files):
            if should_skip_file(filename):
                continue

            ext = os.path.splitext(filename)[1].lower()
            if ext not in extensions:
                continue

            filepath = os.path.join(root, filename)

            if is_binary(filepath):
                continue

            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    lines = sum(1 for _ in f)
                    relative = os.path.relpath(filepath, path)
                    results[relative] = lines
                    total += lines
            except Exception:
                continue

    return {"files": results, "total": total}


def print_results(label: str, data: dict, extensions: set[str]):
    files = data["files"]
    total = data["total"]

    ext_groups: dict[str, int] = {}
    for filepath, lines in files.items():
        ext = os.path.splitext(filepath)[1].lower()
        ext_groups[ext] = ext_groups.get(ext, 0) + lines

    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")

    if not files:
        print("  No files found.")
        return

    sorted_files = sorted(files.items(), key=lambda x: -x[1])

    print(f"\n  {'File':<45} {'Lines':>8}")
    print(f"  {'-'*45} {'-'*8}")

    for filepath, lines in sorted_files:
        name = filepath if len(filepath) <= 44 else "..." + filepath[-41:]
        print(f"  {name:<45} {lines:>8}")

    print(f"\n  {'Breakdown by extension':}")
    print(f"  {'-'*30} {'-'*8}")
    for ext, lines in sorted(ext_groups.items(), key=lambda x: -x[1]):
        print(f"  {ext:<30} {lines:>8}")

    print(f"\n  {'Total files:':<30} {len(files):>8}")
    print(f"  {'Total lines:':<30} {total:>8}")


def main():
    print("\n" + "="*60)
    print("         Lines of Code Counter")
    print("="*60)

    frontend_path = input("\n  Enter frontend path: ").strip().strip("'\"")
    if not os.path.isdir(frontend_path):
        print(f"\n  Error: '{frontend_path}' is not a valid directory.")
        sys.exit(1)

    backend_path = input("  Enter backend path:  ").strip().strip("'\"")
    if not os.path.isdir(backend_path):
        print(f"\n  Error: '{backend_path}' is not a valid directory.")
        sys.exit(1)

    print("\n  Counting...")

    frontend_data = count_lines(frontend_path, FRONTEND_EXTENSIONS)
    backend_data = count_lines(backend_path, BACKEND_EXTENSIONS)

    print_results("FRONTEND (React / TypeScript)", frontend_data, FRONTEND_EXTENSIONS)
    print_results("BACKEND (FastAPI / Python)", backend_data, BACKEND_EXTENSIONS)

    grand_total = frontend_data["total"] + backend_data["total"]
    total_files = len(frontend_data["files"]) + len(backend_data["files"])

    print(f"\n{'='*60}")
    print(f"  TOTAL")
    print(f"{'='*60}")
    print(f"  {'Frontend lines:':<30} {frontend_data['total']:>8}")
    print(f"  {'Backend lines:':<30} {backend_data['total']:>8}")
    print(f"  {'Total files:':<30} {total_files:>8}")
    print(f"  {'Total lines of code:':<30} {grand_total:>8}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()