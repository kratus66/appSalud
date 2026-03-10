import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlansService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Ya existe un plan con ese nombre');
    }

    return this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        price: dto.price,
        maxUsers: dto.maxUsers,
        maxDoctors: dto.maxDoctors,
        maxPatients: dto.maxPatients,
        features: dto.features ? JSON.stringify(dto.features) : null,
      },
    });
  }

  async findAll() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    return plans.map((p) => ({
      ...p,
      features: p.features ? JSON.parse(p.features) : null,
      subscriptionCount: p._count.subscriptions,
    }));
  }

  async findOne(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) throw new NotFoundException('Plan no encontrado');

    return {
      ...plan,
      features: plan.features ? JSON.parse(plan.features) : null,
      subscriptionCount: plan._count.subscriptions,
    };
  }

  async update(id: string, dto: UpdatePlanDto) {
    await this.findOne(id);

    const updateData: any = { ...dto };
    if (dto.features !== undefined) {
      updateData.features = dto.features ? JSON.stringify(dto.features) : null;
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: updateData,
    });

    return {
      ...updated,
      features: updated.features ? JSON.parse(updated.features) : null,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }
}
