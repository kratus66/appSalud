import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { UserRole, AuditEventType } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, creatorId: string, creatorRole: UserRole, creatorInstitutionId?: string) {
    // Verificar que el email no exista
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    // Validaciones de roles
    if (dto.role === UserRole.SUPER_ADMIN && creatorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Solo SUPER_ADMIN puede crear otro SUPER_ADMIN');
    }

    // Si no es SUPER_ADMIN, debe tener institutionId
    if (dto.role !== UserRole.SUPER_ADMIN && !dto.institutionId) {
      throw new BadRequestException('Se requiere institutionId para este rol');
    }

    // Si el creador es ADMIN, solo puede crear usuarios de su misma institución
    if (creatorRole === UserRole.ADMIN && dto.institutionId !== creatorInstitutionId) {
      throw new ForbiddenException('Solo puedes crear usuarios de tu institución');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        institutionId: dto.institutionId,
      },
      include: {
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Auditar creación
    await this.auditService.log({
      eventType: AuditEventType.USER_CREATED,
      userId: creatorId,
      institutionId: user.institutionId || undefined,
      entityType: 'User',
      entityId: user.id,
      details: {
        email: user.email,
        role: user.role,
      },
    });

    // No retornar password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(userRole: UserRole, institutionId?: string, filters?: { role?: UserRole; search?: string }) {
    const where: any = {};

    // Filtro de tenant: si no es SUPER_ADMIN, solo ve su institución
    if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    // No mostrar eliminados
    where.deletedAt = null;

    // Filtros adicionales
    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          specialty: true,
          institutionId: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          institution: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
    };
  }

  async findOne(id: string, userRole: UserRole, institutionId?: string) {
    const where: any = { id, deletedAt: null };

    // Si no es SUPER_ADMIN, verificar que sea de su institución
    if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    const user = await this.prisma.user.findFirst({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        institutionId: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
    updaterId: string,
    updaterRole: UserRole,
    updaterInstitutionId?: string,
  ) {
    const user = await this.findOne(id, updaterRole, updaterInstitutionId);

    // No permitir cambiar rol a SUPER_ADMIN si no eres SUPER_ADMIN
    if (dto.role === UserRole.SUPER_ADMIN && updaterRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No puedes asignar el rol SUPER_ADMIN');
    }

    const updateData: any = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
    };

    // Si hay password, hashearlo
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        institutionId: true,
        isActive: true,
        institution: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Auditar actualización
    await this.auditService.log({
      eventType: AuditEventType.USER_UPDATED,
      userId: updaterId,
      institutionId: user.institutionId || undefined,
      entityType: 'User',
      entityId: id,
      details: {
        changes: dto,
      },
    });

    return updated;
  }

  async softDelete(id: string, deleterId: string, deleterRole: UserRole, deleterInstitutionId?: string) {
    const user = await this.findOne(id, deleterRole, deleterInstitutionId);

    // No permitir eliminar SUPER_ADMIN si no eres SUPER_ADMIN
    if (user.role === UserRole.SUPER_ADMIN && deleterRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('No puedes eliminar un SUPER_ADMIN');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Auditar eliminación
    await this.auditService.log({
      eventType: AuditEventType.USER_DELETED,
      userId: deleterId,
      institutionId: user.institutionId || undefined,
      entityType: 'User',
      entityId: id,
      details: {
        email: user.email,
        role: user.role,
      },
    });

    return { message: 'Usuario eliminado exitosamente' };
  }

  async getStats(userRole: UserRole, institutionId?: string) {
    const where: any = { deletedAt: null };

    // Filtro de tenant
    if (userRole !== UserRole.SUPER_ADMIN) {
      where.institutionId = institutionId;
    }

    const [total, active, byRole] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where,
        _count: true,
      }),
    ]);

    const recent = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      total,
      active,
      byRole: byRole.map((r) => ({
        role: r.role,
        count: r._count,
      })),
      recent,
    };
  }
}
