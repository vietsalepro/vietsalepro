# Open-Source References

> **Scope:** This document lists all third-party open-source software and publicly
> documented projects referenced by **VietSalePro**. It is maintained for license
> compliance and engineering transparency.
>
> **Legal status of this project:** VietSalePro is proprietary software. All
> original source code, UI/UX, database schemas, business logic and assets are the
> exclusive property of Phát Nguyễn Tấn. Open-source components are used under
> their respective licenses only; they do not change the proprietary license of
> VietSalePro itself. See `LICENSE.md` and `NOTICE.md` for the project license.

---

## 1. Runtime / production dependencies

The following packages are distributed inside the built application. They are
installed as runtime dependencies in `package.json`.

| Package | Declared in package.json | Installed | License | Repository / Source | How it is used |
|---------|--------------------------|-----------|---------|--------------------|----------------|
| `@supabase/supabase-js` | `^2.97.0` | 2.97.0 | MIT | https://github.com/supabase/supabase-js | Supabase client for auth, database, realtime and storage. Used across services and React hooks. |
| `file-saver` | `^2.0.5` | 2.0.5 | MIT | https://github.com/eligrey/FileSaver.js | Trigger client-side file downloads (CSV/JSON/Excel/PDF exports). |
| `framer-motion` | `^11.18.2` | 11.18.2 | MIT | https://github.com/framer/motion | UI animations and page transitions. |
| `html2canvas` | `^1.4.1` | 1.4.1 | MIT | https://github.com/niklasvh/html2canvas | Capture DOM elements to canvas for printable/ downloadable images. |
| `html5-qrcode` | `^2.3.8` | 2.3.8 | Apache-2.0 | https://github.com/mebjas/html5-qrcode | Barcode and QR code scanning in browser. |
| `jspdf` | `^4.2.1` | 4.2.1 | MIT | https://github.com/parallax/jsPDF | Generate PDF invoices and reports on the client. |
| `lucide-react` | `^0.564.0` | 0.564.0 | ISC | https://github.com/lucide-icons/lucide | SVG icon set used as React components throughout the UI. |
| `react` | `^19.2.4` | 19.2.4 | MIT | https://github.com/facebook/react | UI library / runtime. |
| `react-dom` | `^19.2.4` | 19.2.4 | MIT | https://github.com/facebook/react | React DOM renderer. |
| `react-router-dom` | `^7.13.1` | 7.13.1 | MIT | https://github.com/remix-run/react-router | Client-side routing for the SPA. |
| `recharts` | `^3.7.0` | 3.7.0 | MIT | https://github.com/recharts/recharts | Data visualization (line, bar, pie charts) in dashboard and reports. |
| `xlsx` (SheetJS community edition) | `^0.18.5` | 0.18.5 | Apache-2.0 | https://github.com/SheetJS/sheetjs | Read/write Excel files for import/export features. |

### Runtime transitive dependencies

`npm` installs transitive dependencies automatically. All of them are governed by
their own licenses (mostly MIT, Apache-2.0, ISC, BSD). A complete license listing
is available in `node_modules/<package>/LICENSE` or `package.json` after
installation.

---

## 2. Development / build dependencies

The following packages are used only during development, testing and build
time. They are **not** shipped to end users unless bundled by the build tool.

| Package | Declared in package.json | Installed | License | Repository / Source | How it is used |
|---------|--------------------------|-----------|---------|--------------------|----------------|
| `@tailwindcss/postcss` | `^4.2.1` | 4.2.1 | MIT | https://github.com/tailwindlabs/tailwindcss | PostCSS integration for Tailwind CSS v4. |
| `@testing-library/jest-dom` | `^6.9.1` | 6.9.1 | MIT | https://github.com/testing-library/jest-dom | DOM assertions for Vitest tests. |
| `@testing-library/react` | `^16.3.2` | 16.3.2 | MIT | https://github.com/testing-library/react-testing-library | Render and interact with React components in tests. |
| `@types/file-saver` | `^2.0.7` | 2.0.7 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped | TypeScript definitions. |
| `@types/node` | `^22.14.0` | 22.19.11 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped | Node.js TypeScript definitions. |
| `@types/react` | `^19.2.17` | 19.2.17 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped | React TypeScript definitions. |
| `@types/react-dom` | `^19.2.3` | 19.2.3 | MIT | https://github.com/DefinitelyTyped/DefinitelyTyped | React DOM TypeScript definitions. |
| `@vitejs/plugin-react` | `^5.2.0` | 5.2.0 | MIT | https://github.com/vitejs/vite-plugin-react | React Fast Refresh and JSX/TSX support in Vite. |
| `autoprefixer` | `^10.4.24` | 10.4.24 | MIT | https://github.com/postcss/autoprefixer | Add vendor prefixes to CSS. |
| `docx` | `^9.7.1` | 9.7.1 | MIT | https://github.com/dolanmiu/docx | Generate `.docx` documents (reports, letters) where needed. |
| `jsdom` | `^29.1.1` | 29.1.1 | MIT | https://github.com/jsdom/jsdom | Browser-like DOM environment for Vitest. |
| `postcss` | `^8.5.6` | 8.5.6 | MIT | https://github.com/postcss/postcss | CSS processing pipeline. |
| `tailwindcss` | `^4.2.1` | 4.2.1 | MIT | https://github.com/tailwindlabs/tailwindcss | Utility-first CSS framework. |
| `tsx` | `^4.22.4` | 4.22.4 | MIT | https://github.com/privatenumber/tsx | TypeScript execution for scripts (e.g. `scripts/audit-rpc-contracts.ts`). |
| `typescript` | `~5.8.2` | 5.8.3 | Apache-2.0 | https://github.com/microsoft/TypeScript | Type checker and compiler. |
| `vite` | `^6.2.0` | 6.4.1 | MIT | https://github.com/vitejs/vite | Build tool and dev server. |
| `vite-plugin-pwa` | `^1.2.0` | 1.2.0 | MIT | https://github.com/vite-pwa/vite-plugin-pwa | Progressive Web App manifest and service-worker generation. |
| `vitest` | `^4.1.9` | 4.1.9 | MIT | https://github.com/vitest-dev/vitest | Unit and integration test runner. |

---

## 3. Open-source projects referenced during design

The following projects were studied as **architectural / UI pattern references**
while designing the VietSalePro admin dashboard. No source code from these
projects was copied into VietSalePro unless the project is under a permissive
license (MIT / Apache-2.0 / BSD) and explicitly allowed for that purpose.

| Project | License | Reference purpose |
|---------|---------|-------------------|
| [trentas/saas-scaffolding](https://github.com/trentas/saas-scaffolding) | MIT | Multi-tenant subdomain routing, auth, Stripe billing, audit log, feature flags, API keys, webhooks, RLS patterns. |
| [usebasejump/basejump](https://github.com/usebasejump/basejump) | MIT | Supabase extension for accounts, memberships, invitations, billing lifecycle, `supabase_test_helpers`. |
| [usebasejump/basejump-next](https://github.com/usebasejump/basejump-next) | MIT | UI patterns for tenant switcher, team settings, invitations, role management. |
| [ixartz/SaaS-Boilerplate](https://github.com/ixartz/SaaS-Boilerplate) | MIT | User impersonation flow, landing page, dashboard layout, settings pages. |
| [Cal.com](https://github.com/calcom/cal.com) | AGPL-3.0 | Organization admin dashboard UI/UX, audit log event types, impersonation flows, PBAC, subdomain/custom domain routing. **Architecture-only reference; no code copied.** |
| [Documenso](https://github.com/documenso/documenso) | AGPL-3.0 | Organization settings, member invitations, team management UI. **Architecture-only reference; no code copied.** |
| [Dub.co](https://github.com/dubinc/dub) | AGPL-3.0 | Multi-tenant workspaces, custom domains, subscription billing dashboard. **Architecture-only reference; no code copied.** |
| [Formbricks](https://github.com/formbricks/formbricks) | AGPL-3.0 | Organization/team settings and permission models. **Architecture-only reference; no code copied.** |
| [Lago](https://github.com/getlago/lago) | AGPL-3.0 | Data model for plans, subscriptions, usage events, invoices, credits. **Architecture-only reference; no code copied.** |
| [Kill Bill](https://github.com/killbill/killbill) | Apache-2.0 | Complex subscription billing, payment retries, multi-tenant billing. |
| [Flagsmith](https://github.com/Flagsmith/flagsmith) | BSD-3-Clause | Feature flags, remote config, segments, React/Next.js SDK patterns. |
| [Unleash](https://github.com/Unleash/unleash) | Apache-2.0 | Enterprise feature flag governance. |
| [Flipt](https://github.com/flipt-io/flipt) | Fair Core License (FCL-1.0-MIT) | Git-native flag management (evaluated; not integrated). Converts to MIT after 2 years. |
| [Svix](https://github.com/svix/svix-webhooks) | MIT | Webhook delivery system design (attempts, signatures, endpoint management). |
| [Unkey](https://github.com/unkeyed/unkey) | AGPL-3.0 | API key lifecycle, rate limiting, usage analytics. **Architecture-only reference; no code copied.** |
| [Listmonk](https://github.com/knadh/listmonk) | AGPL-3.0 | Self-hosted email campaigns and transactional email service. **Architecture-only reference; no code copied.** |
| [Coolify](https://github.com/coollabsio/coolify) | Apache-2.0 | Monitoring dashboard, scheduled jobs, backups, server metrics. |
| [cvsloane/infra-dashboard](https://github.com/cvsloane/infra-dashboard) | MIT | Unified system/queue/database/server metrics dashboard. |

### License safety rule

- **MIT / Apache-2.0 / BSD / FCL-1.0-MIT:** Code may be referenced and, where
  permitted, reused with proper attribution.
- **AGPL-3.0 / GPL:** Because VietSalePro is proprietary, these projects are
  only consulted for **ideas, flow and architecture**. We do **not** copy,
  modify or redistribute their code.

---

## 4. Fonts and typography

The application loads web fonts from Google Fonts. These fonts are licensed
under the **SIL Open Font License (OFL) 1.1**.

| Font | License | Source | Usage |
|------|---------|--------|-------|
| Be Vietnam Pro | SIL OFL 1.1 | https://fonts.google.com/specimen/Be+Vietnam+Pro | Primary Vietnamese UI typeface. |
| Inter | SIL OFL 1.1 | https://fonts.google.com/specimen/Inter | Fallback / secondary Latin typeface. |

Font files are served from `https://fonts.googleapis.com` and
`https://fonts.gstatic.com` at runtime. The fonts themselves remain the property
of their respective designers and are used under the OFL.

---

## 5. Platform / infrastructure services

VietSalePro depends on the following services and open-source platforms. This
section documents the relationship for completeness.

| Service / platform | Open-source license(s) of core components | Role in VietSalePro |
|--------------------|-------------------------------------------|---------------------|
| **Supabase** | Supabase client and tooling are MIT/Apache-2.0; PostgreSQL uses the PostgreSQL License. | Backend-as-a-service: PostgreSQL database, Auth, Realtime, Storage, Edge Functions. |
| **Vercel** | Vercel platform is a service; related open tooling (Next.js, etc.) is MIT. | Hosting and deployment platform for the frontend. |
| **GitHub** | Proprietary service for source control; Git itself is GPL-2.0. | Source code repository and version control. |

---

## 6. Compliance checklist

- [x] All runtime dependencies are listed with license, source and version.
- [x] All development dependencies are listed with license, source and version.
- [x] AGPL/GPL projects used as references are explicitly marked as
      architecture-only; no code copied.
- [x] Proprietary project license (`LICENSE.md`, `NOTICE.md`) is unchanged and
      clearly states VietSalePro is not open source.
- [x] Font licenses (SIL OFL 1.1) are documented.
- [x] No source code from copyleft projects has been committed to this
      repository.

---

## 7. Maintenance notes

- **When adding a new dependency:** Update the tables with package name,
  declared range, installed version, license, source and usage.
- **When referencing a new open-source repo:** Verify its license directly on the
  repository before using it as a reference. AGPL/GPL projects must remain
  architecture-only.
- **Before each release:** run `npm ls --depth=0` and compare the installed
  versions against this document. It is normal for patch/minor versions to
  differ from the declared ranges in `package.json`.

---

> Last updated: 2026-07-13
>
> Author / maintainer: Devin AI Assistant on behalf of VietSalePro team.
>
> For licensing questions, contact the project owner listed in `LICENSE.md`.
