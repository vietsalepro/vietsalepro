
# POS DESIGN SYSTEM V1.0

## I. TRIẾT LÝ THIẾT KẾ

Phong cách:
- Modern SaaS
- Clean Enterprise
- Soft UI
- Premium Business Dashboard

Đặc điểm:
- Nền trắng
- Border rất nhẹ
- Shadow rất nhẹ
- Bo góc lớn
- Khoảng trắng nhiều
- Font thanh mảnh
- Icon tối giản
- Không dùng màu quá gắt

---

# II. COLOR SYSTEM

## Primary

```css
--primary-50: #F5F3FF;
--primary-100: #EDE9FE;
--primary-200: #DDD6FE;
--primary-500: #6D4AFF;
--primary-600: #5B3DF5;
--primary-700: #4C31D8;
```

Sử dụng:
- Button chính
- Link
- Pagination active
- Icon chính
- Focus state

## Success

```css
--success-50: #ECFDF5;
--success-500: #10B981;
--success-600: #059669;
```

## Warning

```css
--warning-50: #FFF7ED;
--warning-500: #F97316;
```

## Error

```css
--error-50: #FEF2F2;
--error-500: #EF4444;
```

## Neutral

```css
--gray-50: #F8FAFC;
--gray-100: #F1F5F9;
--gray-200: #E2E8F0;
--gray-300: #CBD5E1;
--gray-400: #94A3B8;
--gray-500: #64748B;
--gray-700: #334155;
--gray-900: #0F172A;
```

---

# III. TYPOGRAPHY SYSTEM

## Font Family

```css
font-family:
"Be Vietnam Pro",
"Inter",
sans-serif;
```

## Modal Title

```css
font-size: 28px;
font-weight: 700;
line-height: 36px;
```

## Section Title

```css
font-size: 18px;
font-weight: 600;
line-height: 28px;
```

## Field Label

```css
font-size: 13px;
font-weight: 500;
```

## Normal Text

```css
font-size: 14px;
font-weight: 400;
line-height: 22px;
```

## Table Text

```css
font-size: 14px;
font-weight: 500;
```

## Caption

```css
font-size: 12px;
font-weight: 400;
```

---

# IV. MODAL SIZE SYSTEM

## Small

```css
width: 640px;
max-width: 640px;
```

## Medium

```css
width: 960px;
max-width: 960px;
```

## Large

```css
width: 1400px;
max-width: 1400px;
```

## Full

```css
width: 95vw;
height: 95vh;
```

---

# V. BOX SYSTEM

## 1. OUTER CONTAINER

```css
background: #FFFFFF;
border-radius: 24px;
border: 1px solid #F1F5F9;
box-shadow: 0 4px 20px rgba(15,23,42,0.04);
padding: 24px;
```

## 2. SECTION BOX

```css
background: white;
border: 1px solid #F1F5F9;
border-radius: 20px;
padding: 20px;
box-shadow: 0 2px 8px rgba(15,23,42,0.03);
```

## 3. FILTER BOX

```css
background: #FFFFFF;
border: 1px solid #F1F5F9;
border-radius: 24px;
padding: 20px 24px;
display: flex;
gap: 16px;
min-height: 110px;
```

## 4. STATISTIC CARD

```css
height: 96px;
min-width: 280px;

background: white;
border: 1px solid #F1F5F9;
border-radius: 20px;
padding: 20px;

display:flex;
align-items:center;
```

### Icon Box

```css
width: 48px;
height: 48px;
border-radius: 14px;
background:#F8FAFC;
```

## 5. TABLE BOX

```css
background:white;
border-radius:24px;
border:1px solid #F1F5F9;
overflow:hidden;
padding:0;
```

---

# VI. BUTTON SYSTEM

## Primary

```css
height:44px;
padding:0 20px;
background:#5B3DF5;
color:white;
border-radius:12px;
font-size:14px;
font-weight:600;
```

### Hover

```css
background:#4C31D8;
```

## Secondary

```css
background:white;
border:1px solid #E2E8F0;
color:#334155;
```

## Ghost

```css
background:transparent;
```

## Icon Button

```css
width:40px;
height:40px;
border-radius:12px;
border:1px solid #E2E8F0;
```

---

# VII. INPUT SYSTEM

```css
height:44px;
border:1px solid #E2E8F0;
border-radius:12px;
padding:0 14px;
```

### Placeholder

```css
font-size:14px;
color:#94A3B8;
```

### Focus

```css
border-color:#5B3DF5;
box-shadow:0 0 0 3px rgba(91,61,245,.15);
```

---

# VIII. TABLE DESIGN SYSTEM

## Header

```css
height:52px;
background:#FFFFFF;
border-bottom:1px solid #F1F5F9;
font-size:13px;
font-weight:600;
```

## Row

```css
height:56px;
```

### Hover

```css
background:#FAFBFC;
```

### Cell Padding

```css
padding:16px 20px;
```

---

# IX. STATUS TAG SYSTEM

## Success

```css
background:#ECFDF5;
color:#059669;
height:28px;
padding:0 12px;
border-radius:999px;
```

## Warning

```css
background:#FFF7ED;
color:#EA580C;
```

## Error

```css
background:#FEF2F2;
color:#DC2626;
```

---

# X. SPACING SYSTEM

Chỉ sử dụng:

4px
8px
12px
16px
20px
24px
32px
40px
48px

---

# XI. TAILWIND TOKEN CHUẨN

```txt
rounded-xl      = 12px
rounded-2xl     = 16px
rounded-3xl     = 24px

h-11            = 44px

p-5             = 20px
p-6             = 24px

gap-4           = 16px
gap-5           = 20px

text-sm         = 14px
text-xs         = 12px

shadow-sm
border-slate-200
bg-white
```
