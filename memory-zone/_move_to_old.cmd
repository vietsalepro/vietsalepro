@echo off
chcp 65001 >nul
set "ROOT=C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7"
set "DEST=%ROOT%\OLD"

set "DIRS=.codebase-memory .temp archive disposal-form docs frappe_docker KE_HOACH Master-design openspec screenshots scripts test-results"
set "FILES=AGENTS.md BAN_DO_NGHIEP_VU_VietSale_ERPNext.md create_returnorders.cjs generate_docx.cjs gen_returns.cjs make_returns.cjs transform_returnorders.cjs login.png screenshot_import_date.png metadata.json"

for %%D in (%DIRS%) do (
  if exist "%ROOT%\%%D\" (
    move /Y "%ROOT%\%%D" "%DEST%\" >nul
    echo MOVED DIR: %%D
  ) else if exist "%ROOT%\%%D" (
    echo NOT DIR: %%D
  ) else (
    echo MISSING DIR: %%D
  )
)

for %%F in (%FILES%) do (
  if exist "%ROOT%\%%F" (
    move /Y "%ROOT%\%%F" "%DEST%\" >nul
    echo MOVED FILE: %%F
  ) else (
    echo MISSING FILE: %%F
  )
)

echo Done.
