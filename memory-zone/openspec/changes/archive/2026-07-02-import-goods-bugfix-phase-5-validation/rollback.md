## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_5_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

| File | Restore from backup if |
|------|------------------------|
| `App.tsx` | Validation breaks save/complete or rejects valid data |
| `pages/ImportGoods.tsx` | Receipt code generation uses wrong date |
| `services/supabaseService.ts` | New duplicate-check helpers break other flows |

## Rollback Steps

1. Stop the dev server / build.
2. Restore the project folder from the backup above, or copy the individual files listed above.
3. Run `npm run lint` to confirm no syntax errors.
4. Run `npm run build` to confirm the project builds.
5. Run the manual test flow that passed before the phase started.

## When to Rollback

- `npm run lint` fails and cannot be fixed within the phase.
- `npm run build` fails after code changes.
- Valid receipt is rejected.
- Invalid receipt is accepted.
- Receipt code is generated with the wrong date.
- Duplicate-check queries cause unacceptable latency.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test of save/complete flow pass
- [ ] Manual test of receipt code generation pass
