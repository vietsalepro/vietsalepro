:GIVEN: The user needs a rollback plan for the Voucher Form Component System implementation.

Write `rollback.md` for the OpenSpec change `voucher-form-component-system-plan-a`.

## Backup Command

Run this **before** starting the first sub-phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_plan_a_$(Get-Date -Format 'yyyyMMdd_HHmmss')" -Recurse
```

Run the same command before each major phase (1, 6, 7.1, 8.1, 9.1, 10.1) with an updated label:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_voucher_form_phase_<X>_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

| File | Restore from backup if |
|------|------------------------|
| Entire project folder | Any phase fails lint/build or manual test and cannot be fixed within 30 minutes |
| `pages/ImportGoods.tsx` + `.css` | ImportGoods rollout phase causes UI or business logic regression |
| `pages/InventoryCount.tsx` + `.css` + `CountFormLayout.tsx` | InventoryCount rollout phase causes regression |
| `pages/DisposalForm.tsx` + `pages/Disposals.css` | DisposalForm pilot phase causes regression |
| `pages/SupplierExchanges.tsx` + `.css` | SupplierExchanges rollout phase causes regression |
| `components/VoucherFormLayout.tsx` + `.css` | Foundation phase breaks layout in any page |
| `components/import-goods/*`, `components/disposal-form/*`, `components/inventory-count/*` | Dead code cleanup phase removes a still-needed file |

## Rollback Steps

1. Stop the dev server / build.
2. Identify the backup created immediately before the failing sub-phase.
3. Restore the entire project folder from that backup:
   ```powershell
   Remove-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Recurse -Force
   Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_<LABEL>" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Recurse
   ```
   > Do not cherry-pick individual files unless the failure is isolated to a single known file and the rest of the project is verified clean.
4. Run `npm run lint` to confirm no syntax errors.
5. Run `npm run build` to confirm the project builds.
6. Run the manual test flow that passed before the phase started.
7. Record the failure reason, affected files, and any decisions needed before retrying.

## When to Rollback

- `npm run lint` fails and cannot be fixed within the current sub-phase.
- `npm run build` fails after layout or component changes.
- Manual test of a voucher flow (create/import/disposal/exchange) fails and touches business logic.
- Visual regression shows unexpected layout breaks (overflow, missing padding, broken sticky header) that cannot be fixed quickly.
- Any data-loss risk or unintended Supabase/database interaction appears.
- A file required by another page is accidentally deleted during cleanup.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test of one affected flow pass
- [ ] No missing components from other pages (run `grep` for deleted component names)
- [ ] Baseline UI matches pre-rollback state
