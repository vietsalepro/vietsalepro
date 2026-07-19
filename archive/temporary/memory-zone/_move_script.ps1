$root = "C:\Users\SUACAUBA\Downloads\Project\vietsale-pro-v7"
$dest = Join-Path $root "OLD"

$dirs = @(
    ".codebase-memory",
    ".temp",
    "archive",
    "disposal-form",
    "docs",
    "frappe_docker",
    "KE_HOACH",
    "Master-design",
    "openspec",
    "screenshots",
    "scripts",
    "test-results"
)

$files = @(
    "AGENTS.md",
    "BAN_DO_NGHIEP_VU_VietSale_ERPNext.md",
    "create_returnorders.cjs",
    "generate_docx.cjs",
    "gen_returns.cjs",
    "make_returns.cjs",
    "transform_returnorders.cjs",
    "login.png",
    "screenshot_import_date.png",
    "metadata.json"
)

foreach ($d in $dirs) {
    $p = Join-Path $root $d
    if (Test-Path $p -PathType Container) {
        Move-Item -Path $p -Destination $dest -Force
        Write-Host "MOVED DIR: $d"
    } elseif (Test-Path $p) {
        Write-Host "NOT DIR: $d"
    } else {
        Write-Host "MISSING DIR: $d"
    }
}

foreach ($f in $files) {
    $p = Join-Path $root $f
    if (Test-Path $p -PathType Leaf) {
        Move-Item -Path $p -Destination $dest -Force
        Write-Host "MOVED FILE: $f"
    } else {
        Write-Host "MISSING FILE: $f"
    }
}

Write-Host "Done."
