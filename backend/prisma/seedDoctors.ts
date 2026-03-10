import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Colores identificadores por especialidad
const SPECIALTY_COLORS: Record<string, string> = {
  'Cardiología': '#e74c3c',
  'Pediatría': '#3498db',
  'Ortopedia y Traumatología': '#e67e22',
  'Ginecología y Obstetricia': '#e91e8c',
  'Neurología': '#9b59b6',
  'Medicina Interna': '#2ecc71',
  'Medicina General': '#1abc9c',
  'Dermatología': '#f39c12',
  'Urgencias y Emergencias': '#c0392b',
  'Endocrinología': '#16a085',
  'Psiquiatría': '#8e44ad',
  'Oftalmología': '#2980b9',
};

const DOCTORS_DATA = [
  {
    firstName: 'Alejandro', lastName: 'Vargas Restrepo',
    email: 'dr.vargas@hospitalcentral.com', specialty: 'Cardiología',
    licenseNumber: 'TP-12034-COL', phone: '+57 310 234 5678',
    consultingRoom: 'Consultorio 101', bio: 'Cardiólogo con 15 años en intervención coronaria.',
  },
  {
    firstName: 'Claudia', lastName: 'Muñoz Arbeláez',
    email: 'dra.munoz@hospitalcentral.com', specialty: 'Pediatría',
    licenseNumber: 'TP-23456-COL', phone: '+57 311 345 6789',
    consultingRoom: 'Consultorio 205', bio: 'Pediatra especialista en neonatología.',
  },
  {
    firstName: 'Hernán', lastName: 'Suárez Londoño',
    email: 'dr.suarez@hospitalcentral.com', specialty: 'Ortopedia y Traumatología',
    licenseNumber: 'TP-34567-COL', phone: '+57 312 456 7890',
    consultingRoom: 'Consultorio 310', bio: 'Ortopedista especializado en cirugía articular.',
  },
  {
    firstName: 'Patricia', lastName: 'Calderón Ríos',
    email: 'dra.calderon@hospitalcentral.com', specialty: 'Ginecología y Obstetricia',
    licenseNumber: 'TP-45678-COL', phone: '+57 313 567 8901',
    consultingRoom: 'Consultorio 215', bio: 'Ginecóloga especialista en alto riesgo obstétrico.',
  },
  {
    firstName: 'Mauricio', lastName: 'Ochoa Patiño',
    email: 'dr.ochoa@hospitalcentral.com', specialty: 'Neurología',
    licenseNumber: 'TP-56789-COL', phone: '+57 314 678 9012',
    consultingRoom: 'Consultorio 420', bio: 'Neurólogo clínico con experiencia en epilepsia.',
  },
  {
    firstName: 'Sandra', lastName: 'Fernández Gutiérrez',
    email: 'dra.fernandez@hospitalcentral.com', specialty: 'Medicina Interna',
    licenseNumber: 'TP-67890-COL', phone: '+57 315 789 0123',
    consultingRoom: 'Consultorio 115', bio: 'Internista con enfoque en enfermedades crónicas.',
  },
  {
    firstName: 'Julián', lastName: 'Morales Cifuentes',
    email: 'dr.morales@hospitalcentral.com', specialty: 'Medicina General',
    licenseNumber: 'TP-78901-COL', phone: '+57 316 890 1234',
    consultingRoom: 'Consultorio 102', bio: 'Médico general con énfasis en medicina preventiva.',
  },
  {
    firstName: 'Adriana', lastName: 'Tamayo Betancur',
    email: 'dra.tamayo@hospitalcentral.com', specialty: 'Dermatología',
    licenseNumber: 'TP-89012-COL', phone: '+57 317 901 2345',
    consultingRoom: 'Consultorio 320', bio: 'Dermatóloga especialista en oncología cutánea.',
  },
  {
    firstName: 'Francisco', lastName: 'Rubio Escobar',
    email: 'dr.rubio@hospitalcentral.com', specialty: 'Urgencias y Emergencias',
    licenseNumber: 'TP-90123-COL', phone: '+57 318 012 3456',
    consultingRoom: 'Área de Urgencias', bio: 'Especialista en medicina de urgencias y trauma.',
  },
  {
    firstName: 'Gloria', lastName: 'Soto Ramírez',
    email: 'dra.soto@hospitalcentral.com', specialty: 'Endocrinología',
    licenseNumber: 'TP-01234-COL', phone: '+57 319 123 4567',
    consultingRoom: 'Consultorio 425', bio: 'Endocrinóloga con enfoque en diabetes y tiroides.',
  },
  {
    firstName: 'Ricardo', lastName: 'Prieto Medina',
    email: 'dr.prieto@hospitalcentral.com', specialty: 'Psiquiatría',
    licenseNumber: 'TP-11234-COL', phone: '+57 321 234 5678',
    consultingRoom: 'Consultorio 510', bio: 'Psiquiatra con experiencia en trastornos del ánimo.',
  },
  {
    firstName: 'Marcela', lastName: 'Hurtado Quintero',
    email: 'dra.hurtado@hospitalcentral.com', specialty: 'Oftalmología',
    licenseNumber: 'TP-22345-COL', phone: '+57 322 345 6789',
    consultingRoom: 'Consultorio 315', bio: 'Oftalmóloga especializada en cirugía refractiva.',
  },
];

export async function seedDoctors(institutionId: string) {
  console.log('\n🏥 Creando especialidades médicas...');

  // 1. Crear especialidades en la tabla Specialty
  const specialtyMap = new Map<string, string>(); // name → id
  const specialtyNames = [...new Set(DOCTORS_DATA.map((d) => d.specialty))];

  for (const name of specialtyNames) {
    const existing = await prisma.specialty.findFirst({
      where: { name, institutionId },
    });

    if (existing) {
      specialtyMap.set(name, existing.id);
    } else {
      const created = await prisma.specialty.create({
        data: {
          name,
          color: SPECIALTY_COLORS[name] ?? '#64748b',
          institutionId,
        },
      });
      specialtyMap.set(name, created.id);
      console.log(`  ✅ Especialidad: ${name}`);
    }
  }

  console.log('\n👨‍⚕️ Creando perfiles de médicos...');
  const hashedPassword = await bcrypt.hash('Doctor123!', 10);
  let created = 0;
  let skipped = 0;

  for (const d of DOCTORS_DATA) {
    const specialtyId = specialtyMap.get(d.specialty)!;

    // Buscar o crear User con rol DOCTOR
    let userId: string;
    const existingUser = await prisma.user.findUnique({ where: { email: d.email } });

    if (existingUser) {
      userId = existingUser.id;
      // Sincronizar campo legacy specialty si difiere
      if (existingUser.specialty !== d.specialty) {
        await prisma.user.update({
          where: { id: userId },
          data: { specialty: d.specialty },
        });
      }
    } else {
      const user = await prisma.user.create({
        data: {
          email: d.email,
          password: hashedPassword,
          firstName: d.firstName,
          lastName: d.lastName,
          role: 'DOCTOR',
          specialty: d.specialty, // campo legacy para compatibilidad
          institutionId,
          isActive: true,
        },
      });
      userId = user.id;
      created++;
    }

    // Crear o actualizar DoctorProfile
    const existingProfile = await prisma.doctorProfile.findUnique({ where: { userId } });

    if (!existingProfile) {
      await prisma.doctorProfile.create({
        data: {
          userId,
          specialtyId,
          licenseNumber: d.licenseNumber,
          phone: d.phone,
          consultingRoom: d.consultingRoom,
          bio: d.bio,
          institutionId,
        },
      });
    } else {
      await prisma.doctorProfile.update({
        where: { userId },
        data: { specialtyId, institutionId },
      });
      if (existingUser) skipped++;
    }
  }

  console.log(`✅ Médicos: ${created} creados, ${skipped} ya existían`);
  console.log('   Contraseña de acceso: Doctor123!');
  console.log(`   ${specialtyNames.length} especialidades registradas en la tabla specialties`);
}
