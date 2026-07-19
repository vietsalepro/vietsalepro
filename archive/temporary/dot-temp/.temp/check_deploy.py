import urllib.request
import re

base = 'https://vietsalepro.pages.dev'
req = urllib.request.Request(base + '/', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8')
title_match = re.search(r'<title>(.*?)</title>', html)
print('title:', title_match.group(1) if title_match else 'N/A')

js_match = re.search(r'<script[^>]+src="(/assets/index-[^"]+\.js)"', html)
if not js_match:
    print('No main JS found')
else:
    js_path = js_match.group(1)
    print('main js:', js_path)
    js_req = urllib.request.Request(base + js_path, headers={'User-Agent': 'Mozilla/5.0'})
    js_content = urllib.request.urlopen(js_req, timeout=15).read().decode('utf-8')
    print('js length:', len(js_content))
    patterns = ['Quản trị hệ thống', 'SystemAdminDashboard', 'WhiteLabelManager', 'getTenantByDomain', 'customDomain', 'admin.vietsalepro', 'Bảng điều khiển']
    for p in patterns:
        print(p, 'FOUND' if p in js_content else 'NOT FOUND')
