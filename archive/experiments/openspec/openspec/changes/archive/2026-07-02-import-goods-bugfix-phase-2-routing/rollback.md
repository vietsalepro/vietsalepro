## Backup Command

Run this **before** starting the phase:

```powershell
Copy-Item -Path "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7" -Destination "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7_backup_import_goods_bugfix_phase_2_<YYYYMMDD_HHMMSS>" -Recurse
```

## Files to Restore

| File | Restore from backup if |
|------|------------------------|
| `App.tsx` | Route conflict or broken navigation appears |
| `pages/ImportGoods.tsx` | Tab state is wrong after URL change or save/cancel misbehaves |
| `components/AppTopbar.tsx` | Menu highlight is wrong or other routes are affected |
| Mobile menu component | Mobile menu highlight is wrong |

## Rollback Steps

1. Stop the dev server / build.
2. Restore the project folder from the backup above, or copy the individual files listed above.
3. Run `npm run lint` to confirm no syntax errors.
4. Run `npm run build` to confirm the project builds.
5. Run the manual test flow that passed before the phase started.

## When to Rollback

- `npm run lint` fails and cannot be fixed within the phase.
- `npm run build` fails after code changes.
- `/import/create` does not render the create form.
- `/import` no longer renders history after the change.
- Browser refresh on either URL lands on the wrong tab.
- Menu highlight is broken for unrelated routes.

## Post-Rollback Verification

- [ ] `npm run lint` pass
- [ ] `npm run build` pass
- [ ] Manual test of one affected flow pass
