import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole, AuditEventType } from '../common/enums';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('events')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar eventos de auditoría' })
  @ApiQuery({ name: 'eventType', required: false, enum: AuditEventType })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getEvents(
    @GetUser() user: any,
    @Query('eventType') eventType?: AuditEventType,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const filters: any = {
      eventType,
      limit: limit ? parseInt(limit.toString()) : 50,
      offset: offset ? parseInt(offset.toString()) : 0,
    };

    // Si no es SUPER_ADMIN, filtrar por institución
    if (user.role !== UserRole.SUPER_ADMIN) {
      filters.institutionId = user.institutionId;
    }

    return this.auditService.findAll(filters);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas de auditoría' })
  async getStats(@GetUser() user: any) {
    const institutionId = user.role === UserRole.SUPER_ADMIN ? undefined : user.institutionId;
    return this.auditService.getStats(institutionId);
  }
}
