$ErrorActionPreference = "Stop"
$pgCtl = "C:\laragon\bin\postgresql\postgresql\bin\pg_ctl.exe"
$dataDir = "C:\laragon\data\tlc-admin-test"
$logFile = Join-Path $dataDir "postgres.log"
if (-not (Test-Path -LiteralPath $pgCtl)) { throw "Laragon PostgreSQL was not found at $pgCtl" }
if (-not (Test-Path -LiteralPath (Join-Path $dataDir "PG_VERSION"))) { throw "TLC Laragon data cluster is missing: $dataDir" }
& $pgCtl status -D $dataDir *> $null
if ($LASTEXITCODE -eq 0) { Write-Output "TLC PostgreSQL is already running on 127.0.0.1:5433"; exit 0 }
& $pgCtl start -D $dataDir -o "-h 127.0.0.1 -p 5433" -l $logFile -w
if ($LASTEXITCODE -ne 0) { throw "Could not start TLC PostgreSQL on port 5433" }
