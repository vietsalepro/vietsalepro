from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:3000'
EMAIL = 'suacauba@gmail.com'
PASSWORD = 'Phatnt0506!'
OUT_DIR = r'C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\test-results\phase-10-4b'

VIEWPORTS = [
    ('desktop', 1920, 1080),
    ('tablet', 768, 1024),
    ('mobile', 375, 667),
]

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

def test_responsive(page, width, height, label):
    page.set_viewport_size({'width': width, 'height': height})

    # Inventory count list
    page.goto(f'{BASE_URL}/inventory-count')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)
    screenshot(page, f'responsive-inventory-count-list-{label}.png')

    # Inventory count form
    btn = page.locator('button:has-text("Tạo phiếu kiểm kê"):visible').first
    print(f'{label}: visible inventory count create buttons =', page.locator('button:has-text("Tạo phiếu kiểm kê"):visible').count())
    btn.click()
    page.wait_for_timeout(1200)
    screenshot(page, f'responsive-inventory-count-form-{label}.png')

    # Supplier exchange list
    page.goto(f'{BASE_URL}/inventory/supplier-exchanges')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)
    screenshot(page, f'responsive-supplier-exchange-list-{label}.png')

    # Supplier exchange form
    page.locator('button:has-text("Tạo phiếu"):visible').first.click()
    page.wait_for_timeout(1200)
    screenshot(page, f'responsive-supplier-exchange-form-{label}.png')

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        page.on('dialog', lambda dialog: dialog.accept())
        try:
            login(page)
            for label, width, height in VIEWPORTS:
                test_responsive(page, width, height, label)
            print('TEST 31.5-31.7 PASSED')
        except Exception as e:
            screenshot(page, 'responsive-error.png')
            print(f'TEST 31.5-31.7 FAILED: {e}')
            raise
        finally:
            browser.close()

if __name__ == '__main__':
    main()
