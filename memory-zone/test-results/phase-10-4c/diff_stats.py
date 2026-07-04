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

print(f"{'Form':<20} {'State':<20} {'Baseline':<12} {'After':<12} {'Diff %':<10} {'Diff pixels':<16} {'Status'}")
print("-" * 90)
for form, state in PAIRS:
    baseline_path = BASE / form / "baseline-empty-desktop.png"
    after_path = BASE / form / f"after-{state}.png"
    if not baseline_path.exists() or not after_path.exists():
        print(f"{form:<20} {state:<20} MISSING")
        continue
    a = Image.open(baseline_path).convert("RGB")
    b = Image.open(after_path).convert("RGB")
    w, h = min(a.width, b.width), min(a.height, b.height)
    a = a.crop((0, 0, w, h))
    b = b.crop((0, 0, w, h))
    diff = ImageChops.difference(a, b)
    bbox = diff.getbbox()
    total = w * h
    diff_count = sum(1 for p in diff.getdata() if p != (0, 0, 0))
    percent = diff_count / total * 100
    status = "IDENTICAL" if bbox is None else "DIFF"
    print(f"{form:<20} {state:<20} {a.width}x{a.height} {b.width}x{b.height} {percent:>8.2f}%  {diff_count:>8}/{total:<8} {status}")
