import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear Super Admin (sin institución)
  const hashedPassword = await bcrypt.hash('SuperAdmin123!', 10);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@hospital.com' },
    update: {},
    create: {
      email: 'superadmin@hospital.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      institutionId: null, // Super admin no tiene institución
    },
  });

  console.log('✅ Super Admin created:', superAdmin.email);

  // Crear institución de prueba
  const institution = await prisma.institution.upsert({
    where: { code: 'HOSP001' },
    update: {},
    create: {
      name: 'Hospital Central',
      code: 'HOSP001',
      status: 'ACTIVE',
      metadata: JSON.stringify({
        address: 'Calle Principal 123',
        phone: '+1234567890',
      }),
    },
  });

  console.log('✅ Institution created:', institution.name);

  // Crear usuarios de ejemplo para la institución
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hospitalcentral.com' },
    update: {},
    create: {
      email: 'admin@hospitalcentral.com',
      password: adminPassword,
      firstName: 'Juan',
      lastName: 'Administrador',
      role: 'ADMIN',
      institutionId: institution.id,
    },
  });

  console.log('✅ Admin created:', admin.email);

  const planificador = await prisma.user.upsert({
    where: { email: 'planificador@hospitalcentral.com' },
    update: {},
    create: {
      email: 'planificador@hospitalcentral.com',
      password: await bcrypt.hash('Plan123!', 10),
      firstName: 'María',
      lastName: 'Planificadora',
      role: 'PLANIFICADOR',
      institutionId: institution.id,
    },
  });

  console.log('✅ Planificador created:', planificador.email);

  const aprobador = await prisma.user.upsert({
    where: { email: 'aprobador@hospitalcentral.com' },
    update: {},
    create: {
      email: 'aprobador@hospitalcentral.com',
      password: await bcrypt.hash('Aprob123!', 10),
      firstName: 'Carlos',
      lastName: 'Aprobador',
      role: 'APROBADOR',
      institutionId: institution.id,
    },
  });

  console.log('✅ Aprobador created:', aprobador.email);

  const consulta = await prisma.user.upsert({
    where: { email: 'consulta@hospitalcentral.com' },
    update: {},
    create: {
      email: 'consulta@hospitalcentral.com',
      password: await bcrypt.hash('Cons123!', 10),
      firstName: 'Ana',
      lastName: 'Consultora',
      role: 'CONSULTA',
      institutionId: institution.id,
    },
  });

  console.log('✅ Consulta created:', consulta.email);

  // Crear servicios de ejemplo
  const servicioUCI = await prisma.service.create({
    data: {
      name: 'UCI - Unidad de Cuidados Intensivos',
      description: 'Unidad especializada en pacientes críticos',
      institutionId: institution.id,
      isActive: true,
    },
  });

  const servicioUrgencias = await prisma.service.create({
    data: {
      name: 'Urgencias',
      description: 'Atención de emergencias médicas 24/7',
      institutionId: institution.id,
      isActive: true,
    },
  });

  console.log('✅ Services created: UCI, Urgencias');

  // Crear turnos de ejemplo
  await prisma.shift.createMany({
    data: [
      {
        name: 'Turno Mañana',
        startTime: '07:00',
        endTime: '15:00',
        shiftType: 'MORNING',
        color: '#FCD34D',
        institutionId: institution.id,
      },
      {
        name: 'Turno Tarde',
        startTime: '15:00',
        endTime: '23:00',
        shiftType: 'AFTERNOON',
        color: '#FB923C',
        institutionId: institution.id,
      },
      {
        name: 'Turno Noche',
        startTime: '23:00',
        endTime: '07:00',
        shiftType: 'NIGHT',
        color: '#60A5FA',
        institutionId: institution.id,
      },
    ],
  });

  console.log('✅ Shifts created: Mañana, Tarde, Noche');

  // Crear contratos de ejemplo
  await prisma.contract.createMany({
    data: [
      {
        name: 'Contrato 48 Horas',
        weeklyHours: 48,
        maxConsecutiveNights: 5,
        requiredRestHours: 12,
        rulesConfig: JSON.stringify({ allowOvertimeOnWeekends: true, maxDailyHours: 12 }),
        institutionId: institution.id,
      },
      {
        name: 'Contrato 36 Horas',
        weeklyHours: 36,
        maxConsecutiveNights: 3,
        requiredRestHours: 12,
        rulesConfig: JSON.stringify({ allowOvertimeOnWeekends: false, maxDailyHours: 10 }),
        institutionId: institution.id,
      },
    ],
  });

  console.log('✅ Contracts created: 48h, 36h');

  // Crear festivos nacionales de Colombia 2026
  const colombianHolidays2026 = [
    { date: '2026-01-01', name: 'Año Nuevo' },
    { date: '2026-01-12', name: 'Día de los Reyes Magos' },
    { date: '2026-03-23', name: 'Día de San José' },
    { date: '2026-04-02', name: 'Jueves Santo' },
    { date: '2026-04-03', name: 'Viernes Santo' },
    { date: '2026-05-01', name: 'Día del Trabajo' },
    { date: '2026-05-18', name: 'Ascensión del Señor' },
    { date: '2026-06-08', name: 'Corpus Christi' },
    { date: '2026-06-15', name: 'Sagrado Corazón de Jesús' },
    { date: '2026-06-29', name: 'San Pedro y San Pablo' },
    { date: '2026-07-20', name: 'Día de la Independencia' },
    { date: '2026-08-07', name: 'Batalla de Boyacá' },
    { date: '2026-08-17', name: 'Asunción de la Virgen' },
    { date: '2026-10-12', name: 'Día de la Raza' },
    { date: '2026-11-02', name: 'Día de Todos los Santos' },
    { date: '2026-11-16', name: 'Independencia de Cartagena' },
    { date: '2026-12-08', name: 'Inmaculada Concepción' },
    { date: '2026-12-25', name: 'Navidad' },
  ];

  for (const holiday of colombianHolidays2026) {
    await prisma.holiday.create({
      data: {
        holidayDate: new Date(holiday.date),
        name: holiday.name,
        countryCode: 'CO',
        institutionId: null, // Festivo nacional
      },
    });
  }

  console.log('✅ Colombian holidays 2026 created');

  // Registrar eventos de auditoría
  await prisma.auditEvent.create({
    data: {
      eventType: 'INSTITUTION_CREATED',
      userId: superAdmin.id,
      institutionId: institution.id,
      entityType: 'Institution',
      entityId: institution.id,
      details: JSON.stringify({
        name: institution.name,
        code: institution.code,
      }),
    },
  });

  console.log('🎉 Seeding completed successfully!');
  console.log('\n📋 Credentials:');
  console.log('Super Admin: superadmin@hospital.com / SuperAdmin123!');
  console.log('Admin: admin@hospitalcentral.com / Admin123!');
  console.log('Planificador: planificador@hospitalcentral.com / Plan123!');
  console.log('Aprobador: aprobador@hospitalcentral.com / Aprob123!');
  console.log('Consulta: consulta@hospitalcentral.com / Cons123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
