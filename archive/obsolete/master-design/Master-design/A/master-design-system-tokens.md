# PHỤ LỤC BỔ SUNG

FILE: design-system-tokens.css

SECTION: CSS TOKENS → TAILWIND MAPPING

Version: V1

---

/* =======================================================
COLOR SYSTEM
======================================================= */

:root {

/* PRIMARY */

--color-primary-50:  #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #2563eb;
--color-primary-600: #1d4ed8;
--color-primary-700: #1e40af;

/* SUCCESS */

--color-success-50:  #ecfdf5;
--color-success-500: #10b981;
--color-success-600: #059669;

/* WARNING */

--color-warning-50:  #fffbeb;
--color-warning-500: #f59e0b;
--color-warning-600: #d97706;

/* DANGER */

--color-danger-50:  #fef2f2;
--color-danger-500: #ef4444;
--color-danger-600: #dc2626;

/* NEUTRAL */

--color-gray-50:  #f8fafc;
--color-gray-100: #f1f5f9;
--color-gray-200: #e2e8f0;
--color-gray-300: #cbd5e1;
--color-gray-400: #94a3b8;
--color-gray-500: #64748b;
--color-gray-600: #475569;
--color-gray-700: #334155;
--color-gray-800: #1e293b;
--color-gray-900: #0f172a;

}

---

TAILWIND

bg-primary-500
→ var(--color-primary-500)

text-primary-600
→ var(--color-primary-600)

border-primary-300
→ var(--color-primary-300)

---

/* =======================================================
TYPOGRAPHY TOKENS
======================================================= */

:root {

--font-family-base:
Inter,
"Noto Sans",
"Segoe UI",
sans-serif;

--font-size-xs: 12px;
--font-size-sm: 13px;
--font-size-md: 14px;
--font-size-lg: 16px;
--font-size-xl: 20px;
--font-size-2xl: 24px;

--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

}

---

TAILWIND

text-xs
→ var(--font-size-xs)

text-sm
→ var(--font-size-sm)

text-base
→ var(--font-size-md)

text-lg
→ var(--font-size-lg)

---

/* =======================================================
SPACING TOKENS
======================================================= */

:root {

--space-2: 2px;
--space-4: 4px;
--space-8: 8px;
--space-12: 12px;
--space-16: 16px;
--space-20: 20px;
--space-24: 24px;
--space-32: 32px;
--space-40: 40px;

}

---

TAILWIND

p-1 → 4px
p-2 → 8px
p-3 → 12px
p-4 → 16px
p-6 → 24px
p-8 → 32px

gap-2 → 8px
gap-3 → 12px
gap-4 → 16px
gap-6 → 24px

---

/* =======================================================
BORDER RADIUS TOKENS
======================================================= */

:root {

--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

}

---

TAILWIND

rounded-sm
→ 6px

rounded-md
→ 10px

rounded-lg
→ 12px

rounded-xl
→ 16px

rounded-full
→ 9999px

---

/* =======================================================
SHADOW TOKENS
======================================================= */

:root {

--shadow-sm:
0 1px 2px rgba(0,0,0,.06);

--shadow-md:
0 4px 8px rgba(0,0,0,.08);

--shadow-lg:
0 10px 20px rgba(0,0,0,.10);

--shadow-xl:
0 20px 40px rgba(0,0,0,.12);

}

---

TAILWIND

shadow-sm
→ var(--shadow-sm)

shadow
→ var(--shadow-md)

shadow-lg
→ var(--shadow-lg)

shadow-xl
→ var(--shadow-xl)

---

/* =======================================================
MOTION TOKENS
======================================================= */

:root {

--motion-fast: 150ms;
--motion-normal: 250ms;
--motion-slow: 350ms;

--ease-standard: ease-out;
--ease-enter: ease-out;
--ease-exit: ease-in;
--ease-smooth: ease-in-out;

}

---

TAILWIND

duration-150

duration-200

duration-300

ease-out

ease-in

ease-in-out

---

/* =======================================================
ELEVATION TOKENS
======================================================= */

:root {

--z-content: 1;

--z-navigation: 100;

--z-dropdown: 500;

--z-drawer: 900;

--z-modal-overlay: 990;

--z-modal: 1000;

--z-toast: 1100;

--z-tooltip: 1200;

--z-system: 9999;

}

---

/* =======================================================
INPUT TOKENS
======================================================= */

:root {

--input-height-sm: 36px;
--input-height-md: 40px;
--input-height-lg: 44px;

--input-radius: 10px;

}

---

/* =======================================================
BUTTON TOKENS
======================================================= */

:root {

--button-height-sm: 32px;
--button-height-md: 40px;
--button-height-lg: 44px;

}

---

/* =======================================================
TABLE TOKENS
======================================================= */

:root {

--table-row-height: 44px;

--table-header-height: 48px;

}

---

/* =======================================================
MODAL TOKENS
======================================================= */

:root {

--modal-width-sm: 640px;
--modal-width-md: 960px;
--modal-width-lg: 1280px;

}

---

/* =======================================================
CARD TOKENS
======================================================= */

:root {

--card-padding: 16px;

--card-radius: 12px;

}

---

/* =======================================================
GRID TOKENS
======================================================= */

:root {

--grid-columns: 12;

--grid-gap: 16px;

}
