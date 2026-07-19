# MASTER_DESIGN_TOKENS_V1

Version: 1.0

Purpose:

Chuẩn hóa toàn bộ Design Tokens của hệ thống POS Enterprise.

Design Tokens là nguồn sự thật duy nhất (Single Source of Truth) cho:

* Colors
* Typography
* Spacing
* Radius
* Shadows
* Borders
* Z-Index
* Motion
* Layout

Mọi Component phải sử dụng Token.

Không được Hardcode.

---

# I. TRIẾT LÝ THIẾT KẾ

Sai:

```css
color:#5B3DF5;
padding:17px;
border-radius:19px;
```

Đúng:

```css
color:var(--color-primary);
padding:var(--space-16);
border-radius:var(--radius-lg);
```

---

# II. TOKEN HIERARCHY

Global Tokens

↓

Semantic Tokens

↓

Component Tokens

↓

UI Components

---

# III. TOKEN NAMING RULE

Format:

```txt
category-role-size
```

Ví dụ:

```txt
color-primary
space-16
radius-lg
font-size-md
```

---

Không đặt tên:

```txt
purple-color
blue-button
big-radius
```

---

# IV. COLOR SYSTEM

Base Color Palette

Semantic Color

Component Color

---

# V. PRIMARY COLORS

Primary 50

#F5F3FF

---

Primary 100

#EDE9FE

---

Primary 200

#DDD6FE

---

Primary 300

#C4B5FD

---

Primary 400

#A78BFA

---

Primary 500

#8B5CF6

---

Primary 600

#7C3AED

---

Primary 700

#6D28D9

---

Primary 800

#5B21B6

---

Primary 900

#4C1D95

---

# VI. SEMANTIC COLORS

Primary

#5B3DF5

---

Success

#10B981

---

Warning

#F59E0B

---

Danger

#EF4444

---

Info

#3B82F6

---

# VII. BACKGROUND COLORS

Background Primary

#FFFFFF

---

Background Secondary

#F8FAFC

---

Background Tertiary

#F1F5F9

---

Background Hover

#FAFAFF

---

# VIII. TEXT COLORS

Text Primary

#0F172A

---

Text Secondary

#64748B

---

Text Tertiary

#94A3B8

---

Text Disabled

#CBD5E1

---

Text Inverse

#FFFFFF

---

# IX. BORDER COLORS

Border Primary

#E2E8F0

---

Border Secondary

#CBD5E1

---

Border Focus

#5B3DF5

---

Border Error

#EF4444

---

# X. TYPOGRAPHY SYSTEM

Font Family

↓

Font Size

↓

Font Weight

↓

Line Height

---

# XI. FONT FAMILY

Primary Font

```css
Inter,
Roboto,
"Noto Sans",
sans-serif
```

---

Fallback Vietnamese

```css
"Noto Sans"
```

---

# XII. FONT SIZES

xs

12px

---

sm

13px

---

md

14px

---

lg

16px

---

xl

18px

---

2xl

20px

---

3xl

24px

---

4xl

30px

---

# XIII. FONT WEIGHTS

Regular

400

---

Medium

500

---

SemiBold

600

---

Bold

700

---

# XIV. LINE HEIGHT

Tight

1.2

---

Normal

1.5

---

Relaxed

1.7

---

# XV. SPACING SYSTEM

Spacing Scale

4px Grid

---

# XVI. SPACE TOKENS

space-0

0

---

space-4

4px

---

space-8

8px

---

space-12

12px

---

space-16

16px

---

space-20

20px

---

space-24

24px

---

space-32

32px

---

space-40

40px

---

space-48

48px

---

space-64

64px

---

# XVII. BORDER RADIUS

radius-xs

4px

---

radius-sm

8px

---

radius-md

12px

---

radius-lg

16px

---

radius-xl

20px

---

radius-2xl

24px

---

radius-full

999px

---

# XVIII. BORDER WIDTH

border-1

1px

---

border-2

2px

---

border-4

4px

---

# XIX. SHADOW SYSTEM

shadow-xs

0 1px 2px rgba(15,23,42,.04)

---

shadow-sm

0 2px 8px rgba(15,23,42,.05)

---

shadow-md

0 4px 12px rgba(15,23,42,.06)

---

shadow-lg

0 8px 24px rgba(15,23,42,.08)

---

shadow-xl

0 12px 32px rgba(15,23,42,.12)

---

# XX. OPACITY TOKENS

opacity-disabled

0.5

---

opacity-overlay

0.7

---

opacity-hidden

0

---

opacity-visible

1

---

# XXI. Z-INDEX SYSTEM

z-base

1

---

z-dropdown

100

---

z-sticky

200

---

z-fixed

500

---

z-modal

1000

---

z-toast

1100

---

z-tooltip

1200

---

z-loading

1300

---

# XXII. SIZE TOKENS

size-24

24px

---

size-32

32px

---

size-40

40px

---

size-48

48px

---

size-56

56px

---

size-64

64px

---

# XXIII. ICON TOKENS

icon-xs

14px

---

icon-sm

16px

---

icon-md

18px

---

icon-lg

20px

---

icon-xl

24px

---

# XXIV. MODAL SIZE TOKENS

modal-sm

480px

---

modal-md

720px

---

modal-lg

960px

---

modal-xl

1200px

---

# XXV. TABLE TOKENS

table-row-height

56px

---

table-header-height

52px

---

table-cell-padding

16px

---

# XXVI. FORM TOKENS

input-height

44px

---

textarea-min-height

120px

---

label-gap

8px

---

field-gap

16px

---

# XXVII. BUTTON TOKENS

button-height-sm

36px

---

button-height-md

44px

---

button-height-lg

52px

---

button-radius

12px

---

# XXVIII. MOTION TOKENS

transition-fast

150ms

---

transition-normal

250ms

---

transition-slow

350ms

---

# XXIX. EASING TOKENS

ease-standard

ease

---

ease-in

ease-in

---

ease-out

ease-out

---

ease-in-out

ease-in-out

---

# XXX. BREAKPOINT SYSTEM

mobile

0px

---

tablet

768px

---

desktop

1280px

---

wide

1536px

---

# XXXI. CONTAINER WIDTH

container-sm

640px

---

container-md

768px

---

container-lg

1024px

---

container-xl

1280px

---

container-2xl

1440px

---

# XXXII. CSS VARIABLE STANDARD

:root {

--color-primary:#5B3DF5;

--color-success:#10B981;

--color-danger:#EF4444;

--space-16:16px;

--radius-lg:16px;

}

---

# XXXIII. TAILWIND TOKEN MAPPING

theme.extend {

colors:{},

spacing:{},

borderRadius:{},

boxShadow:{}

}

---

# XXXIV. COMPONENT TOKEN RULE

Button

↓

Button Tokens

---

Input

↓

Input Tokens

---

Table

↓

Table Tokens

---

Không được Hardcode.

---

# XXXV. DARK MODE READY

Mọi token phải hỗ trợ:

Light

↓

Dark

---

Thông qua Semantic Tokens.

---

# XXXVI. ACCESSIBILITY TOKENS

Focus Ring

2px

---

Focus Color

Primary

---

Minimum Contrast

4.5:1

---

# XXXVII. DESIGN TOKEN FILE STRUCTURE

/src/design-system

tokens/

colors.ts

spacing.ts

typography.ts

radius.ts

shadow.ts

zindex.ts

motion.ts

---

# XXXVIII. EXPORT STANDARD

index.ts

↓

Export All Tokens

---

# XXXIX. TOKEN GOVERNANCE

Chỉ Design Team được thay đổi.

---

Developer không tự tạo token mới.

---

# XL. BẮT BUỘC TUÂN THỦ

Không được:

* Hardcode màu
* Hardcode padding
* Hardcode radius
* Hardcode shadow
* Hardcode z-index

Mọi UI Component phải sử dụng:

Design Tokens

↓

Design System

↓

Component Library

↓

Application

---

Design Tokens là tầng thấp nhất của toàn bộ UI Architecture.

Nếu Design System là Luật

thì Design Tokens là DNA của hệ thống.
