# Splice script: replace functions in SSOT files with new versions from migration_phase7c
# Uses proper UTF-8 encoding (no BOM) to preserve Vietnamese characters.

$ErrorActionPreference = 'Stop'
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Read-Utf8($path) {
    return [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
}

function Write-Utf8($path, $content) {
    [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
}

# Split text into lines, preserving line endings info
function Get-Lines($text) {
    # Detect line ending
    if ($text -match "`r`n") {
        return ,@{ Lines = $text -split "`r`n"; Eol = "`r`n" }
    } elseif ($text -match "`n") {
        return ,@{ Lines = $text -split "`n"; Eol = "`n" }
    } else {
        return ,@{ Lines = @($text); Eol = "`n" }
    }
}

# Extract a function body (from "CREATE OR REPLACE FUNCTION" to the last "$$;") from a text block
function Extract-Function($text) {
    $lines = $text -split "`r?`n"
    $start = -1
    $end = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^CREATE OR REPLACE FUNCTION') {
            $start = $i
            break
        }
    }
    if ($start -lt 0) { throw "No CREATE OR REPLACE FUNCTION found" }
    # Find the LAST $$; in the block
    for ($i = $lines.Count - 1; $i -ge 0; $i--) {
        if ($lines[$i] -match '^\$\$;') {
            $end = $i
            break
        }
    }
    if ($end -lt 0) { throw "No closing $$; found" }
    return ($lines[$start..$end] -join "`n")
}

# Extract a line range (1-based, inclusive) from text
function Extract-Lines($text, $startLine, $endLine) {
    $lines = $text -split "`r?`n"
    # 1-based to 0-based
    $s = $startLine - 1
    $e = $endLine - 1
    if ($s -lt 0) { $s = 0 }
    if ($e -ge $lines.Count) { $e = $lines.Count - 1 }
    return ($lines[$s..$e] -join "`n")
}

# Find function boundaries (1-based line numbers) in a text
function Find-Function-Bounds($text, $funcSignature) {
    $lines = $text -split "`r?`n"
    $start = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match $funcSignature) {
            $start = $i
            break
        }
    }
    if ($start -lt 0) { throw "Function not found: $funcSignature" }
    $end = -1
    for ($i = $start + 1; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^\$\$;') {
            $end = $i
            # Don't break - we want the first $$; after the function start
            break
        }
    }
    if ($end -lt 0) { throw "Closing $$; not found for: $funcSignature" }
    return @{ Start = $start + 1; End = $end + 1 }  # 1-based
}

# Read the migration file
$migPath = "supabase/migration_phase7c_stock_ledger_complete.sql"
$migText = Read-Utf8 $migPath

# Extract sections from migration (1-based line ranges from grep)
$sec1 = Extract-Lines $migText 122 350   # process_import_v2 (header + function)
$sec2 = Extract-Lines $migText 353 525   # delete_import_v2
$sec3 = Extract-Lines $migText 529 550   # update_import_v2
$sec4 = Extract-Lines $migText 554 883   # create_return_order
$sec5 = Extract-Lines $migText 887 1041  # cancel_return_order_v2
$sec6 = Extract-Lines $migText 1045 1548 # create_exchange_transaction
$sec7 = Extract-Lines $migText 1552 1656 # complete_disposal
$sec8 = Extract-Lines $migText 1660 1723 # delete_disposal_with_restore
$sec9 = Extract-Lines $migText 1727 1803 # get_stock_ledger
$sec10 = Extract-Lines $migText 1807 1839 # get_stock_balance

# Extract just the function bodies
$fn1 = Extract-Function $sec1
$fn2 = Extract-Function $sec2
$fn3 = Extract-Function $sec3
$fn4 = Extract-Function $sec4
$fn5 = Extract-Function $sec5
$fn6 = Extract-Function $sec6
$fn7 = Extract-Function $sec7
$fn8 = Extract-Function $sec8
$fn9 = Extract-Function $sec9
$fn10 = Extract-Function $sec10

Write-Output "Extracted function bodies. Lengths: f1=$($fn1.Length) f2=$($fn2.Length) f3=$($fn3.Length) f4=$($fn4.Length) f5=$($fn5.Length) f6=$($fn6.Length) f7=$($fn7.Length) f8=$($fn8.Length) f9=$($fn9.Length) f10=$($fn10.Length)"

# ---- SSOT 1: supabase_migration_import_goods_v2.sql ----
Write-Output "`n=== Processing supabase_migration_import_goods_v2.sql ==="
$ssot1Path = "supabase_migration_import_goods_v2.sql"
$ssot1 = Read-Utf8 $ssot1Path
$lines1 = $ssot1 -split "`r?`n"
$b1 = Find-Function-Bounds $ssot1 'CREATE OR REPLACE FUNCTION process_import_v2'
$b2 = Find-Function-Bounds $ssot1 'CREATE OR REPLACE FUNCTION delete_import_v2'
$b3 = Find-Function-Bounds $ssot1 'CREATE OR REPLACE FUNCTION update_import_v2'
Write-Output "Old bounds: process=$($b1.Start)-$($b1.End) delete=$($b2.Start)-$($b2.End) update=$($b3.Start)-$($b3.End)"

# Build new content:
# [0 .. b1.Start-1] (before process_import_v2, 0-based up to start-2)
# fn1
# [b1.End .. b2.Start-2] (between process end and delete start, 0-based: b1.End to b2.Start-2)
# fn2
# [b2.End .. b3.Start-2] (between delete end and update start)
# fn3
# [b3.End .. end] (after update)
$parts = @()
$parts += $lines1[0..($b1.Start - 2)]
$parts += $fn1
$parts += $lines1[($b1.End)..($b2.Start - 2)]
$parts += $fn2
$parts += $lines1[($b2.End)..($b3.Start - 2)]
$parts += $fn3
$parts += $lines1[($b3.End)..($lines1.Count - 1)]
$new1 = $parts -join "`n"
Write-Utf8 $ssot1Path $new1
Write-Output "Written. Old lines: $($lines1.Count)"

# Verify
$check1 = Read-Utf8 $ssot1Path
$checkLines1 = $check1 -split "`r?`n"
Write-Output "New lines: $($checkLines1.Count)"
$hasMojibake = $check1 -match 'Ã|Â'
Write-Output "Has mojibake: $hasMojibake"
$hasLedger = $check1 -match 'insert_stock_ledger_entry'
Write-Output "Has insert_stock_ledger_entry: $hasLedger"
