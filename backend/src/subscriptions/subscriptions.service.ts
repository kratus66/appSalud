import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSubscriptionDto) {
    // Validate institution exists
    const institution = await this.prisma.institution.findUnique({
      where: { id: dto.institutionId },
    });
    if (!institution) throw new NotFoundException('Institución no encontrada');

    // Validate plan exists
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    return this.prisma.subscription.create({
      data: {
        institutionId: dto.institutionId,
        planId: dto.planId,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: dto.status ?? 'TRIAL',
      },
      include: {
        institution: { select: { id: true, name: true, code: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
    });
  }

  async findAll(filters?: { institutionId?: string; status?: string }) {
    const where: any = {};
    if (filters?.institutionId) where.institutionId = filters.institutionId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.subscription.findMany({
      where,
      include: {
        institution: { select: { id: true, name: true, code: true, type: true, city: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: {
        institution: true,
        plan: true,
      },
    });
    if (!sub) throw new NotFoundException('Suscripción no encontrada');
    return sub;
  }

  async update(id: string, dto: UpdateSubscriptionDto) {
    await this.findOne(id);

    if (dto.planId) {
      const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: dto.planId } });
      if (!plan) throw new NotFoundException('Plan no encontrado');
    }

    const updateData: any = { ...dto };
    if (dto.startDate) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate) updateData.endDate = new Date(dto.endDate);

    return this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        institution: { select: { id: true, name: true, code: true } },
        plan: { select: { id: true, name: true, price: true } },
      },
    });
  }

  async getMetrics() {
    const [total, active, trial, cancelled, expired] = await Promise.all([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { status: 'TRIAL' } }),
      this.prisma.subscription.count({ where: { status: 'CANCELLED' } }),
      this.prisma.subscription.count({ where: { status: 'EXPIRED' } }),
    ]);

    // Monthly revenue: sum of active subscriptions plan prices
    const activeWithPlan = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: { select: { price: true } } },
    });
    const monthlyRevenue = activeWithPlan.reduce((sum, s) => sum + s.plan.price, 0);

    return { total, active, trial, cancelled, expired, monthlyRevenue };
  }
}
