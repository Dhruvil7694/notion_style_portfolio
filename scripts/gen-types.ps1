#Requires -Version 5.1
<#
.SYNOPSIS
  Generate src/types/database.ts from remote Supabase Postgres.

.NOTES
  supabase gen types --db-url requires Docker Desktop (runs postgres-meta in a container).
  --linked and --project-id require Management API access (may fail with privileges error).

.EXAMPLE
  # Prompts for password (handles @ and other special chars)
  .\scripts\gen-types.ps1

.EXAMPLE
  $env:SUPABASE_DB_PASSWORD = "your@password"
  .\scripts\gen-types.ps1
#>

$ErrorActionPreference = "Stop"
$ProjectRef = "qwbjfedzstyfhqlbsila"
$OutputPath = Join-Path $PSScriptRoot ".." "src" "types" "database.ts"

if (-not $env:SUPABASE_DB_PASSWORD) {
  $secure = Read-Host "Database password (Supabase Dashboard → Settings → Database)" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try {
    $env:SUPABASE_DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
  }
  finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

$encoded = [uri]::EscapeDataString($env:SUPABASE_DB_PASSWORD)
$dbUrl = "postgresql://postgres:${encoded}@db.${ProjectRef}.supabase.co:5432/postgres"

Write-Host "Generating types (requires Docker Desktop running)..." -ForegroundColor Cyan

Push-Location (Join-Path $PSScriptRoot "..")
try {
  $types = npx supabase gen types typescript --db-url $dbUrl --schema public 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host $types
    throw "Type generation failed. Is Docker Desktop running?"
  }

  $types | Out-File -FilePath $OutputPath -Encoding utf8
  Write-Host "Wrote $OutputPath" -ForegroundColor Green
  Write-Host "Convenience aliases live in src/types/database.helpers.ts (unchanged by regen)" -ForegroundColor Gray
  npm run typecheck
}
finally {
  Remove-Item Env:SUPABASE_DB_PASSWORD -ErrorAction SilentlyContinue
  Pop-Location
}
