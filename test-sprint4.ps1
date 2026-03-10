
# ============================================================
# Sprint 4 - Full API Test Suite
# ============================================================
$BASE = "http://localhost:3001/api"
$PASS = 0; $FAIL = 0

function Test-API {
    param($Label, $Method, $Url, $Body, $ExpectedStatus, $ExtractVar)
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
        $status = $r.StatusCode
        $json = $r.Content | ConvertFrom-Json
        if ($status -eq $ExpectedStatus) {
            Write-Host "  ✅ $Label (HTTP $status)"
            $script:PASS++
            if ($ExtractVar) { Set-Variable -Name $ExtractVar -Value $json -Scope Global }
        } else {
            Write-Host "  ❌ $Label - Expected $ExpectedStatus got $status"
            $script:FAIL++
        }
        return $json
    } catch {
        $errBody = $_.ErrorDetails.Message
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "  ✅ $Label correctly rejected (HTTP $statusCode)"
            $script:PASS++
        } else {
            Write-Host "  ❌ $Label - Got HTTP $statusCode - $errBody"
            $script:FAIL++
        }
        return $null
    }
}

# ── Auth ──────────────────────────────────────────────────────
Write-Host "`n[1] AUTH"
$loginR = Invoke-WebRequest -Uri "$BASE/auth/login" -Method POST -Body '{"email":"admin@hospitalcentral.com","password":"Admin123!"}' -ContentType "application/json" -UseBasicParsing
$loginJson = $loginR.Content | ConvertFrom-Json
$global:TOKEN = $loginJson.accessToken
$global:INST_ID = $loginJson.user.institutionId
Write-Host "  ✅ Login OK | InstitutionId: $global:INST_ID"
$PASS++

# ── Get Doctor & Patient IDs ────────────────────────────────
Write-Host "`n[2] GET IDs"
$usersR = Invoke-WebRequest -Uri "$BASE/users?limit=20" -Headers @{ Authorization = "Bearer $global:TOKEN" } -UseBasicParsing
$allUsers = ($usersR.Content | ConvertFrom-Json).users
$doctor = ($allUsers | Where-Object { $_.role -eq "DOCTOR" })[0]
$global:DOCTOR_ID = $doctor.id
Write-Host "  ✅ Doctor: $($doctor.firstName) $($doctor.lastName) | ID: $global:DOCTOR_ID"
$PASS++

$patsR = Invoke-WebRequest -Uri "$BASE/patients?limit=3" -Headers @{ Authorization = "Bearer $global:TOKEN" } -UseBasicParsing
$global:PATIENT_ID = ($patsR.Content | ConvertFrom-Json).patients[0].id
Write-Host "  ✅ Patient ID: $global:PATIENT_ID"
$PASS++

# ── AVAILABILITY: Schedule CRUD ────────────────────────────
Write-Host "`n[3] SCHEDULE CRUD"

# Create schedule Monday (1) 08:00-16:00
$schedBody = @{ doctorId = $global:DOCTOR_ID; dayOfWeek = 1; startTime = "08:00"; endTime = "16:00"; slotDuration = 30; institutionId = $global:INST_ID }
$schedR = Test-API "POST /schedule (Monday 08:00-16:00)" POST "$BASE/availability/schedule" $schedBody 201
$global:SCHED_ID = $schedR.id
Write-Host "    Schedule ID: $global:SCHED_ID"

# Create schedule Wednesday (3) 09:00-13:00
$schedBody2 = @{ doctorId = $global:DOCTOR_ID; dayOfWeek = 3; startTime = "09:00"; endTime = "13:00"; slotDuration = 30; institutionId = $global:INST_ID }
Test-API "POST /schedule (Wednesday 09:00-13:00)" POST "$BASE/availability/schedule" $schedBody2 201 | Out-Null

# GET schedules for doctor
$schedGetR = Test-API "GET /schedule/:doctorId" GET "$BASE/availability/schedule/$global:DOCTOR_ID" $null 200
Write-Host "    Returned $($schedGetR.Count) schedules"

# ── AVAILABILITY: Time Block CRUD ──────────────────────────
Write-Host "`n[4] TIME BLOCK CRUD"
# Next Monday in 2026
$nextMonday = "2026-03-09"
$blockBody = @{ doctorId = $global:DOCTOR_ID; date = $nextMonday; startTime = "10:00"; endTime = "11:00"; reason = "Reunion de equipo"; institutionId = $global:INST_ID }
$blockR = Test-API "POST /block (Mon 10:00-11:00)" POST "$BASE/availability/block" $blockBody 201
$global:BLOCK_ID = $blockR.id
Write-Host "    Block ID: $global:BLOCK_ID"

$blockGetR = Test-API "GET /block/:doctorId" GET "$BASE/availability/block/$global:DOCTOR_ID" $null 200
Write-Host "    Returned $($blockGetR.Count) blocks"

# ── AVAILABILITY: Slots ─────────────────────────────────────
Write-Host "`n[5] SLOT GENERATION"
$slotR = Test-API "GET /slots/:doctorId?date=2026-03-09" GET "$BASE/availability/slots/$global:DOCTOR_ID`?date=2026-03-09&institutionId=$global:INST_ID" $null 200
if ($slotR) {
    Write-Host "    hasSchedule: $($slotR.hasSchedule)"
    Write-Host "    Summary: total=$($slotR.summary.total) free=$($slotR.summary.free) booked=$($slotR.summary.booked) blocked=$($slotR.summary.blocked)"
    if ($slotR.slots -and $slotR.slots.Count -gt 0) {
        Write-Host "    First slot: $($slotR.slots[0].time)-$($slotR.slots[0].endTime) [$($slotR.slots[0].status)]"
        # Find a FREE slot for appointment test (field is 'time', not 'startTime')
        $global:FREE_SLOT = $slotR.slots | Where-Object { $_.status -eq "FREE" } | Select-Object -First 1
        Write-Host "    FREE slot for test: $($global:FREE_SLOT.time)-$($global:FREE_SLOT.endTime)"
    }
}

# Date with no schedule (Saturday=6)
$slotR2 = Test-API "GET /slots no schedule (Saturday)" GET "$BASE/availability/slots/$global:DOCTOR_ID`?date=2026-03-07&institutionId=$global:INST_ID" $null 200
if ($slotR2) { Write-Host "    Saturday hasSchedule: $($slotR2.hasSchedule) (expected false)" }

# ── AVAILABILITY: Recurring ────────────────────────────────
Write-Host "`n[6] RECURRING APPOINTMENTS"
$recurBody = @{
    patientId = $global:PATIENT_ID
    doctorId = $global:DOCTOR_ID
    dayOfWeek = 1
    startTime = "14:00"
    endTime = "14:30"
    frequency = "WEEKLY"
    reason = "Control semanal"
    startDate = "2026-03-09"
    endDate = "2026-03-30"
    institutionId = $global:INST_ID
}
$recurR = Test-API "POST /recurring (Weekly Mon 14:00)" POST "$BASE/availability/recurring" $recurBody 201
if ($recurR) { $global:RECURRING_ID = $recurR.recurring.id; Write-Host "    Recurring ID: $global:RECURRING_ID" }

$recurGetR = Test-API "GET /recurring/:doctorId" GET "$BASE/availability/recurring/$global:DOCTOR_ID" $null 200
if ($recurGetR) { Write-Host "    Returned $($recurGetR.Count) recurring records" }

# ── APPOINTMENTS: Validation ───────────────────────────────
Write-Host "`n[7] APPOINTMENT VALIDATION"

# Test A: Valid slot - should create (200/201)
if ($global:FREE_SLOT) {
    $apptBody = @{
        patientId = $global:PATIENT_ID
        doctorId = $global:DOCTOR_ID
        appointmentDate = "2026-03-09"
        startTime = $global:FREE_SLOT.time
        endTime = $global:FREE_SLOT.endTime
        reason = "Consulta de prueba"
        institutionId = $global:INST_ID
    }
    $apptR = Test-API "POST /appointments (valid FREE slot)" POST "$BASE/appointments" $apptBody 201
    if ($apptR) { $global:APPT_ID = $apptR.id; Write-Host "    Appointment ID: $global:APPT_ID" }
} else {
    Write-Host "  ⚠️  No FREE slot found - skipping valid appointment test"
}

# Test B: Outside schedule hours - should 400
$apptBodyBad = @{
    patientId = $global:PATIENT_ID
    doctorId = $global:DOCTOR_ID
    appointmentDate = "2026-03-09"
    startTime = "17:00"
    endTime = "17:30"
    reason = "Fuera de horario"
    institutionId = $global:INST_ID
}
Test-API "POST /appointments (outside schedule - expect 400)" POST "$BASE/appointments" $apptBodyBad 400 | Out-Null

# Test C: In blocked slot 10:00-11:00 - should 400
$apptBodyBlocked = @{
    patientId = $global:PATIENT_ID
    doctorId = $global:DOCTOR_ID
    appointmentDate = "2026-03-09"
    startTime = "10:00"
    endTime = "10:30"
    reason = "Horario bloqueado"
    institutionId = $global:INST_ID
}
Test-API "POST /appointments (blocked slot - expect 400)" POST "$BASE/appointments" $apptBodyBlocked 400 | Out-Null

# Test D: Double booking - same slot again - should 409
if ($global:FREE_SLOT -and $global:APPT_ID) {
    Test-API "POST /appointments (double booking - expect 409)" POST "$BASE/appointments" $apptBody 409 | Out-Null
}

# ── DELETE Cleanup ──────────────────────────────────────────
Write-Host "`n[8] CLEANUP"
if ($global:RECURRING_ID) { Test-API "DELETE /recurring/:id" DELETE "$BASE/availability/recurring/$global:RECURRING_ID" $null 200 | Out-Null }
if ($global:BLOCK_ID) { Test-API "DELETE /block/:id" DELETE "$BASE/availability/block/$global:BLOCK_ID" $null 200 | Out-Null }
if ($global:SCHED_ID) { Test-API "DELETE /schedule/:id" DELETE "$BASE/availability/schedule/$global:SCHED_ID" $null 200 | Out-Null }

# ── SUMMARY ─────────────────────────────────────────────────
Write-Host "`n============================================"
$total = $script:PASS + $script:FAIL
Write-Host "  TESTS PASSED : $script:PASS / $total"
if ($script:FAIL -gt 0) { Write-Host "  TESTS FAILED : $script:FAIL" }
Write-Host "============================================`n"
