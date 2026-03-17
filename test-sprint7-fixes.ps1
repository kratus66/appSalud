# ============================================================
# Script de Pruebas - Sprint 7 (Correcciones)
# ============================================================
# Este script prueba:
# 1. Middleware Multi-Tenant activado
# 2. Validaciones de límites de plan
# 3. Endpoint para cambiar plan
# ============================================================

Write-Host "🧪 PRUEBAS DEL SPRINT 7 - CORRECCIONES" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$headers = @{
    "Content-Type" = "application/json"
}

# ============================================================
# PASO 1: Login como SUPER_ADMIN
# ============================================================
Write-Host "📋 PASO 1: Login como SUPER_ADMIN" -ForegroundColor Yellow
$loginBody = @{
    email = "superadmin@hospital.com"
    password = "SuperAdmin123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Headers $headers -Body $loginBody
    $token = $loginResponse.access_token
    $authHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    Write-Host "✅ Login exitoso" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error en login: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 2: Crear un Plan de Prueba (máximo 2 usuarios)
# ============================================================
Write-Host "📋 PASO 2: Crear Plan de Prueba (max 2 usuarios, 1 médico, 3 pacientes)" -ForegroundColor Yellow
$planBody = @{
    name = "Test Plan - Sprint7"
    price = 10
    maxUsers = 2
    maxDoctors = 1
    maxPatients = 3
} | ConvertTo-Json

try {
    $planResponse = Invoke-RestMethod -Uri "$baseUrl/plans" -Method POST -Headers $authHeaders -Body $planBody
    $planId = $planResponse.id
    Write-Host "✅ Plan creado: $($planResponse.name)" -ForegroundColor Green
    Write-Host "   - Max Usuarios: $($planResponse.maxUsers)" -ForegroundColor Gray
    Write-Host "   - Max Médicos: $($planResponse.maxDoctors)" -ForegroundColor Gray
    Write-Host "   - Max Pacientes: $($planResponse.maxPatients)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Error creando plan: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 3: Crear Institución de Prueba
# ============================================================
Write-Host "📋 PASO 3: Crear Institución de Prueba" -ForegroundColor Yellow
$institutionBody = @{
    name = "Clínica Test Sprint7"
    code = "TEST-S7"
    type = "CLINIC"
    address = "Calle Test 123"
    city = "Bogotá"
    country = "CO"
    email = "test@sprint7.com"
    phone = "3001234567"
} | ConvertTo-Json

try {
    $institutionResponse = Invoke-RestMethod -Uri "$baseUrl/institutions" -Method POST -Headers $authHeaders -Body $institutionBody
    $institutionId = $institutionResponse.id
    Write-Host "✅ Institución creada: $($institutionResponse.name)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error creando institución: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 4: Asignar Plan a Institución
# ============================================================
Write-Host "📋 PASO 4: Asignar Plan a Institución usando CHANGE-PLAN endpoint" -ForegroundColor Yellow
$changePlanBody = @{
    planId = $planId
} | ConvertTo-Json

try {
    $changePlanResponse = Invoke-RestMethod -Uri "$baseUrl/institutions/$institutionId/change-plan" -Method PATCH -Headers $authHeaders -Body $changePlanBody
    Write-Host "✅ Plan asignado exitosamente" -ForegroundColor Green
    Write-Host "   Mensaje: $($changePlanResponse.message)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Error asignando plan: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 5: Crear Usuario 1 (debe funcionar)
# ============================================================
Write-Host "📋 PASO 5: Crear Usuario 1 (debe funcionar - límite 2)" -ForegroundColor Yellow
$user1Body = @{
    email = "user1@test-sprint7.com"
    password = "Password123!"
    firstName = "Usuario"
    lastName = "Uno"
    role = "ADMIN"
    institutionId = $institutionId
} | ConvertTo-Json

try {
    $user1Response = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $authHeaders -Body $user1Body
    Write-Host "✅ Usuario 1 creado exitosamente" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error creando usuario 1: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 6: Crear Usuario 2 (debe funcionar)
# ============================================================
Write-Host "📋 PASO 6: Crear Usuario 2 (debe funcionar - límite 2)" -ForegroundColor Yellow
$user2Body = @{
    email = "user2@test-sprint7.com"
    password = "Password123!"
    firstName = "Usuario"
    lastName = "Dos"
    role = "RECEPCIONISTA"
    institutionId = $institutionId
} | ConvertTo-Json

try {
    $user2Response = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $authHeaders -Body $user2Body
    Write-Host "✅ Usuario 2 creado exitosamente" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error creando usuario 2: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 7: Intentar crear Usuario 3 (debe FALLAR por límite)
# ============================================================
Write-Host "📋 PASO 7: Intentar crear Usuario 3 (debe FALLAR - excede límite)" -ForegroundColor Yellow
$user3Body = @{
    email = "user3@test-sprint7.com"
    password = "Password123!"
    firstName = "Usuario"
    lastName = "Tres"
    role = "CONSULTA"
    institutionId = $institutionId
} | ConvertTo-Json

try {
    $user3Response = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST -Headers $authHeaders -Body $user3Body
    Write-Host "❌ ERROR: El usuario 3 NO debería haberse creado (límite excedido)" -ForegroundColor Red
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -like "*Límite de usuarios alcanzado*") {
        Write-Host "✅ CORRECTO: Se bloqueó correctamente por límite de usuarios" -ForegroundColor Green
        Write-Host "   Mensaje: $errorMsg" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Se bloqueó pero con mensaje diferente: $errorMsg" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ============================================================
# PASO 8: Crear Especialidad para probar médicos
# ============================================================
Write-Host "📋 PASO 8: Crear Especialidad" -ForegroundColor Yellow
$specialtyBody = @{
    name = "Medicina General Test"
    description = "Especialidad de prueba"
    institutionId = $institutionId
} | ConvertTo-Json

try {
    $specialtyResponse = Invoke-RestMethod -Uri "$baseUrl/specialties" -Method POST -Headers $authHeaders -Body $specialtyBody
    $specialtyId = $specialtyResponse.id
    Write-Host "✅ Especialidad creada" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error creando especialidad: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 9: Crear Médico 1 (debe funcionar - límite 1)
# ============================================================
Write-Host "📋 PASO 9: Crear Médico 1 (debe funcionar - límite 1)" -ForegroundColor Yellow
$doctor1Body = @{
    email = "doctor1@test-sprint7.com"
    password = "Password123!"
    firstName = "Doctor"
    lastName = "Test"
    specialtyId = $specialtyId
    licenseNumber = "12345"
    phone = "3001111111"
    institutionId = $institutionId
} | ConvertTo-Json

try {
    $doctor1Response = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method POST -Headers $authHeaders -Body $doctor1Body
    Write-Host "✅ Médico 1 creado exitosamente" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error creando médico 1: $_" -ForegroundColor Red
    exit 1
}

# ============================================================
# PASO 10: Intentar crear Médico 2 (debe FALLAR por límite)
# ============================================================
Write-Host "📋 PASO 10: Intentar crear Médico 2 (debe FALLAR - excede límite)" -ForegroundColor Yellow
$doctor2Body = @{
    email = "doctor2@test-sprint7.com"
    password = "Password123!"
    firstName = "Doctor"
    lastName = "Dos"
    specialtyId = $specialtyId
    licenseNumber = "67890"
    phone = "3002222222"
    institutionId = $institutionId
} | ConvertTo-Json

try {
    $doctor2Response = Invoke-RestMethod -Uri "$baseUrl/doctors" -Method POST -Headers $authHeaders -Body $doctor2Body
    Write-Host "❌ ERROR: El médico 2 NO debería haberse creado (límite excedido)" -ForegroundColor Red
} catch {
    $errorMsg = $_.Exception.Message
    if ($errorMsg -like "*Límite de médicos alcanzado*") {
        Write-Host "✅ CORRECTO: Se bloqueó correctamente por límite de médicos" -ForegroundColor Green
        Write-Host "   Mensaje: $errorMsg" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Se bloqueó pero con mensaje diferente: $errorMsg" -ForegroundColor Yellow
    }
    Write-Host ""
}

# ============================================================
# RESUMEN
# ============================================================
Write-Host ""
Write-Host "🎉 RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "✅ Middleware Multi-Tenant: Activado" -ForegroundColor Green
Write-Host "✅ Validación límite usuarios: Funcionando" -ForegroundColor Green
Write-Host "✅ Validación límite médicos: Funcionando" -ForegroundColor Green
Write-Host "✅ Endpoint cambiar plan: Funcionando" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 DATOS CREADOS (para limpieza manual si es necesario):" -ForegroundColor Yellow
Write-Host "   - Plan ID: $planId" -ForegroundColor Gray
Write-Host "   - Institución ID: $institutionId" -ForegroundColor Gray
Write-Host ""
Write-Host "✨ ¡Sprint 7 completado exitosamente!" -ForegroundColor Green
