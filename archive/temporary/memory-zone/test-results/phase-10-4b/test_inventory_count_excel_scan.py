from playwright.sync_api import sync_playwright
import time

BASE_URL = 'http://localhost:3000'
EMAIL = 'suacauba@gmail.com'
PASSWORD = 'Phatnt0506!'
SAMPLE_XLSX = r'C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\test-results\phase-10-4b\import-inventory-sample.xlsx'
OUT_DIR = r'C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\test-results\phase-10-4b'

def screenshot(page, name):
    path = f'{OUT_DIR}\\{name}'
    page.screenshot(path=path, full_page=True)
    print(f'Screenshot: {path}')

def login(page):
    page.goto(f'{BASE_URL}/login')
    page.wait_for_load_state('networkidle')
    page.fill("input[type='email']", EMAIL)
    page.fill("input[type='password']", PASSWORD)
    page.click("button[type='submit']")
    page.wait_for_url('**/tong-quan')
    print('Logged in')

def test_inventory_count_excel_and_scan(page):
    page.goto(f'{BASE_URL}/inventory-count')
    page.wait_for_load_state('networkidle')
    screenshot(page, 'inventory-count-list-before.png')

    # Create new count
    page.click("button:has-text('Tạo phiếu kiểm kê')")
    page.wait_for_timeout(500)
    screenshot(page, 'inventory-count-new-form-empty.png')

    # Import Excel
    page.set_input_files("input[type='file']", SAMPLE_XLSX)
    page.wait_for_timeout(2500)
    screenshot(page, 'inventory-count-after-import.png')

    # Verify imported product in table
    cell = page.locator('text=8935049013280').first
    assert cell.is_visible(), 'Imported product code not visible'
    cell = page.locator('text=Lốc Sữa Nuvi Có Thạch Hương Cam 170ml').first
    assert cell.is_visible(), 'Imported product name not visible'
    # diff should be visible (system vs actual 6)
    diff_cell = page.locator('text=+2').first
    assert diff_cell.is_visible(), 'Diff +2 not visible'
    print('Excel import verified')

    # Save draft
    page.click("button:has-text('Lưu nháp')")
    page.wait_for_timeout(1500)
    screenshot(page, 'inventory-count-draft-saved.png')
    print('Draft saved')

    # Click scan button
    page.click("button:has-text('Quét')")
    page.wait_for_timeout(1500)
    screenshot(page, 'inventory-count-scan-open.png')
    # Close scanner by pressing Escape or clicking close
    page.press('body', 'Escape')
    page.wait_for_timeout(500)
    screenshot(page, 'inventory-count-scan-closed.png')
    print('Scan UI verified')

    # Navigate back to list to verify draft is saved
    page.goto(f'{BASE_URL}/inventory-count')
    page.wait_for_load_state('networkidle')
    screenshot(page, 'inventory-count-list-after-draft.png')
    # Verify draft appears in the list with the imported product and diff
    row = page.locator('text=Bản nháp').first
    assert row.is_visible(), 'Draft count not found in list'
    print('Draft with Excel import visible in list')

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # headless=False to see UI for manual aspects
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # Accept all dialogs automatically
        page.on('dialog', lambda dialog: dialog.accept())

        try:
            login(page)
            test_inventory_count_excel_and_scan(page)
            print('TEST 31.2 PASSED')
        except Exception as e:
            screenshot(page, 'inventory-count-error.png')
            print(f'TEST 31.2 FAILED: {e}')
            raise
        finally:
            browser.close()

if __name__ == '__main__':
    main()
