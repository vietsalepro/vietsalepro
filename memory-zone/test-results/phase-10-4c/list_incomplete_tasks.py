import re
import sys
import io
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

path = Path(r"C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\openspec\changes\voucher-form-component-system-plan-a\tasks.md")
text = path.read_text(encoding="utf-8")

sections = []
current = None
for line in text.splitlines():
    m = re.match(r"^## (\d+\. .+)", line)
    if m:
        current = {"title": m.group(1), "tasks": [], "incomplete": 0}
        sections.append(current)
    if current and line.startswith("- ["):
        done = line.startswith("- [x]")
        current["tasks"].append((done, line))
        if not done:
            current["incomplete"] += 1

print("Sections with incomplete tasks:")
for s in sections:
    if s["incomplete"] > 0:
        print(f"\n## {s['title']} — {s['incomplete']}/{len(s['tasks'])} incomplete")
        for done, task in s["tasks"]:
            if not done:
                task_clean = task.replace('->', '->').replace('→', '->')
                print(f"  {task_clean}")

print(f"\nTotal incomplete: {sum(s['incomplete'] for s in sections)}")
