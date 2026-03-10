import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { ServicesModule } from './services/services.module';
import { ShiftsModule } from './shifts/shifts.module';
import { ContractsModule } from './contracts/contracts.module';
import { HolidaysModule } from './holidays/holidays.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AvailabilityModule } from './availability/availability.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting (protección contra ataques)
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 segundos
        limit: 10, // 10 requests por IP
      },
    ]),

    // Modules
    PrismaModule,
    AuthModule,
    InstitutionsModule,
    UsersModule,
    AuditModule,
    ServicesModule,
    ShiftsModule,
    ContractsModule,
    HolidaysModule,
    PatientsModule,
    AppointmentsModule,
    SpecialtiesModule,
    DoctorsModule,
    AvailabilityModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
