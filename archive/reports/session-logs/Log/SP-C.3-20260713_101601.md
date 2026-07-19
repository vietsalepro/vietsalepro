# SP-C.3: Documentation of Open-Source References — Execution Log

## Metadata

| Field | Value |
|-------|-------|
| Sub-phase | SP-C.3 |
| Name | Documentation of open-source references |
| Branch | docs/SP-C.3-opensource-references |
| Started | 2026-07-13 10:16:01 |
| Completed | 2026-07-13 10:16:01 |
| Status | Completed |

## Scope

- Create `docs/opensource-references.md` documenting all third-party open-source
  packages, design references, fonts, and platform services used by
  VietSalePro.
- No production code changes.
- No database migrations.
- No Edge Functions.

## Backup

- Backup location: not required for documentation-only change.
- ponytail: this phase only adds a markdown doc; no destructive operation.

## Tasks performed

1. Read `PLAN_AdminDashboard_SubPhases.md` section SP-C.3.
2. Read `PLAN_AdminDashboard_OpenSource_Reference.md` to collect referenced
   open-source projects and their licenses.
3. Read `package.json`, `LICENSE.md`, `NOTICE.md`, `README.md`, `index.html`,
   `design-system-tokens.css`, `styles/typography-utilities.css`, `vite.config.ts`
   and `tsconfig.json` to identify actual dependencies and assets.
4. Ran `npm ls --depth=0 --json` to capture installed package versions.
5. Drafted `docs/opensource-references.md` with:
   - Runtime dependencies table (name, version, license, source, usage).
   - Development dependencies table.
   - Open-source projects referenced during design.
   - Fonts and typography attributions (Be Vietnam Pro, Inter — SIL OFL 1.1).
   - Platform/infrastructure services section.
   - Compliance checklist.
   - Maintenance notes.
6. Created this execution log.

## Artifacts

| Type | Path |
|------|------|
| Documentation | `docs/opensource-references.md` |
| Log | `Plan/Log/SP-C.3-20260713_101601.md` |

## Testing & Quality Gates

- `/systematic-debugging`: Not applicable (no code).
- `/test-driven-development`: Not applicable (no code).
- `/requesting-code-review`: Documentation review performed by independent reviewer.
  - `docx` license corrected from `Apache-2.0` to `MIT`.
  - `Coolify` license corrected to `Apache-2.0`.
  - `trentas/saas-scaffolding` license updated to `MIT` after verification.
  - `usebasejump/basejump-next` license updated to `MIT` after verification.
  - `Flipt` license corrected from `GPL` to `Fair Core License (FCL-1.0-MIT)`.
  - Dependency tables split into separate `Declared in package.json` and `Installed` columns to avoid ambiguity.

## Migration / Edge Function summary

- **No migrations** generated in this phase.
- **No Edge Functions** generated in this phase.

## Push status

- **Not pushed.** Phase completed locally on branch `docs/SP-C.3-opensource-references`.
- Suggested commit message: `docs(admin): SP-C.3 open-source reference documentation`.

## Notes

- The document explicitly marks AGPL/GPL projects as architecture-only references
  to protect the proprietary license of VietSalePro.
- Dependency versions captured from `npm ls --depth=0` reflect the currently
  installed tree. Minor version drift from `package.json` ranges is expected.
