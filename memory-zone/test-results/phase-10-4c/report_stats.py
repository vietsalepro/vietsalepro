from PIL import Image
import os
from pathlib import Path

BASE = Path(r"C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\test-results\phase-10-4c")

for form in ["ImportGoods", "InventoryCount", "DisposalForm", "SupplierExchanges"]:
    print(f"\n=== {form} ===")
    form_dir = BASE / form
    if not form_dir.exists():
        print("  directory missing")
        continue
    files = sorted(form_dir.iterdir())
    for f in files:
        if f.suffix.lower() == ".png":
            try:
                img = Image.open(f)
                print(f"  {f.name}: {img.width}x{img.height}")
            except Exception as e:
                print(f"  {f.name}: error {e}")
