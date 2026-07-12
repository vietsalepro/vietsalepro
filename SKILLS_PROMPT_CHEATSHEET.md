# 🎯 Prompt Mẫu Cho Từng Skill — Cheat Sheet

> Copy-paste các câu lệnh dưới đây để kích hoạt skill tương ứng trong Cline.

---

## 📌 Cách dùng chung

Chỉ cần nói một trong các cách sau là Cline sẽ tự động load skill:

```
Dùng [tên skill]: [yêu cầu cụ thể]
```
hoặc
```
Bật skill [tên skill], [yêu cầu]
```
hoặc
```
[Yêu cầu] — dùng skill [tên skill]
```

---

# 🧠 BUILT-IN SKILLS (Có sẵn, không cần cài)

## 1. test-driven-development (TDD)
**Mục đích**: Viết test trước, code sau, đảm bảo code luôn pass test.

**Prompt mẫu**:
```
Dùng test-driven-development: viết unit test cho function calculateInvoiceTotal trước, 
rồi implement function đó cho đến khi tất cả test pass. Chạy test ngay sau mỗi lần sửa.
```

```
Bật TDD. Tôi cần module xử lý discount. Quy trình: 
1. Viết test cases cho tất cả edge cases (discount 0%, 100%, âm, null, v.v.)
2. Implement code
3. Chạy test, nếu fail thì debugging rồi sửa
4. Lặp lại cho đến khi 100% test pass
```

---

## 2. debugging-and-error-recovery
**Mục đích**: Debug có hệ thống — phân tích root cause, đưa giả thuyết, kiểm tra từng cái.

**Prompt mẫu**:
```
Dùng debugging-and-error-recovery: 
- Lỗi: "TypeError: Cannot read properties of undefined (reading 'map')" ở component OrderList
- File: components/OrderList.tsx
- Hãy trace ngược từ dòng lỗi, tìm nguyên nhân gốc, đưa ra giả thuyết và fix
```

```
Bật skill debugging. App bị crash khi user click "Export PDF". 
Không có error log rõ ràng. Hãy:
1. Xác định tất cả possible causes
2. Thêm try-catch + log ở từng bước
3. Chạy lại và phân tích log
4. Fix lỗi
```

---

## 3. code-review-and-quality
**Mục đích**: Review code toàn diện — security, performance, maintainability, best practices.

**Prompt mẫu**:
```
Dùng code-review-and-quality: review toàn bộ file services/payment.ts
Check các vấn đề: security (SQL injection, XSS), performance (N+1 query), 
error handling, code smell, naming convention. Cho điểm từ 1-10 cho từng category.
```

```
Bật skill code-review. Audit toàn bộ folder components/orders/:
- Liệt kê top 10 vấn đề nghiêm trọng nhất
- Phân loại: bug / security / performance / maintainability
- Ưu tiên theo mức độ ảnh hưởng
- Đề xuất cách fix cụ thể cho từng vấn đề
```

---

## 4. spec-driven-development
**Mục đích**: Viết spec trước khi code, tránh hiểu sai requirement.

**Prompt mẫu**:
```
Dùng spec-driven-development: 
Tôi cần tính năng "Bulk delete orders" — cho phép admin chọn nhiều đơn hàng và xóa hàng loạt.
Hãy viết spec chi tiết gồm:
- User stories
- Acceptance criteria
- API endpoints cần thêm/sửa
- UI mockup (text-based)
- Edge cases
Tôi duyệt spec rồi mới code.
```

```
Bật spec-driven-development. Tính năng: "Forget password" flow.
Viết spec trước, tôi duyệt rồi hãy implement.
```

---

## 5. incremental-implementation
**Mục đích**: Chia nhỏ task, làm từng bước, confirm sau mỗi bước.

**Prompt mẫu**:
```
Dùng incremental-implementation: 
Tính năng: "User profile page với avatar upload"
Chia thành các bước nhỏ:
1. Tạo UI profile form (không avatar)
2. Thêm validation
3. Tích hợp API get profile
4. Thêm avatar upload component
5. Tích hợp API upload avatar
Sau mỗi bước, dừng lại hỏi tôi "OK để tiếp?" trước khi sang bước tiếp theo.
```

---

## 6. doubt-driven-development
**Mục đích**: Trước khi code, liệt kê tất cả giả định và xác nhận với user.

**Prompt mẫu**:
```
Dùng doubt-driven-development: 
Tôi cần module "Tính phí ship dựa trên khoảng cách".
Trước khi code, hãy list ra tất cả giả định bạn đang có (ví dụ: đơn vị khoảng cách, 
ngưỡng free ship, phí theo vùng, v.v.) và hỏi tôi xác nhận từng cái.
```

---

## 7. context-engineering
**Mục đích**: Tối ưu cách agent tương tác — ngắn gọn, đúng format, hiệu quả.

**Prompt mẫu**:
```
Dùng context-engineering: 
Từ giờ trở đi, hãy tuân thủ các rule sau:
1. Trả lời bằng tiếng Việt
2. Cực kỳ ngắn gọn — chỉ show code diff và kết quả
3. Không giải thích trừ khi tôi hỏi "tại sao"
4. Nếu có lỗi, show error + fix ngay, không phân tích dài dòng
5. Ưu tiên giải pháp đơn giản nhất
```

---

## 8. code-simplification
**Mục đích**: Đơn giản hoá code phức tạp, giảm technical debt.

**Prompt mẫu**:
```
Dùng code-simplification: 
Phân tích file utils/helpers.ts — nó đã phình to 500 dòng.
Tìm các cơ hội:
- Tách hàm lớn thành hàm nhỏ
- Loại bỏ code chết
- Thay thế vòng lặp phức tạp bằng built-in methods
- Gom các hàm liên quan vào module riêng
Đề xuất cụ thể trước khi sửa.
```

---

## 9. planning-and-task-breakdown
**Mục đích**: Chia task lớn thành các task nhỏ, ước lượng scope.

**Prompt mẫu**:
```
Dùng planning-and-task-breakdown: 
Mục tiêu: "Xây dựng module Subscription Management (quản lý gói đăng ký)"
Hãy:
1. Phân tích requirements
2. Chia thành các task nhỏ (mỗi task tối đa 2 giờ code)
3. Xác định dependencies giữa các task
4. Ước lượng thời gian cho mỗi task
5. Đề xuất thứ tự thực hiện tối ưu
```

---

## 10. documentation-and-adrs
**Mục đích**: Ghi lại quyết định kiến trúc, tài liệu hoá codebase.

**Prompt mẫu**:
```
Dùng documentation-and-adrs: 
1. Rà soát toàn bộ kiến trúc hiện tại
2. Viết ADR cho các quyết định quan trọng:
   - Tại sao dùng React + TypeScript?
   - Tại sao dùng Supabase?
   - Cấu trúc folder hiện tại
3. Tạo file ARCHITECTURE.md tổng quan
4. Đề xuất cải thiện nếu có
```

```
Bật skill documentation-and-adrs. 
Tạo ADR mới cho quyết định: "Chuyển từ REST sang GraphQL cho module reports".
Format: Context → Decision → Consequences → Alternatives considered.
```

---

## 11. api-and-interface-design
**Mục đích**: Thiết kế API/interface ổn định, đúng best practices.

**Prompt mẫu**:
```
Dùng api-and-interface-design: 
Thiết kế REST API cho module "Inventory Management" gồm:
- CRUD products
- Stock adjustment
- Inventory count
- Low stock alerts
Output: Swagger/OpenAPI spec, request/response types, error codes.
```

---

## 12. security-and-hardening
**Mục đích**: Hardening code — input validation, authentication, data protection.

**Prompt mẫu**:
```
Dùng security-and-hardening: 
Audit toàn bộ API endpoints trong routes/:
- Check authentication/authorization
- Check input validation
- Check rate limiting
- Check SQL injection
- Check XSS
- Check file upload security
Báo cáo chi tiết + cách fix.
```

---

## 13. performance-optimization
**Mục đích**: Tối ưu performance — load time, bundle size, Core Web Vitals.

**Prompt mẫu**:
```
Dùng performance-optimization: 
Phân tích performance của trang Dashboard:
- Check bundle size
- Check unnecessary re-renders
- Check N+1 queries
- Check lazy loading opportunities
- Check image optimization
Đề xuất top 5 cải thiện có impact lớn nhất.
```

---

## 14. observability-and-instrumentation
**Mục đích**: Thêm logging, metrics, tracing để dễ dàng debug production.

**Prompt mẫu**:
```
Dùng observability-and-instrumentation: 
Thêm logging cho module Payment:
- Log mọi transaction (amount, status, gateway response)
- Log errors với stack trace + context
- Add metrics: success rate, latency p50/p95/p99
- Add health check endpoint
Dùng structured logging (JSON format).
```

---

## 15. ci-cd-and-automation
**Mục đích**: Thiết lập CI/CD pipeline, automation.

**Prompt mẫu**:
```
Dùng ci-cd-and-automation: 
Tạo GitHub Actions workflow cho project này:
1. Chạy lint + test trên mỗi PR
2. Build và deploy lên Vercel staging khi merge vào main
3. Build và deploy production khi tạo tag/release
4. Thêm quality gates: test coverage >= 80%, không có high severity lint errors
```

---

## 16. git-workflow-and-versioning
**Mục đích**: Quản lý git workflow, commit message, branching strategy.

**Prompt mẫu**:
```
Dùng git-workflow-and-versioning: 
Thiết lập git convention cho project:
1. Commit message format: conventional commits (feat/fix/chore/docs/refactor)
2. Branch strategy: feature/ -> develop -> main
3. Tạo commit-msg hook để validate message
4. Hướng dẫn squash merge cho feature branches
```

---

## 17. deprecation-and-migration
**Mục đích**: Quản lý deprecation, migration an toàn.

**Prompt mẫu**:
```
Dùng deprecation-and-migration: 
Tôi cần migrate từ API v1 sang v2:
1. Liệt kê tất cả endpoints cần migrate
2. Tạo migration plan: dual-run → verify → cutover
3. Thêm deprecation warning headers cho v1
4. Tạo rollback plan
5. Lên lịch trình từng bước
```

---

## 18. shipping-and-launch
**Mục đích**: Pre-launch checklist, monitoring, staged rollout.

**Prompt mẫu**:
```
Dùng shipping-and-launch: 
Chuẩn bị launch tính năng "Online Payment":
1. Tạo pre-launch checklist
2. Thiết lập monitoring + alerting
3. Kế hoạch staged rollout (10% → 50% → 100%)
4. Rollback plan nếu có vấn đề
5. Communication plan cho users
```

---

# 🎨 INSTALLED SKILLS (Đã cài từ GitHub)

## 19. frontend-design
**Mục đích**: Thiết kế UI đẹp, không bị "AI slop" — typography, color, layout, motion.

**Prompt mẫu**:
```
Dùng frontend-design: 
Tạo landing page cho SaaS product "SmartInvoice" — tool quản lý hoá đơn cho SME.
Yêu cầu:
- Dark theme
- Typography độc đáo (không dùng Inter/Roboto)
- Hero section với animated gradient background
- Testimonials section dạng carousel
- Pricing section với 3 plans
- Responsive, mobile-first
```

```
Bật frontend-design. Tôi cần một dashboard admin với:
- Aesthetic: brutalist, industrial
- Màu sắc: đen trắng chủ đạo, accent màu đỏ neon
- Font: JetBrains Mono cho code, IBM Plex Serif cho content
- Có noise texture background
- Animation: staggered reveal khi load page
```

---

## 20. algorithmic-art
**Mục đích**: Tạo generative art với p5.js.

**Prompt mẫu**:
```
Dùng algorithmic-art: 
Tạo một flow field artwork với:
- Kích thước canvas 800x800
- Particle system với 500 particles
- Màu sắc chuyển từ xanh dương sang tím
- Seed-based randomness để có thể tái tạo
- Thêm GUI controls để điều chỉnh speed, size, color
```

---

## 21. canvas-design
**Mục đích**: Tạo visual art dạng PNG/PDF với design philosophy.

**Prompt mẫu**:
```
Dùng canvas-design: 
Tạo một poster A4 (PDF) với chủ đề "Year in Review 2026":
- Phong cách: editorial magazine
- Màu sắc: đen trắng + accent vàng gold
- Typography: Work Sans headings, Lora body
- Layout: asymmetric grid
- Nội dung: các KPI chính, growth chart, team photo placeholder
```

---

## 22. brand-guidelines
**Mục đích**: Áp dụng brand colors và typography của Anthropic.

**Prompt mẫu**:
```
Dùng brand-guidelines: 
Tạo một trang "About Us" sử dụng đúng brand guidelines:
- Màu sắc: primary, secondary, accent đúng brand
- Typography: heading và body font đúng spec
- Spacing: đúng scale
- Component: buttons, cards, navigation đúng style
```

---

## 23. claude-api
**Mục đích**: Reference cho Claude API — models, pricing, streaming, tool use, caching.

**Prompt mẫu**:
```
Dùng claude-api: 
Tôi cần implement Claude API với:
- Streaming response
- Tool use (function calling)
- Prompt caching
- Ngôn ngữ: TypeScript
Hãy cho tôi code mẫu hoàn chỉnh.
```

---

## 24. doc-coauthoring
**Mục đích**: Co-author tài liệu — workflow có cấu trúc.

**Prompt mẫu**:
```
Dùng doc-coauthoring: 
Tôi cần viết technical spec cho "Notification System":
1. Đầu tiên hãy phỏng vấn tôi để thu thập context
2. Viết draft spec
3. Tôi review và góp ý
4. Chỉnh sửa theo feedback
5. Cuối cùng verify spec có dễ hiểu không
```

---

## 25. docx
**Mục đích**: Tạo và chỉnh sửa Word documents (.docx).

**Prompt mẫu**:
```
Dùng docx: 
Tạo một Word document "Báo Cáo Doanh Thu Tháng 7.docx" gồm:
- Trang bìa: tên công ty, logo placeholder, ngày tháng
- Mục lục (Table of Contents)
- Section 1: Tổng quan KPI (dùng table)
- Section 2: Biểu đồ doanh thu (dùng chart)
- Section 3: Kết luận và đề xuất
- Header/Footer: tên công ty + số trang
- Format: font Lora 11pt, heading dùng Work Sans
```

---

## 26. pdf
**Mục đích**: Làm việc với PDF — đọc, merge, split, OCR, tạo mới.

**Prompt mẫu**:
```
Dùng pdf: 
1. Đọc file "invoice_template.pdf" và extract tất cả form fields
2. Fill dữ liệu vào form fields từ JSON data
3. Export ra file mới "invoice_001.pdf"
4. Kiểm tra bounding boxes có bị lệch không
```

```
Dùng pdf: Merge tất cả file PDF trong folder reports/ thành một file "annual_report.pdf", 
sắp xếp theo thứ tự tên file.
```

---

## 27. pptx
**Mục đích**: Tạo và chỉnh sửa PowerPoint presentations.

**Prompt mẫu**:
```
Dùng pptx: 
Tạo presentation "Product Launch 2026.pptx" gồm:
- Slide 1: Title slide (tên sản phẩm, ngày, logo)
- Slide 2: Problem statement
- Slide 3: Solution overview (dùng diagram)
- Slide 4: Key features (dùng icon grid)
- Slide 5: Roadmap timeline
- Slide 6: KPI targets (dùng chart)
- Slide 7: Thank you / CTA
Theme: modern minimal, màu xanh dương + trắng
```

---

## 28. xlsx
**Mục đích**: Tạo và chỉnh sửa Excel files (.xlsx, .csv).

**Prompt mẫu**:
```
Dùng xlsx: 
Tạo file "Monthly Budget.xlsx" với:
- Sheet 1 "Budget": cột Category, Planned, Actual, Variance (có formula)
- Sheet 2 "Chart": pivot table + bar chart từ Sheet 1
- Sheet 3 "Summary": tổng hợp các KPI chính
- Conditional formatting: variance âm = màu đỏ, dương = màu xanh
- Freeze panes: dòng header
```

---

## 29. mcp-builder
**Mục đích**: Tạo MCP server kết nối external APIs.

**Prompt mẫu**:
```
Dùng mcp-builder: 
Tạo MCP server bằng Python (FastMCP) cho Weather API:
- Tool 1: get_forecast(city, days) → lấy dự báo thời tiết
- Tool 2: get_current_weather(city) → lấy thời tiết hiện tại
- Resource: weather://{city}/alerts → cảnh báo thời tiết
- Dùng OpenWeatherMap API
- Có error handling, rate limiting
- Viết README.md hướng dẫn cài đặt
```

---

## 30. skill-creator
**Mục đích**: Tạo skill mới, chạy eval, benchmark, cải thiện skill.

**Prompt mẫu**:
```
Dùng skill-creator: 
Tôi muốn tạo skill mới tên "sql-optimizer" giúp tối ưu SQL queries.
Hãy:
1. Phỏng vấn tôi để hiểu rõ intent
2. Draft SKILL.md
3. Tạo test cases (eval)
4. Chạy eval với skill vs không skill
5. So sánh kết quả
6. Cải thiện skill dựa trên kết quả
7. Package thành file .skill
```

---

## 31. slack-gif-creator
**Mục đích**: Tạo animated GIFs tối ưu cho Slack.

**Prompt mẫu**:
```
Dùng slack-gif-creator: 
Tạo GIF "celebration.gif" cho Slack:
- Nội dung: confetti + text "🎉 Ship it!"
- Kích thước: 400x200 (Slack-optimized)
- Màu sắc: gradient vàng cam
- Duration: 3 giây, loop
- File size < 1MB
```

---

## 32. theme-factory
**Mục đích**: Theme styling cho artifacts — slides, docs, landing pages.

**Prompt mẫu**:
```
Dùng theme-factory: 
Tạo theme mới tên "ocean-depths" và apply vào presentation:
- Màu primary: #0A1628 (xanh đêm)
- Màu accent: #00D4FF (xanh cyan)
- Font heading: Instrument Sans
- Font body: Crimson Pro
- Background: gradient từ #0A1628 → #1A3A5C
- Có noise texture overlay
```

---

## 33. web-artifacts-builder
**Mục đích**: Tạo HTML artifacts phức tạp với React + Tailwind + shadcn/ui.

**Prompt mẫu**:
```
Dùng web-artifacts-builder: 
Tạo một dashboard artifact với:
- React + TypeScript
- Tailwind CSS
- shadcn/ui components (Table, Card, Dialog, Tabs)
- State management: React hooks
- Chart: Recharts
- Tính năng: filter, sort, search, pagination
- Responsive
```

---

## 34. webapp-testing
**Mục đích**: Test web app với Playwright — click, fill form, screenshot, log.

**Prompt mẫu**:
```
Dùng webapp-testing: 
Test flow "User đăng nhập và tạo đơn hàng mới":
1. Mở trang login
2. Nhập email + password
3. Click login
4. Chụp screenshot sau login
5. Click "Tạo đơn hàng"
6. Fill form: tên khách hàng, sản phẩm, số lượng
7. Click "Lưu"
8. Verify đơn hàng xuất hiện trong danh sách
9. Chụp screenshot kết quả
10. Export console log
```

---

## 35. internal-comms
**Mục đích**: Viết internal communications — newsletter, status report, FAQ.

**Prompt mẫu**:
```
Dùng internal-comms: 
Viết company newsletter tuần này:
- Tiêu đề: "Weekly Update — Week 28"
- Mục: Product updates, Team highlights, Upcoming events
- Tone: professional nhưng friendly
- Độ dài: 300-500 words
- Include CTA: đăng ký demo
```

---

## 36. web-design-guidelines
**Mục đích**: Review UI theo Web Interface Guidelines.

**Prompt mẫu**:
```
Dùng web-design-guidelines: 
Review trang Dashboard hiện tại:
- Check accessibility (contrast, focus states, aria labels)
- Check responsive (mobile, tablet, desktop)
- Check loading states, empty states, error states
- Check consistent spacing và typography
- Đề xuất cải thiện cụ thể
```

---

## 37. ui-ux-pro-max
**Mục đích**: UI/UX design intelligence — 50+ styles, 161 color palettes, 57 font pairings.

**Prompt mẫu**:
```
Dùng ui-ux-pro-max: 
Thiết kế lại trang Settings với style glassmorphism:
- Màu sắc: palette số 42 (pastel)
- Font: font pairing số 18
- Component: sidebar navigation, form controls, toggle switches
- Animation: smooth transitions
- Dark mode support
```

---

## 38. ui-styling
**Mục đích**: Styling với shadcn/ui + Tailwind + Radix UI.

**Prompt mẫu**:
```
Dùng ui-styling: 
Tạo component DataTable với:
- shadcn/ui Table component
- Sortable columns
- Search/filter
- Row selection (checkbox)
- Pagination
- Loading skeleton
- Empty state
- Responsive
```

---

## 39. interview-me
**Mục đích**: Phỏng vấn user từng câu một để hiểu rõ yêu cầu trước khi làm.

**Prompt mẫu**:
```
Dùng interview-me: 
Tôi cần xây dựng "Hệ thống quản lý chấm công". 
Hãy phỏng vấn tôi từng câu một để hiểu rõ:
- Ai sẽ dùng?
- Quy trình nghiệp vụ?
- Các rule đặc biệt?
- Ưu tiên gì nhất?
Chỉ khi nào bạn tự tin ~95% thì mới bắt đầu viết spec.
```

---

## 40. idea-refine
**Mục đích**: Phát triển ý tưởng từ mơ hồ → rõ ràng qua divergent/convergent thinking.

**Prompt mẫu**:
```
Dùng idea-refine: 
Tôi có ý tưởng: "App học tiếng Anh cho người đi làm".
Hãy:
1. Divergent thinking: mở rộng ra tất cả possible directions
2. Convergent thinking: thu hẹp, stress-test từng direction
3. Chọn direction tốt nhất
4. Phát triển thành concept rõ ràng
```

---

## 41. doubt-driven-development (chi tiết)
**Prompt mẫu**:
```
Dùng doubt-driven-development: 
Trước khi implement "Recommendation Engine", hãy:
1. Liệt kê tất cả assumptions bạn đang có
2. Với mỗi assumption, đánh giá độ chắc chắn (1-10)
3. Với assumption < 7, hỏi tôi xác nhận
4. Chỉ khi tất cả assumption >= 7 mới bắt đầu code
```

---

## 42. requesting-code-review
**Mục đích**: Pre-commit review — security scan, quality gates, auto-fix.

**Prompt mẫu**:
```
Dùng requesting-code-review: 
Review các file đã staged trong git:
1. Security scan: hardcoded secrets, SQL injection, XSS
2. Quality gates: lint errors, type errors, test coverage
3. Auto-fix các vấn đề có thể tự sửa
4. Báo cáo các vấn đề cần can thiệp thủ công
```

---

# 🏆 TỔNG HỢP NHANH — 10 TÌNH HUỐNG THƯỜNG GẶP

| # | Tình huống | Prompt mẫu |
|---|-----------|------------|
| 1 | **Agent code sai** | `Dùng spec-driven-development: viết spec trước, tôi duyệt rồi code` |
| 2 | **Code chạy không được** | `Bật TDD + debugging: viết test trước, code, nếu fail thì debug có hệ thống` |
| 3 | **Agent nói dài** | `Dùng context-engineering: từ giờ chỉ trả lời ngắn gọn, show code + kết quả, không giải thích` |
| 4 | **Dự án rối** | `Dùng code-review + code-simplification + documentation-and-adrs: audit, simplify, viết ADR` |
| 5 | **Không biết bắt đầu từ đâu** | `Dùng planning-and-task-breakdown: chia task lớn thành task nhỏ` |
| 6 | **Sợ thiếu context** | `Dùng interview-me: phỏng vấn tôi từng câu trước khi làm` |
| 7 | **Cần UI đẹp** | `Dùng frontend-design: tạo UI với phong cách [chọn style]` |
| 8 | **Cần tài liệu** | `Dùng docx: tạo Word document báo cáo` |
| 9 | **Cần test UI** | `Dùng webapp-testing: viết Playwright test cho flow [mô tả]` |
| 10 | **Cần MCP server** | `Dùng mcp-builder: tạo MCP server cho [API]` |

---

> **Mẹo**: Bạn có thể gộp nhiều skill trong một câu lệnh:
> ```
> Dùng TDD + debugging + code-review: 
> 1. Viết test cho module X
> 2. Implement cho test pass
> 3. Nếu fail thì debug
> 4. Cuối cùng review lại toàn bộ