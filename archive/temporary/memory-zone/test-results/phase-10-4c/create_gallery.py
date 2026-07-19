import os
import shutil
from pathlib import Path
from PIL import Image, ImageChops

BASE = Path(r"C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7")
OUT = BASE / "test-results" / "phase-10-4c"
BASELINE_DIR = BASE / "docs" / "plans" / "voucher-form-layout-ssot"
PHASE_10_4B_DIR = BASE / "test-results" / "phase-10-4b"
PHASE_10_4C_DIR = BASE / "test-results" / "phase-10-4c"

OUT.mkdir(parents=True, exist_ok=True)

FORMS = {
    "ImportGoods": {
        "baseline": [
            ("phase7_import_desktop.png", "empty-desktop"),
            ("phase7_import_tablet.png", "empty-tablet"),
            ("phase7_import_mobile.png", "empty-mobile"),
        ],
        "after": [
            (PHASE_10_4C_DIR / "ImportGoods" / "after-empty.png", "empty"),
            (PHASE_10_4C_DIR / "ImportGoods" / "after-search-open.png", "search-open"),
            (PHASE_10_4C_DIR / "ImportGoods" / "after-data-filled.png", "data-filled"),
            (PHASE_10_4C_DIR / "ImportGoods" / "after-completed.png", "completed"),
            (PHASE_10_4C_DIR / "ImportGoods" / "after-lot-expiry-popover.png", "lot-expiry-popover"),
        ],
    },
    "InventoryCount": {
        "baseline": [
            ("phase7_inventory_desktop.png", "empty-desktop"),
            ("phase7_inventory_tablet.png", "empty-tablet"),
        ],
        "after": [
            (PHASE_10_4B_DIR / "inventory-count-new-form-empty.png", "empty"),
            (PHASE_10_4B_DIR / "inventory-count-product-dropdown.png", "search-open"),
            (PHASE_10_4B_DIR / "inventory-count-after-import.png", "data-filled"),
            (PHASE_10_4B_DIR / "inventory-count-draft-saved.png", "completed"),
            (PHASE_10_4B_DIR / "inventory-count-scan-open.png", "scan-open"),
        ],
    },
    "DisposalForm": {
        "baseline": [
            ("phase7_disposal_desktop.png", "empty-desktop"),
            ("phase7_disposal_tablet.png", "empty-tablet"),
            ("phase7_disposal_mobile.png", "empty-mobile"),
        ],
        "after": [
            (PHASE_10_4C_DIR / "DisposalForm" / "after-empty.png", "empty"),
            (PHASE_10_4C_DIR / "DisposalForm" / "after-search-open.png", "search-open"),
            (PHASE_10_4C_DIR / "DisposalForm" / "after-data-filled.png", "data-filled"),
            (PHASE_10_4C_DIR / "DisposalForm" / "after-completed.png", "completed"),
            (PHASE_10_4C_DIR / "DisposalForm" / "after-disposal-lot-selector.png", "disposal-lot-selector"),
        ],
    },
    "SupplierExchanges": {
        "baseline": [
            ("phase7_supplier_exchange_desktop.png", "empty-desktop"),
            ("phase7_supplier_exchange_tablet.png", "empty-tablet"),
            ("phase7_supplier_exchange_mobile.png", "empty-mobile"),
        ],
        "after": [
            (PHASE_10_4B_DIR / "supplier-exchange-create-empty.png", "empty"),
            (PHASE_10_4B_DIR / "supplier-exchange-product-dropdown.png", "search-open"),
            (PHASE_10_4B_DIR / "supplier-exchange-form-filled.png", "data-filled"),
            (PHASE_10_4B_DIR / "supplier-exchange-lot-grid.png", "lot-grid-open"),
            (PHASE_10_4B_DIR / "supplier-exchange-receipt-list.png", "receipt-list-open"),
            (PHASE_10_4B_DIR / "supplier-exchange-item-card-expanded.png", "item-card-expanded"),
            (PHASE_10_4B_DIR / "supplier-exchange-list-after-submit.png", "completed-list"),
        ],
    },
}

# Baseline desktop vs after state pairs for pixel diff.
COMPARE_PAIRS = [
    ("ImportGoods", "phase7_import_desktop.png", PHASE_10_4C_DIR / "ImportGoods" / "after-empty.png", "empty"),
    ("ImportGoods", "phase7_import_desktop.png", PHASE_10_4C_DIR / "ImportGoods" / "after-search-open.png", "search-open"),
    ("ImportGoods", "phase7_import_desktop.png", PHASE_10_4C_DIR / "ImportGoods" / "after-data-filled.png", "data-filled"),
    ("ImportGoods", "phase7_import_desktop.png", PHASE_10_4C_DIR / "ImportGoods" / "after-completed.png", "completed"),
    ("InventoryCount", "phase7_inventory_desktop.png", PHASE_10_4B_DIR / "inventory-count-new-form-empty.png", "empty"),
    ("InventoryCount", "phase7_inventory_desktop.png", PHASE_10_4B_DIR / "inventory-count-product-dropdown.png", "search-open"),
    ("InventoryCount", "phase7_inventory_desktop.png", PHASE_10_4B_DIR / "inventory-count-after-import.png", "data-filled"),
    ("InventoryCount", "phase7_inventory_desktop.png", PHASE_10_4B_DIR / "inventory-count-draft-saved.png", "completed"),
    ("DisposalForm", "phase7_disposal_desktop.png", PHASE_10_4C_DIR / "DisposalForm" / "after-empty.png", "empty"),
    ("DisposalForm", "phase7_disposal_desktop.png", PHASE_10_4C_DIR / "DisposalForm" / "after-search-open.png", "search-open"),
    ("DisposalForm", "phase7_disposal_desktop.png", PHASE_10_4C_DIR / "DisposalForm" / "after-data-filled.png", "data-filled"),
    ("DisposalForm", "phase7_disposal_desktop.png", PHASE_10_4C_DIR / "DisposalForm" / "after-completed.png", "completed"),
    ("SupplierExchanges", "phase7_supplier_exchange_desktop.png", PHASE_10_4B_DIR / "supplier-exchange-create-empty.png", "empty"),
    ("SupplierExchanges", "phase7_supplier_exchange_desktop.png", PHASE_10_4B_DIR / "supplier-exchange-product-dropdown.png", "search-open"),
    ("SupplierExchanges", "phase7_supplier_exchange_desktop.png", PHASE_10_4B_DIR / "supplier-exchange-form-filled.png", "data-filled"),
    ("SupplierExchanges", "phase7_supplier_exchange_desktop.png", PHASE_10_4B_DIR / "supplier-exchange-item-card-expanded.png", "item-card-expanded"),
]


def copy_image(src: Path, dst: Path):
    if src.exists():
        if src.resolve() == dst.resolve():
            return True
        shutil.copy2(src, dst)
        return True
    return False


def create_diff(path_a: Path, path_b: Path, diff_path: Path):
    a = Image.open(path_a).convert("RGB")
    b = Image.open(path_b).convert("RGB")
    # Normalize both to a common 1280x900 canvas for fair visual comparison.
    target = (1280, 900)
    a = a.resize(target, Image.LANCZOS)
    b = b.resize(target, Image.LANCZOS)
    diff = ImageChops.difference(a, b)
    diff_stat = diff.getbbox()
    diff.save(diff_path)
    pixels = list(diff.getdata())
    total = len(pixels)
    diff_count = sum(1 for p in pixels if p != (0, 0, 0))
    percent = (diff_count / total * 100) if total else 0
    return diff_stat is not None, percent, diff_count, total


def main():
    images_info = []
    diff_info = []

    for form, entries in FORMS.items():
        form_out = OUT / form
        form_out.mkdir(parents=True, exist_ok=True)
        for src_name, label in entries["baseline"]:
            src = BASELINE_DIR / src_name
            dst = form_out / f"baseline-{label}.png"
            if copy_image(src, dst):
                images_info.append((form, "baseline", label, dst.name))
        for src_path, label in entries["after"]:
            dst = form_out / f"after-{label}.png"
            if copy_image(src_path, dst):
                images_info.append((form, "after", label, dst.name))

    for form, baseline_name, after_path, state in COMPARE_PAIRS:
        baseline_path = BASELINE_DIR / baseline_name
        if not baseline_path.exists() or not after_path.exists():
            diff_info.append((form, state, "missing", None, None, None))
            continue
        diff_path = OUT / form / f"diff-{state}.png"
        has_diff, percent, diff_count, total = create_diff(baseline_path, after_path, diff_path)
        diff_info.append((form, state, "diff" if has_diff else "same", percent, diff_count, total))

    html = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Phase 10.4c — Visual Regression Final Review</title>
<style>
body { font-family: system-ui, -apple-system, sans-serif; margin: 20px; background: #f5f5f5; color: #222; }
h1 { font-size: 1.6rem; }
h2 { font-size: 1.3rem; margin-top: 2rem; border-bottom: 2px solid #ccc; padding-bottom: 0.3rem; }
h3 { font-size: 1.1rem; margin-top: 1.5rem; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; background: #fff; }
th, td { border: 1px solid #ddd; padding: 8px; text-align: left; vertical-align: top; }
th { background: #eee; }
img { max-width: 320px; border: 1px solid #999; background: #fff; }
.diff-high { color: #c00; font-weight: bold; }
.diff-low { color: #080; }
.missing { color: #888; font-style: italic; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.card { background: #fff; border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
.card h4 { margin: 0 0 8px 0; font-size: 0.95rem; }
.summary { background: #fff; border: 1px solid #ddd; padding: 16px; border-radius: 6px; }
</style>
</head>
<body>
<h1>Phase 10.4c — Visual Regression Final Review</h1>
<p>Baseline source: <code>docs/plans/voucher-form-layout-ssot/phase7_*.png</code> (Phase 7 VoucherFormLayout SSOT)</p>
<p>After source: <code>test-results/phase-10-4b/*.png</code> and <code>test-results/phase-10-4c/*.png</code> (Phase 10.4b/10.4c manual tests)</p>

<div class="summary">
<h2>Diff Summary</h2>
<table>
<tr><th>Form</th><th>State</th><th>Diff result</th><th>Diff pixels</th><th>Diff %</th></tr>
"""
    for form, state, kind, percent, diff_count, total in diff_info:
        if kind == "missing":
            html += f"<tr><td>{form}</td><td>{state}</td><td class='missing'>missing image</td><td>-</td><td>-</td></tr>"
        elif kind == "same":
            html += f"<tr><td>{form}</td><td>{state}</td><td class='diff-low'>identical</td><td>0 / {total}</td><td>0%</td></tr>"
        else:
            cls = "diff-high" if percent > 5 else "diff-low"
            html += f"<tr><td>{form}</td><td>{state}</td><td class='{cls}'>{kind}</td><td>{diff_count} / {total}</td><td>{percent:.2f}%</td></tr>"
    html += """
</table>
</div>
"""

    for form, entries in FORMS.items():
        html += f"<h2>{form}</h2>"
        html += "<div class='grid'>"
        for src_name, label in entries["baseline"]:
            dst_name = f"baseline-{label}.png"
            full_path = OUT / form / dst_name
            exists = full_path.exists()
            html += f"<div class='card'><h4>Baseline — {label}</h4>"
            if exists:
                html += f"<img src='{form}/{dst_name}' alt='{label}' loading='lazy'>"
                html += f"<p><small>{dst_name}</small></p>"
            else:
                html += f"<p class='missing'>Missing: {dst_name}</p>"
            html += "</div>"

        for src_path, label in entries["after"]:
            dst_name = f"after-{label}.png"
            full_path = OUT / form / dst_name
            exists = full_path.exists()
            html += f"<div class='card'><h4>After — {label}</h4>"
            if exists:
                html += f"<img src='{form}/{dst_name}' alt='{label}' loading='lazy'>"
                html += f"<p><small>{dst_name}</small></p>"
            else:
                html += f"<p class='missing'>Missing: {dst_name}</p>"
            html += "</div>"

        for form_cmp, state_cmp, kind, percent, diff_count, total in diff_info:
            if form_cmp == form and kind != "missing":
                diff_name = f"diff-{state_cmp}.png"
                html += f"<div class='card'><h4>Diff — {state_cmp}</h4>"
                html += f"<img src='{form}/{diff_name}' alt='diff {state_cmp}' loading='lazy'>"
                if kind == "same":
                    html += "<p class='diff-low'>identical</p>"
                else:
                    cls = "diff-high" if percent > 5 else "diff-low"
                    html += f"<p class='{cls}'>{diff_count} / {total} pixels ({percent:.2f}%)</p>"
                html += "</div>"
        html += "</div>"

    html += """
</body>
</html>
"""

    (OUT / "gallery.html").write_text(html, encoding="utf-8")
    print(f"Gallery generated: {OUT / 'gallery.html'}")
    print(f"Diff entries: {len(diff_info)}")
    print(f"Images copied: {len(images_info)}")


if __name__ == "__main__":
    main()
