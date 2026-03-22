from pathlib import Path

EXCLUDE_DIRS = {"node_modules", ".git", "venv", ".venv", "dist", "build", "__pycache__"}
VALID_EXTENSIONS = {".py", ".ts", ".tsx"}

def count_lines(folder):
    total = 0
    for file in Path(folder).rglob("*"):
        if any(part in EXCLUDE_DIRS for part in file.parts):
            continue

        if file.is_file() and file.suffix in VALID_EXTENSIONS:
            try:
                with open(file, "r", encoding="utf-8", errors="ignore") as f:
                    total += sum(1 for _ in f)
            except:
                pass

    return total

frontend_lines = count_lines("frontend")
backend_lines = count_lines("backend")

total_lines_of_code = frontend_lines + backend_lines

print("Frontend lines:", frontend_lines)
print("Backend lines:", backend_lines)
print("Total lines of code:", total_lines_of_code)