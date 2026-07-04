# MASTER_SPLIT_PANE_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Split Pane Layout, Side Panel Layout và Master-Detail Layout trong POS Enterprise.

Áp dụng cho:

* Danh sách sản phẩm → Chi tiết sản phẩm
* Danh sách khách hàng → Chi tiết khách hàng
* Danh sách đơn hàng → Chi tiết đơn hàng
* Danh sách phiếu nhập → Chi tiết phiếu nhập
* Danh sách lô hàng → Chi tiết lô hàng
* Quản lý kho
* Audit Viewer

---

# I. TRIẾT LÝ THIẾT KẾ

Split Pane dùng để:

* Giảm chuyển trang
* Giữ ngữ cảnh người dùng
* Tăng tốc độ thao tác
* Hỗ trợ Desktop Workflow

---

Không sử dụng Split Pane khi:

* Form quá phức tạp
* Cần Wizard nhiều bước
* Cần Modal Workflow

---

# II. SPLIT PANE ARCHITECTURE

Left Pane

↓

Divider

↓

Right Pane

---

# III. LAYOUT TYPES

Type A

List → Detail

---

Type B

Tree → Detail

---

Type C

Grid → Preview

---

Type D

Master → Child Records

---

# IV. DEFAULT TYPE

Toàn bộ POS V1 sử dụng:

List → Detail

---

# V. DESKTOP LAYOUT

```txt
┌────────────────────┬──────────────────────────────┐
│                    │                              │
│     Left Pane      │         Right Pane           │
│                    │                              │
└────────────────────┴──────────────────────────────┘
```

---

# VI. LEFT PANE WIDTH

Default

320px

---

Min Width

280px

---

Max Width

420px

---

# VII. RIGHT PANE

Width

Auto

---

Flex

1

---

# VIII. SPLITTER

Width

1px

---

Color

Border Default

---

# IX. RESIZABLE SPLITTER

Supported

---

Drag Width

Allowed

---

# X. SPLITTER RANGE

Min

280px

---

Max

500px

---

# XI. PANE HEIGHT

Height

100%

---

Theo Content Area

---

# XII. LEFT PANE PURPOSE

Hiển thị:

* Danh sách
* Tree
* Search Result
* Filter Result

---

# XIII. LEFT PANE STRUCTURE

Pane Header

↓

Search

↓

Filter

↓

List

---

# XIV. LEFT PANE HEADER

Height

56px

---

Padding

16px

---

# XV. SEARCH AREA

Height

40px

---

Margin Bottom

12px

---

# XVI. LIST AREA

Scrollable

Required

---

Overflow

Auto

---

# XVII. LIST ITEM HEIGHT

56px

(Default)

---

Compact

48px

---

# XVIII. LIST ITEM STATES

Default

Hover

Selected

Disabled

---

# XIX. SELECTED ITEM

Background

Primary 50

---

Border Left

3px Primary

---

# XX. RIGHT PANE PURPOSE

Hiển thị:

Thông tin chi tiết

---

# XXI. RIGHT PANE STRUCTURE

Detail Header

↓

Summary Card

↓

Detail Content

↓

Related Data

---

# XXII. DETAIL HEADER

Height

64px

---

Padding

16px 24px

---

# XXIII. DETAIL TITLE

Size

20px

---

Weight

600

---

# XXIV. DETAIL ACTIONS

Position

Top Right

---

Examples

Edit

Delete

Print

Export

---

# XXV. DETAIL CONTENT

Scrollable

Required

---

# XXVI. CONTENT PADDING

24px

---

# XXVII. SUMMARY CARD

Theo:

MASTER_PAGE_LAYOUT_STANDARD_V1

Summary Pattern

---

# XXVIII. DETAIL CARD

Theo:

MASTER_PAGE_LAYOUT_STANDARD_V1

Detail Pattern

---

# XXIX. EMPTY DETAIL STATE

Nếu chưa chọn dữ liệu

↓

Hiển thị Empty State

---

# XXX. EMPTY STATE LAYOUT

```txt
📄

Chọn một bản ghi để xem chi tiết
```

---

# XXXI. EMPTY STATE POSITION

Center

Vertical + Horizontal

---

# XXXII. SIDE PANEL MODE

Purpose

Hiển thị nhanh thông tin

---

Layout

```txt
┌──────────────────────┐
│                      │
│      Side Panel      │
│                      │
└──────────────────────┘
```

---

# XXXIII. SIDE PANEL WIDTH

Small

400px

---

Medium

600px

---

Large

800px

---

# XXXIV. SIDE PANEL POSITION

Right

(Default)

---

# XXXV. SIDE PANEL HEADER

Height

64px

---

# XXXVI. SIDE PANEL FOOTER

Sticky

Required

---

# XXXVII. SIDE PANEL ACTIONS

Cancel

Save

Print

Export

---

# XXXVIII. COLLAPSIBLE LEFT PANE

Supported

---

Expanded

320px

---

Collapsed

72px

---

# XXXIX. COLLAPSE BUTTON

Position

Top Right

---

# XL. RESPONSIVE RULE

Desktop

Split Pane

---

Tablet

Optional Split Pane

---

Mobile

Không dùng Split Pane

↓

Navigate sang Detail Page

---

# XLI. KEYBOARD SUPPORT

Arrow Up

Previous Record

---

Arrow Down

Next Record

---

Enter

Open Detail

---

Esc

Close Side Panel

---

# XLII. SCROLL RULE

Left Pane Scroll

Độc lập

---

Right Pane Scroll

Độc lập

---

Không dùng chung Scroll Container

---

# XLIII. PERFORMANCE RULE

Virtual Scroll

Khuyến nghị

Khi > 500 records

---

# XLIV. LOADING STATE

Left Pane

Skeleton List

---

Right Pane

Skeleton Detail

---

# XLV. EMPTY LIST STATE

Nếu không có dữ liệu

↓

MASTER_EMPTY_STATE_STANDARD_V1

---

# XLVI. Z-INDEX

Side Panel

↓

900

---

Theo:

MASTER_ELEVATION_ZINDEX_STANDARD_V1

---

# XLVII. ANIMATION

Open Side Panel

250ms

---

Close Side Panel

200ms

---

Theo:

MASTER_MOTION_ANIMATION_STANDARD_V1

---

# XLVIII. FILE STRUCTURE

/components/layout

SplitPane.tsx

ResizablePane.tsx

SidePanel.tsx

DetailView.tsx

MasterDetailLayout.tsx

---

# XLIX. REACT ARCHITECTURE

<SplitPane>

<MasterPane />

<DetailPane />

</SplitPane>

---

# L. DESIGN DEPENDENCIES

MASTER_APP_SHELL_STANDARD_V1

↓

MASTER_PAGE_LAYOUT_STANDARD_V1

↓

MASTER_MOTION_ANIMATION_STANDARD_V1

↓

MASTER_ELEVATION_ZINDEX_STANDARD_V1

↓

MASTER_SPLIT_PANE_STANDARD_V1

---

# LI. FORBIDDEN

Không được:

* Left Pane < 280px
* Left Pane > 500px
* Dùng chung Scroll
* Detail không có Empty State
* Tự tạo Split Layout khác chuẩn

---

# LII. BẮT BUỘC TUÂN THỦ

Mọi màn hình Master-Detail phải theo:

List Pane

↓

Splitter

↓

Detail Pane

Hoặc:

Page

↓

Side Panel

Không được tự thiết kế layout riêng.

---

Split Pane là layout tối ưu nhất cho Desktop POS.

Nếu Modal dùng cho thao tác ngắn hạn

thì Split Pane dùng cho quy trình làm việc liên tục với dữ liệu nghiệp vụ.
