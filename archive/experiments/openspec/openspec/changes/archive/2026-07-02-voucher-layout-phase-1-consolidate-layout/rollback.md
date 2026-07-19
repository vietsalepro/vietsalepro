# Rollback: Phase 1 — Củng cố `VoucherFormLayout`

## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_layout_phase1_$(Get-Date -Format yyyyMMdd_HHmmss)" -Recurse
```

## Files to Restore

- `components/VoucherFormLayout.tsx`
- `components/VoucherFormLayout.css`

## Rollback Steps

1. Stop the dev server if running.
2. Copy the backup versions of the two files above into the project:
   ```powershell
   Copy-Item -Path "<backup_path>\components\VoucherFormLayout.tsx" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\components\VoucherFormLayout.tsx" -Force
   Copy-Item -Path "<backup_path>\components\VoucherFormLayout.css" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7\components\VoucherFormLayout.css" -Force
   ```
3. Run `npm run lint` to confirm no syntax errors.
4. Run `npm run build` to confirm the build passes.
5. Re-open the four voucher screens in the browser to verify the pre-Phase 1 layout.

## When to Rollback

- Visual regression on any voucher screen (banner area, header spacing, or main/sidebar ratio).
- `npm run lint` or `npm run build` fails and cannot be fixed quickly.
- Banner prop causes TypeScript errors in downstream pages.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] `VoucherFormLayout` renders without `banner` element on pages that omit it
- [ ] Desktop layout shows main ~70% and sidebar ~30%
- [ ] Mobile layout stacks vertically without overflow
