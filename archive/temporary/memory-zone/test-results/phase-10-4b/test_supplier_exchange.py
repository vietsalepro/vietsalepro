from playwright.sync_api import sync_playwright
import time

BASE_URL = 'http://localhost:3000'
EMAIL = 'suacauba@gmail.com'
PASSWORD = 'Phatnt0506!'
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

def test_supplier_exchange(page):
    page.goto(f'{BASE_URL}/inventory/supplier-exchanges')
    page.wait_for_load_state('networkidle')
    screenshot(page, 'supplier-exchange-list.png')

    # Create new exchange
    page.click("button:has-text('Tạo phiếu')")
    page.wait_for_timeout(500)
    screenshot(page, 'supplier-exchange-create-empty.png')

    # Search product (main content search, not header search)
    search_input = page.locator('input[placeholder*="mã hoặc barcode"]')
    search_input.click()
    search_input.type('Ensure', delay=50)
    page.wait_for_timeout(1000)
    dropdown_count = page.locator('.voucher-product-dropdown').count()
    item_count = page.locator('.voucher-product-dropdown__item').count()
    print(f'Dropdown count: {dropdown_count}, item count: {item_count}')
    if item_count == 0:
        html = page.content()
        with open(f'{OUT_DIR}\\supplier-exchange-debug.html', 'w', encoding='utf-8') as f:
            f.write(html)
        print('Saved debug HTML')
    page.wait_for_selector('.voucher-product-dropdown__item', timeout=5000)
    page.wait_for_timeout(500)
    screenshot(page, 'supplier-exchange-product-dropdown.png')
    # Click first product in dropdown
    page.click('.voucher-product-dropdown__item:first-child')
    page.wait_for_timeout(500)
    screenshot(page, 'supplier-exchange-lot-grid.png')

    # Select lot
    page.click('text=LOT-TEST-001')
    page.wait_for_timeout(500)
    screenshot(page, 'supplier-exchange-receipt-list.png')

    # Select receipt
    page.click('.supplier-exchanges-receipt-card:first-child')
    page.wait_for_timeout(1500)
    html = page.content()
    with open(f'{OUT_DIR}\\supplier-exchange-after-receipt.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print('expanded card count:', page.locator('.supplier-exchanges-item-card.expanded').count())
    print('compact card count:', page.locator('.supplier-exchanges-item-card.compact').count())
    print('items count:', page.locator('.supplier-exchanges-item-card').count())
    screenshot(page, 'supplier-exchange-item-card-expanded.png')

    # Fill new lot details
    new_block = page.locator('.supplier-exchanges-item-card.expanded .supplier-exchanges-item-block.new')
    new_block.wait_for(timeout=5000)
    print('new block inputs:', new_block.locator('input').count())
    print('text inputs:', new_block.locator('input[type="text"]').count())
    print('placeholder inputs:', new_block.locator('input[placeholder*="số lô mới"]').count())
    new_block.locator('input[placeholder*="số lô mới"]').fill('NEW-LOT-001')
    new_block.locator('input[type="date"]').fill('2027-12-31')
    new_block.locator('input[type="number"]').nth(0).fill('1')
    new_block.locator('input[type="number"]').nth(1).fill('380000')

    # Select reason
    page.select_option('#exchange-reason', 'Hàng cận hạn')
    page.wait_for_timeout(500)
    screenshot(page, 'supplier-exchange-form-filled.png')

    # Submit
    page.click("button:has-text('Hoàn thành')")
    page.wait_for_timeout(800)
    screenshot(page, 'supplier-exchange-warning-modal.png')

    # Confirm
    page.click("button:has-text('Xác nhận hoàn thành')")
    page.wait_for_timeout(3000)

    # Verify list
    page.goto(f'{BASE_URL}/inventory/supplier-exchanges')
    page.wait_for_load_state('networkidle')
    screenshot(page, 'supplier-exchange-list-after-submit.png')
    assert page.locator('text=Hoàn thành').first.is_visible(), 'Exchange not completed'
    print('Supplier exchange completed')

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        page.on('dialog', lambda dialog: dialog.accept())
        try:
            login(page)
            test_supplier_exchange(page)
            print('TEST 31.3 / 31.4 PASSED')
        except Exception as e:
            screenshot(page, 'supplier-exchange-error.png')
            print(f'TEST 31.3 / 31.4 FAILED: {e}')
            raise
        finally:
            browser.close()

if __name__ == '__main__':
    main()
