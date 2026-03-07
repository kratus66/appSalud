import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto, UpdateInstitutionDto } from './dto/institution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole, InstitutionStatus } from '../common/enums';

@ApiTags('Institutions')
@Controller('institutions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear nueva institución (Solo SUPER_ADMIN)' })
  async create(
    @Body() createDto: CreateInstitutionDto,
    @GetUser('id') userId: string,
  ) {
    return this.institutionsService.create(createDto, userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar todas las instituciones (Solo SUPER_ADMIN)' })
  @ApiQuery({ name: 'status', required: false, enum: InstitutionStatus })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('status') status?: InstitutionStatus,
    @Query('search') search?: string,
  ) {
    return this.institutionsService.findAll({ status, search });
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Estadísticas de instituciones (Solo SUPER_ADMIN)' })
  async getStats() {
    return this.institutionsService.getStats();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obtener institución por ID (Solo SUPER_ADMIN)' })
  async findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar institución (Solo SUPER_ADMIN)' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInstitutionDto,
    @GetUser('id') userId: string,
  ) {
    return this.institutionsService.update(id, updateDto, userId);
  }

  @Patch(':id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspender institución (Solo SUPER_ADMIN)' })
  async suspend(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ) {
    return this.institutionsService.suspend(id, userId);
  }
}
