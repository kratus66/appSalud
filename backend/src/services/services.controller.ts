import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto, UpdateServiceDto } from './dto/service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Services')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo servicio hospitalario' })
  async create(
    @Body() createDto: CreateServiceDto,
    @GetUser() user: any,
  ) {
    return this.servicesService.create(
      createDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR)
  @ApiOperation({ summary: 'Listar servicios hospitalarios' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @GetUser() user: any,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.servicesService.findAll(
      user.role,
      user.institutionId,
      {
        search,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      },
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR)
  @ApiOperation({ summary: 'Obtener servicio por ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.servicesService.findOne(id, user.role, user.institutionId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar servicio' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateServiceDto,
    @GetUser() user: any,
  ) {
    return this.servicesService.update(
      id,
      updateDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar servicio (soft delete)' })
  async delete(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.servicesService.delete(
      id,
      user.id,
      user.role,
      user.institutionId,
    );
  }
}
