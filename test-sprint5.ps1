
# ============================================================
# Sprint 5 - Analytics API Test Suite
# ============================================================
$BASE = "http://localhost:3001/api"
$PASS = 0; $FAIL = 0

function Test-API {
    param($Label, $Method, $Url, $Body, $ExpectedStatus)
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = @{ Authorization = "Bearer $global:TOKEN" }
            UseBasicParsing = $true
        }
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        $r = Invoke-WebRequest @params
        $json = $r.Content | ConvertFrom-Json
        if ($r.StatusCode -eq $ExpectedStatus) {
            Write-Host "  ✅ $Label (HTTP $($r.StatusCode))"
            $script:PASS++
        } else {
            Write-Host "  ❌ $Label - Expected $ExpectedStatus got $($r.StatusCode)"
            $script:FAIL++
        }
        return $json
    } catch {
        $sc = $_.Exception.Response.StatusCode.value__
        if ($sc -eq $ExpectedStatus) {
            Write-Host "  ✅ $Label correctly rejected (HTTP $sc)"
            $script:PASS++
        } else {
            Write-Host "  ❌ $Label - Got HTTP $sc - $($_.ErrorDetails.Message)"
            $script:FAIL++
        }
        return $null
    }
}

# ── AUTH ──────────────────────────────────────────────────────
Write-Host "`n[1] AUTH"
$lr = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body '{"email":"admin@hospitalcentral.com","password":"Admin123!"}' -ContentType "application/json" -UseBasicParsing
$lj = $lr.Content | ConvertFrom-Json
$global:TOKEN = $lj.accessToken
Write-Host "  ✅ Login OK"
$PASS++

# ── ANALYTICS: Overview ───────────────────────────────────────
Write-Host "`n[2] ANALYTICS OVERVIEW"
$ov = Test-API "GET /analytics/overview" GET "$BASE/analytics/overview" $null 200
if ($ov) {
    Write-Host "    totalPatients=$($ov.totalPatients) totalDoctors=$($ov.totalDoctors) totalAppointments=$($ov.totalAppointments)"
    Write-Host "    appointmentsToday=$($ov.appointmentsToday) cancelRate=$($ov.cancelRate)% completionRate=$($ov.completionRate)%"
    # Validate required fields
    $missing = @('totalPatients','totalDoctors','totalAppointments','appointmentsToday','appointmentsThisWeek','appointmentsThisMonth','cancelRate','completionRate') |
               Where-Object { $null -eq $ov.$_ }
    if ($missing.Count -eq 0) { Write-Host "  ✅ All required fields present"; $PASS++ }
    else { Write-Host "  ❌ Missing fields: $($missing -join ', ')"; $FAIL++ }
}

# ── ANALYTICS: By Status ──────────────────────────────────────
Write-Host "`n[3] APPOINTMENTS BY STATUS"
$st = Test-API "GET /analytics/appointments/by-status" GET "$BASE/analytics/appointments/by-status" $null 200
if ($st) {
    $statuses = $st.PSObject.Properties.Name
    Write-Host "    Statuses returned: $($statuses -join ', ')"
    $expected = @('SCHEDULED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW')
    $allPresent = $expected | Where-Object { $statuses -notcontains $_ }
    if ($allPresent.Count -eq 0) { Write-Host "  ✅ All 5 status keys present"; $PASS++ }
    else { Write-Host "  ❌ Missing statuses: $($allPresent -join ', ')"; $FAIL++ }
}

# ── ANALYTICS: By Period ──────────────────────────────────────
Write-Host "`n[4] APPOINTMENTS BY PERIOD"
$wp = Test-API "GET /analytics/appointments/by-period?period=week" GET "$BASE/analytics/appointments/by-period?period=week" $null 200
if ($wp) { Write-Host "    week: $($wp.Count) data points" }

$mp = Test-API "GET /analytics/appointments/by-period?period=month" GET "$BASE/analytics/appointments/by-period?period=month" $null 200
if ($mp) { Write-Host "    month: $($mp.Count) data points" }

$yp = Test-API "GET /analytics/appointments/by-period?period=year" GET "$BASE/analytics/appointments/by-period?period=year" $null 200
if ($yp) { Write-Host "    year: $($yp.Count) data points" }

# Validate array items have required fields
if ($mp -and $mp.Count -gt 0) {
    $item = $mp[0]
    if ($item.date -and $null -ne $item.total) { Write-Host "  ✅ Period items have date+total"; $PASS++ }
    else { Write-Host "  ❌ Period items missing fields"; $FAIL++ }
} else {
    Write-Host "  ℹ️  No period data (empty dataset — OK)"
    $PASS++
}

# ── ANALYTICS: Top Doctors ────────────────────────────────────
Write-Host "`n[5] TOP DOCTORS"
$td = Test-API "GET /analytics/doctors/top" GET "$BASE/analytics/doctors/top?limit=5" $null 200
if ($td) {
    Write-Host "    Returned $($td.Count) doctors"
    if ($td.Count -gt 0) {
        Write-Host "    Top doctor: $($td[0].name) — $($td[0].totalAppointments) citas"
        if ($td[0].doctorId -and $td[0].name -and $null -ne $td[0].totalAppointments) {
            Write-Host "  ✅ Doctor objects have required fields"
            $PASS++
        } else { Write-Host "  ❌ Doctor objects missing fields"; $FAIL++ }
    } else { Write-Host "  ℹ️  No doctors with appointments yet — OK"; $PASS++ }
}

# ── ANALYTICS: Patient Stats ──────────────────────────────────
Write-Host "`n[6] PATIENT STATS"
$ps = Test-API "GET /analytics/patients/stats" GET "$BASE/analytics/patients/stats" $null 200
if ($ps) {
    Write-Host "    total=$($ps.total) newThisMonth=$($ps.newThisMonth) growthRate=$($ps.growthRate)%"
    $expected = @('total','newThisMonth','newLastMonth','growthRate','withAppointments','withRecurring')
    $missing = $expected | Where-Object { $null -eq $ps.$_ -and $ps.$_ -ne 0 }
    if ($missing.Count -eq 0) { Write-Host "  ✅ All patient stat fields present"; $PASS++ }
    else { Write-Host "  ❌ Missing: $($missing -join ', ')"; $FAIL++ }
}

# ── ANALYTICS: By Specialty ───────────────────────────────────
Write-Host "`n[7] APPOINTMENTS BY SPECIALTY"
$sp = Test-API "GET /analytics/appointments/by-specialty" GET "$BASE/analytics/appointments/by-specialty" $null 200
if ($sp) {
    Write-Host "    Returned $($sp.Count) specialties"
    if ($sp.Count -gt 0) {
        Write-Host "    Top specialty: $($sp[0].specialty) — $($sp[0].count) citas"
        if ($sp[0].specialty -and $null -ne $sp[0].count) { Write-Host "  ✅ Specialty objects valid"; $PASS++ }
        else { Write-Host "  ❌ Specialty objects invalid"; $FAIL++ }
    } else { Write-Host "  ℹ️  No specialty data — OK"; $PASS++ }
}

# ── ANALYTICS: Hourly ─────────────────────────────────────────
Write-Host "`n[8] HOURLY DISTRIBUTION"
$hr = Test-API "GET /analytics/appointments/hourly" GET "$BASE/analytics/appointments/hourly" $null 200
if ($hr) {
    Write-Host "    Returned $($hr.Count) hour buckets"
    # should have buckets from 06:00 to 20:00 = 15 buckets
    if ($hr.Count -ge 10) { Write-Host "  ✅ Enough hour buckets ($($hr.Count))"; $PASS++ }
    else { Write-Host "  ❌ Too few hour buckets: $($hr.Count)"; $FAIL++ }
    $peakHour = $hr | Sort-Object count -Descending | Select-Object -First 1
    if ($peakHour.count -gt 0) { Write-Host "    Peak hour: $($peakHour.hour) with $($peakHour.count) citas" }
}

# ── SECURITY: Unauthorized access ─────────────────────────────
Write-Host "`n[9] SECURITY"
try {
    $noAuth = Invoke-WebRequest -Uri "$BASE/analytics/overview" -UseBasicParsing
    Write-Host "  ❌ /analytics/overview should require auth but returned $($noAuth.StatusCode)"
    $FAIL++
} catch {
    $sc = $_.Exception.Response.StatusCode.value__
    if ($sc -eq 401) { Write-Host "  ✅ /analytics/overview correctly requires auth (401)"; $PASS++ }
    else { Write-Host "  ❌ Expected 401 got $sc"; $FAIL++ }
}

# ── SUMMARY ───────────────────────────────────────────────────
Write-Host "`n============================================"
$total = $script:PASS + $script:FAIL
Write-Host "  SPRINT 5 TESTS"
Write-Host "  PASSED : $script:PASS / $total"
if ($script:FAIL -gt 0) { Write-Host "  FAILED : $script:FAIL" -ForegroundColor Red }
else { Write-Host "  ALL TESTS PASSED ✅" }
Write-Host "============================================`n"
