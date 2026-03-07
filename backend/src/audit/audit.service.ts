import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEventType } from '../common/enums';

interface LogAuditParams {
  eventType: AuditEventType;
  userId?: string;
  institutionId?: string;
  entityType?: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra un evento de auditoría (INMUTABLE)
   * Solo permite INSERT, nunca UPDATE o DELETE
   */
  async log(params: LogAuditParams) {
    try {
      const auditEvent = await this.prisma.auditEvent.create({
        data: {
          eventType: params.eventType,
          userId: params.userId,
          institutionId: params.institutionId,
          entityType: params.entityType,
          entityId: params.entityId,
          details: params.details ? JSON.stringify(params.details) : null,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });

      return auditEvent;
    } catch (error) {
      // Log error pero no fallar la operación principal
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Consultar eventos de auditoría
   */
  async findAll(filters: {
    institutionId?: string;
    userId?: string;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.institutionId) {
      where.institutionId = filters.institutionId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.eventType) {
      where.eventType = filters.eventType;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          institution: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0,
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    // Parsear details de JSON string a objeto
    const parsedEvents = events.map(event => ({
      ...event,
      details: event.details ? JSON.parse(event.details) : null,
    }));

    return {
      events: parsedEvents,
      total,
      limit: filters.limit || 50,
      offset: filters.offset || 0,
    };
  }

  /**
   * Obtener estadísticas de auditoría
   */
  async getStats(institutionId?: string) {
    const where: any = {};
    if (institutionId) {
      where.institutionId = institutionId;
    }

    const stats = await this.prisma.auditEvent.groupBy({
      by: ['eventType'],
      where,
      _count: true,
    });

    return stats.map((stat) => ({
      eventType: stat.eventType,
      count: stat._count,
    }));
  }
}
