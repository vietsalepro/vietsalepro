# MASTER_MOTION_ANIMATION_STANDARD_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Animation, Motion, Transition và Micro-Interaction trong POS Enterprise.

Motion giúp:

* Tăng khả năng nhận biết trạng thái
* Giảm cảm giác giật lag
* Hướng dẫn người dùng
* Tăng tính chuyên nghiệp

Không sử dụng Motion để trang trí.

---

# I. TRIẾT LÝ THIẾT KẾ

Motion phải:

* Nhanh
* Nhẹ
* Nhất quán
* Có mục đích

---

Không được:

* Animation dài
* Animation màu mè
* Animation gây mất tập trung

---

# II. MOTION HIERARCHY

Level 1

Micro Interaction

---

Level 2

Component Transition

---

Level 3

Layout Transition

---

Level 4

Page Transition

---

# III. DEFAULT MOTION TOKENS

Fast

150ms

---

Normal

250ms

---

Slow

350ms

---

Extra Slow

500ms

---

Không dùng animation >500ms.

---

# IV. EASING STANDARD

Default

ease-out

---

Enter

ease-out

---

Exit

ease-in

---

Complex Transition

ease-in-out

---

# V. DELAY STANDARD

Default

0ms

---

Optional

75ms

---

Maximum

150ms

---

Không dùng delay lớn hơn.

---

# VI. HOVER ANIMATION

Duration

150ms

---

Easing

ease-out

---

Áp dụng:

Button

Card

Menu Item

Tab

---

# VII. FOCUS ANIMATION

Duration

150ms

---

Property

Outline

Box Shadow

---

Không animate vị trí.

---

# VIII. ACTIVE STATE

Duration

100ms

---

Scale

1.00

↓

0.98

↓

1.00

---

Chỉ áp dụng Button.

---

# IX. MODAL OPEN ANIMATION

Animation

Fade + Scale

---

Duration

250ms

---

Opacity

0 → 1

---

Scale

0.96 → 1

---

Transform Origin

Center

---

# X. MODAL CLOSE ANIMATION

Duration

200ms

---

Opacity

1 → 0

---

Scale

1 → 0.98

---

# XI. MODAL OVERLAY

Fade

---

Duration

200ms

---

Opacity

0 → 0.5

---

# XII. SIDEBAR EXPAND

Duration

250ms

---

Width

72px → 280px

---

Easing

ease-in-out

---

# XIII. SIDEBAR COLLAPSE

Duration

250ms

---

Width

280px → 72px

---

Easing

ease-in-out

---

# XIV. SIDEBAR MENU EXPAND

Duration

200ms

---

Height Auto Animation

Không sử dụng.

---

Dùng:

max-height

---

# XV. DROPDOWN OPEN

Animation

Fade + Slide

---

Duration

150ms

---

TranslateY

-8px → 0

---

Opacity

0 → 1

---

# XVI. DROPDOWN CLOSE

Duration

120ms

---

TranslateY

0 → -4px

---

Opacity

1 → 0

---

# XVII. POPOVER OPEN

Duration

180ms

---

Animation

Fade + Scale

---

Scale

0.98 → 1

---

# XVIII. TOOLTIP APPEAR

Duration

120ms

---

Opacity

0 → 1

---

Delay

75ms

---

# XIX. TOAST SHOW

Duration

250ms

---

TranslateY

24px → 0

---

Opacity

0 → 1

---

# XX. TOAST HIDE

Duration

200ms

---

Opacity

1 → 0

---

TranslateY

0 → -12px

---

# XXI. TAB SWITCH

Duration

150ms

---

Indicator Slide

Enabled

---

Content Fade

Optional

---

# XXII. ACCORDION OPEN

Duration

200ms

---

Max Height Animation

---

Opacity

0 → 1

---

# XXIII. ACCORDION CLOSE

Duration

180ms

---

Opacity

1 → 0

---

# XXIV. ALERT APPEAR

Duration

200ms

---

Fade

Enabled

---

# XXV. CARD HOVER

Duration

150ms

---

TranslateY

0 → -2px

---

Shadow

SM → MD

---

# XXVI. BUTTON HOVER

Duration

150ms

---

Background

Transition

---

Shadow

Optional

---

# XXVII. BUTTON PRESS

Duration

100ms

---

Scale

0.98

---

# XXVIII. TABLE ROW HOVER

Duration

120ms

---

Background

Transition Only

---

Không dùng transform.

---

# XXIX. INPUT FOCUS

Duration

150ms

---

Border Color

Transition

---

Box Shadow

Transition

---

# XXX. BADGE TRANSITION

Duration

150ms

---

Color Change Only

---

# XXXI. LOADING SPINNER

Rotation

Infinite

---

Duration

1s

---

Linear

---

# XXXII. SKELETON LOADING

Animation

Shimmer

---

Duration

1.5s

---

Infinite

---

# XXXIII. PROGRESS BAR

Duration

300ms

---

Easing

ease-out

---

# XXXIV. STEPPER TRANSITION

Duration

200ms

---

Fade

Enabled

---

# XXXV. PAGE LOADING

Fade In

---

Duration

250ms

---

Không dùng slide page.

---

# XXXVI. PAGE TRANSITION

POS Desktop

Disabled

(Default)

---

Lý do:

Tối ưu hiệu suất.

---

# XXXVII. ERROR SHAKE

Duration

300ms

---

Chỉ dùng:

Form Validation

---

Không dùng toàn hệ thống.

---

# XXXVIII. SUCCESS ANIMATION

Duration

300ms

---

Icon Scale

0.8 → 1

---

# XXXIX. REDUCED MOTION

Bắt buộc hỗ trợ:

prefers-reduced-motion

---

# XL. ACCESSIBILITY RULE

Người dùng bật:

Reduce Motion

↓

Tắt:

Transform

Scale

Slide

---

Giữ:

Opacity

---

# XLI. GPU RULE

Ưu tiên animate:

transform

opacity

---

Không animate:

width

height

left

top

khi có thể tránh được.

---

# XLII. PERFORMANCE RULE

Animation

60 FPS

---

Target

<16ms/frame

---

# XLIII. CSS TOKEN STANDARD

--motion-fast

150ms

---

--motion-normal

250ms

---

--motion-slow

350ms

---

--ease-standard

ease-out

---

# XLIV. TAILWIND MAPPING

duration-150

duration-250

duration-350

---

ease-out

ease-in

ease-in-out

---

# XLV. FILE STRUCTURE

/src/design-system/motion

motionTokens.ts

transitions.ts

animations.ts

---

# XLVI. COMPONENT INTEGRATION

Button

↓

Motion Standard

---

Modal

↓

Motion Standard

---

Dropdown

↓

Motion Standard

---

Sidebar

↓

Motion Standard

---

Toast

↓

Motion Standard

---

# XLVII. FORBIDDEN

Không được:

* Animation >500ms
* Bounce Animation
* Spin Animation cho UI thông thường
* Animation liên tục
* Parallax
* Animation trang trí

---

# XLVIII. BẮT BUỘC TUÂN THỦ

Mọi Motion phải kế thừa:

MASTER_DESIGN_TOKENS_V1

↓

MASTER_MOTION_ANIMATION_STANDARD_V1

↓

Components

↓

Application

---

Motion là ngôn ngữ phản hồi của hệ thống.

Nếu Typography là cách hệ thống nói

thì Motion là cách hệ thống chuyển động.
