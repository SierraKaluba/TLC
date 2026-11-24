$ErrorActionPreference = "Stop"
$pgCtl = "C:\laragon\bin\postgresql\postgresql\bin\pg_ctl.exe"
$dataDir = "C:\laragon\data\tlc-admin-test"
& $pgCtl stop -D $dataDir -m fast -w
if ($LASTEXITCODE -ne 0) { throw "Could not stop TLC PostgreSQL" }
