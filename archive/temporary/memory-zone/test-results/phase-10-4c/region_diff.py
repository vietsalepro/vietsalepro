from PIL import Image, ImageChops
from pathlib import Path

BASE = Path(r"C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\test-results\phase-10-4c")

PAIRS = [
    ("ImportGoods", "empty"),
    ("ImportGoods", "search-open"),
    ("ImportGoods", "data-filled"),
    ("ImportGoods", "completed"),
    ("InventoryCount", "empty"),
    ("InventoryCount", "search-open"),
    ("InventoryCount", "data-filled"),
    ("InventoryCount", "completed"),
    ("DisposalForm", "empty"),
    ("DisposalForm", "search-open"),
    ("DisposalForm", "data-filled"),
    ("DisposalForm", "completed"),
    ("SupplierExchanges", "empty"),
    ("SupplierExchanges", "search-open"),
    ("SupplierExchanges", "data-filled"),
    ("SupplierExchanges", "item-card-expanded"),
]


def diff_region(a: Image.Image, b: Image.Image, x1, y1, x2, y2):
    a_crop = a.crop((x1, y1, x2, y2))
    b_crop = b.crop((x1, y1, x2, y2))
    diff = ImageChops.difference(a_crop, b_crop)
    total = (x2 - x1) * (y2 - y1)
    diff_count = sum(1 for p in diff.getdata() if p != (0, 0, 0))
    return diff_count / total * 100 if total else 0


print(f"{'Form':<20} {'State':<20} {'Header':>8} {'Main':>8} {'Sidebar':>8} {'Bottom':>8} {'Notes'}")
print("-" * 80)
for form, state in PAIRS:
    baseline_path = BASE / form / "baseline-empty-desktop.png"
    after_path = BASE / form / f"after-{state}.png"
    if not baseline_path.exists() or not after_path.exists():
        print(f"{form:<20} {state:<20} MISSING")
        continue
    a = Image.open(baseline_path).convert("RGB").resize((1280, 900), Image.LANCZOS)
    b = Image.open(after_path).convert("RGB").resize((1280, 900), Image.LANCZOS)
    w, h = 1280, 900
    header = diff_region(a, b, 0, 0, w, 80)
    main = diff_region(a, b, 0, 80, int(w * 0.72), h - 80)
    sidebar = diff_region(a, b, int(w * 0.72), 80, w, h - 80)
    bottom = diff_region(a, b, 0, h - 80, w, h)
    notes = []
    if state == "completed" and bottom < 5:
        notes.append("actions area similar to baseline")
    print(f"{form:<20} {state:<20} {header:>7.1f}% {main:>7.1f}% {sidebar:>7.1f}% {bottom:>7.1f}%  {'; '.join(notes)}")
