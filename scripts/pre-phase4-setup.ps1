#Requires -Version 5.1
<#
.SYNOPSIS
  Pre-Phase 4 setup: push migrations and verify tables.

.EXAMPLE
  $env:SUPABASE_DB_PASSWORD = "your-db-password"
  .\scripts\pre-phase4-setup.ps1 -PushMigrations -VerifyTables

.EXAMPLE
  .\scripts\pre-phase4-setup.ps1 -VerifyAll
#>

param(
  [switch]$PushMigrations,
  [switch]$VerifyTables,
  [switch]$VerifyAll
)

$ErrorActionPreference = "Stop"
$ProjectRef = "qwbjfedzstyfhqlbsila"
$PublishableKey = $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
$DbHost = "db.$ProjectRef.supabase.co"

if (-not $PublishableKey) {
  $envFile = Join-Path $PSScriptRoot ".." ".env.local"
  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      if ($_ -match '^NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=(.+)$') {
        $PublishableKey = $Matches[1].Trim()
      }
    }
  }
}

$ExpectedTables = @(
  "projects",
  "experience",
  "content",
  "skills",
  "education",
  "settings",
  "resumes",
  "contact_submissions"
)

function Get-DatabaseUrl {
  $password = $env:SUPABASE_DB_PASSWORD
  if (-not $password) {
    throw "Set SUPABASE_DB_PASSWORD (from Supabase Dashboard → Settings → Database)."
  }
  $encoded = [uri]::EscapeDataString($password)
  return "postgresql://postgres:${encoded}@${DbHost}:5432/postgres"
}

function Push-Migrations {
  Write-Host "`n=== Pushing migrations to $ProjectRef ===" -ForegroundColor Cyan
  $dbUrl = Get-DatabaseUrl
  Push-Location (Join-Path $PSScriptRoot "..")
  try {
    npx supabase db push --db-url $dbUrl --yes 2>&1 | Write-Host
    if ($LASTEXITCODE -ne 0) { throw "supabase db push failed (exit $LASTEXITCODE)" }
    Write-Host "Migrations pushed successfully." -ForegroundColor Green
  }
  finally {
    Pop-Location
  }
}

function Test-TablesExist {
  Write-Host "`n=== Verifying tables via REST API ===" -ForegroundColor Cyan
  if (-not $PublishableKey) {
    throw "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY not found in env or .env.local"
  }

  $headers = @{
    apikey         = $PublishableKey
    Authorization  = "Bearer $PublishableKey"
  }
  $baseUrl = "https://$ProjectRef.supabase.co/rest/v1"
  $results = @()

  foreach ($table in $ExpectedTables) {
    try {
      $null = Invoke-RestMethod -Uri "$baseUrl/${table}?select=count&limit=0" -Headers $headers -Method Head -ErrorAction Stop
      $results += [PSCustomObject]@{ Table = $table; Status = "OK" }
      Write-Host "  [OK] $table" -ForegroundColor Green
    }
    catch {
      $status = $_.Exception.Response.StatusCode.value__
      $results += [PSCustomObject]@{ Table = $table; Status = "MISSING ($status)" }
      Write-Host "  [MISSING] $table ($status)" -ForegroundColor Red
    }
  }

  return $results
}

function Get-EnvFileValue {
  param(
    [string]$Key,
    [string[]]$EnvFilePaths = @(
      (Join-Path $PSScriptRoot ".." ".env.local"),
      (Join-Path $PSScriptRoot ".." ".env")
    )
  )

  foreach ($EnvFilePath in $EnvFilePaths) {
    if (-not (Test-Path $EnvFilePath)) { continue }

    foreach ($line in Get-Content $EnvFilePath) {
      $trimmed = $line.Trim()
      if (-not $trimmed -or $trimmed.StartsWith("#")) { continue }
      if (-not $trimmed.StartsWith("${Key}=")) { continue }

      $raw = $trimmed.Substring($Key.Length + 1).Trim()

      if ($raw.StartsWith('"') -and $raw.EndsWith('"')) {
        return $raw.Substring(1, $raw.Length - 2)
      }

      if ($raw.StartsWith("'") -and $raw.EndsWith("'")) {
        return $raw.Substring(1, $raw.Length - 2)
      }

      return $raw
    }
  }

  return $null
}

function Test-AdminEnv {
  Write-Host "`n=== Verifying admin auth env ===" -ForegroundColor Cyan
  $adminEmail = $env:ADMIN_EMAIL
  if (-not $adminEmail) { $adminEmail = Get-EnvFileValue -Key "ADMIN_EMAIL" }

  if ($adminEmail) {
    Write-Host "  [OK] ADMIN_EMAIL configured" -ForegroundColor Green
    return $true
  }

  Write-Host "  [FAIL] ADMIN_EMAIL not set in .env or .env.local" -ForegroundColor Red
  return $false
}

if ($VerifyAll) {
  $PushMigrations = $true
  $VerifyTables = $true
}

if ($PushMigrations) { Push-Migrations }
if ($VerifyTables) {
  $tableResults = Test-TablesExist
  $missing = $tableResults | Where-Object { $_.Status -notlike "OK*" }
  if ($missing) {
    Write-Host "`nSome tables are missing. Run -PushMigrations first." -ForegroundColor Red
    exit 1
  }
}

if ($VerifyAll) {
  $tableResults = Test-TablesExist
  $missing = $tableResults | Where-Object { $_.Status -notlike "OK*" }
  $adminOk = Test-AdminEnv

  if ($missing -or -not $adminOk) {
    Write-Host "`nNot ready for Phase 4. Complete missing steps in docs/pre-phase4-setup.md" -ForegroundColor Red
    exit 1
  }

  Write-Host "`n=== Ready for Phase 4 ===" -ForegroundColor Green
  Write-Host "Create the admin user in Supabase Dashboard → Authentication → Users" -ForegroundColor Cyan
  Write-Host "Then sign in at http://localhost:3000/admin/login" -ForegroundColor Cyan
}
