# MASTER_DASHBOARD_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Dashboard, KPI Card, Widget, Report Area và Data Visualization trong hệ thống POS.

Áp dụng cho:

* Dashboard Tổng quan
* Dashboard Quản lý kho
* Dashboard Tài chính
* Dashboard Bán hàng
* Dashboard Báo cáo

Mọi Dashboard phải tuân thủ tiêu chuẩn này.

---

# I. TRIẾT LÝ THIẾT KẾ

Dashboard là màn hình ra quyết định.

Không phải màn hình trang trí.

Người dùng phải hiểu tình hình kinh doanh trong:

5 giây

---

Dashboard phải trả lời được:

Doanh thu

Lợi nhuận

Tồn kho

Công nợ

Hiệu suất bán hàng

---

# II. DASHBOARD HIERARCHY

Dashboard Page

↓

Filter Area

↓

KPI Area

↓

Report Area

↓

Widget Area

↓

Activity Area

---

# III. DASHBOARD LAYOUT

Desktop

12 Column Grid

---

Gap

24px

---

Container

width:100%

---

Padding

24px

---

Background

#F8FAFC

---

# IV. DASHBOARD HEADER

Hiển thị:

Tiêu đề

Mô tả

Bộ lọc thời gian

Quick Action

---

Layout

Left

Title

Description

---

Right

Date Filter

Action Button

---

# V. DATE FILTER STANDARD

Mặc định:

Hôm nay

---

Options

Hôm nay

7 ngày

30 ngày

Tháng này

Quý này

Năm nay

Tùy chỉnh

---

Position

Top Right

---

# VI. KPI AREA

Purpose

Hiển thị chỉ số quan trọng nhất.

---

Layout

Desktop

4 Cards / Row

---

Tablet

2 Cards / Row

---

Mobile

1 Card / Row

---

Gap

16px

---

# VII. KPI CARD STANDARD

Height

120px

---

Background

#FFFFFF

---

Border

1px solid #F1F5F9

---

Radius

20px

---

Padding

20px

---

Shadow

0 2px 8px rgba(15,23,42,0.03)

---

Structure

Label

↓

Value

↓

Trend

---

# VIII. KPI LABEL

Font

13px

---

Weight

500

---

Color

#64748B

---

Ví dụ

Doanh thu

Lợi nhuận

Đơn hàng

Khách hàng

---

# IX. KPI VALUE

Font

32px

---

Weight

700

---

Color

#0F172A

---

Không rút gọn:

1.250.000

không phải

1.2M

---

# X. KPI TREND

Hiển thị:

▲ +15%

▼ -8%

---

Font

12px

---

Success

#10B981

---

Decrease

#EF4444

---

# XI. KPI ICON

Size

48x48

---

Radius

14px

---

Position

Top Right

---

Background

#F8FAFC

---

# XII. CHART AREA

Purpose

Hiển thị xu hướng.

---

Layout

Desktop

2 Chart / Row

---

Tablet

1 Chart / Row

---

# XIII. CHART CARD STANDARD

Background

#FFFFFF

---

Border

1px solid #F1F5F9

---

Radius

24px

---

Padding

24px

---

Min Height

380px

---

# XIV. CHART TITLE

Font

18px

---

Weight

600

---

Color

#0F172A

---

# XV. CHART TYPES

Cho phép

Line Chart

Bar Chart

Area Chart

Pie Chart

Donut Chart

---

Ưu tiên

Line

Bar

---

Không lạm dụng Pie Chart.

---

# XVI. CHART COLOR STANDARD

Primary

#5B3DF5

---

Success

#10B981

---

Warning

#F59E0B

---

Error

#EF4444

---

Neutral

#CBD5E1

---

# XVII. INVENTORY WIDGET

Purpose

Theo dõi kho.

---

Metrics

Còn hàng

Sắp hết

Hết hàng

Đang kiểm kê

---

Layout

4 Cards

---

# XVIII. TOP PRODUCT WIDGET

Hiển thị:

Top 10 sản phẩm bán chạy

---

Columns

Tên

SL bán

Doanh thu

---

# XIX. TOP CUSTOMER WIDGET

Hiển thị:

Top 10 khách hàng

---

Columns

Tên

Đơn hàng

Doanh thu

---

# XX. DEBT WIDGET

Hiển thị:

Tổng công nợ

Quá hạn

Sắp đến hạn

Đã thanh toán

---

# XXI. CASHFLOW WIDGET

Hiển thị:

Thu

Chi

Lợi nhuận

---

Theo ngày

Tuần

Tháng

---

# XXII. ACTIVITY TIMELINE

Purpose

Theo dõi hoạt động gần đây.

---

Hiển thị:

Tạo đơn hàng

Nhập hàng

Thanh toán

Kiểm kê

---

Max Records

20

---

# XXIII. NOTIFICATION WIDGET

Hiển thị:

Cảnh báo tồn kho

Công nợ quá hạn

Đơn hàng chờ xử lý

---

Ưu tiên hiển thị trên cùng.

---

# XXIV. QUICK ACTION WIDGET

Hiển thị:

Tạo đơn hàng

Nhập hàng

Kiểm kê

Khách hàng mới

---

Max

6 Actions

---

# XXV. EMPTY STATE

Khi chưa có dữ liệu.

---

Hiển thị:

Icon

Title

Description

Action

---

# XXVI. LOADING STATE

Skeleton Card

Skeleton Chart

Skeleton Table

---

Không dùng Spinner toàn màn hình.

---

# XXVII. ERROR STATE

Hiển thị:

Icon

Thông báo lỗi

Retry Button

---

# XXVIII. REFRESH STANDARD

Auto Refresh

Tắt mặc định

---

Manual Refresh

Bật

---

Refresh Button

Top Right

---

# XXIX. RESPONSIVE STANDARD

Desktop

12 Columns

---

Tablet

6 Columns

---

Mobile

1 Column

---

# XXX. PERFORMANCE RULE

Dashboard API

Phân tách riêng

---

Không gọi toàn bộ dữ liệu trong một request.

---

Chart

Lazy Load

---

Widget

Lazy Load

---

# XXXI. DASHBOARD PRIORITY ORDER

1

KPI Area

---

2

Notification Widget

---

3

Revenue Chart

---

4

Inventory Widget

---

5

Top Product

---

6

Top Customer

---

7

Activity Timeline

---

# XXXII. MASTER DASHBOARD STRUCTURE

<DashboardPage>

```
<DashboardHeader />

<DateFilter />

<KPIArea />

<ChartArea />

<WidgetArea />

<ActivityTimeline />
```

</DashboardPage>

---

# XXXIII. COMPONENT STANDARD

Toàn bộ hệ thống phải sử dụng:

DashboardPage.tsx

KpiCard.tsx

ChartCard.tsx

WidgetCard.tsx

ActivityTimeline.tsx

NotificationWidget.tsx

QuickActionWidget.tsx

---

# XXXIV. KPI CATALOG CHUẨN POS

Doanh thu hôm nay

---

Lợi nhuận hôm nay

---

Số đơn hàng

---

Khách hàng mới

---

Giá trị tồn kho

---

Công nợ phải thu

---

Công nợ phải trả

---

Sản phẩm sắp hết hàng

---

# XXXV. BẮT BUỘC TUÂN THỦ

Không được:

* Random KPI Card
* Random Chart Style
* Random Widget
* Random Dashboard Layout

Toàn bộ Dashboard phải kế thừa từ:

Dashboard Framework Standard

và tuân thủ tuyệt đối tài liệu này.
