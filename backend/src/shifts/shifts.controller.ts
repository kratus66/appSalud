import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ShiftsService } from './shifts.service';
import { CreateShiftDto, UpdateShiftDto } from './dto/shift.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Shifts')
@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo turno clínico' })
  async create(
    @Body() createDto: CreateShiftDto,
    @GetUser() user: any,
  ) {
    return this.shiftsService.create(
      createDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR)
  @ApiOperation({ summary: 'Listar turnos clínicos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @GetUser() user: any,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.shiftsService.findAll(
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
  @ApiOperation({ summary: 'Obtener turno por ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.shiftsService.findOne(id, user.role, user.institutionId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar turno' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateShiftDto,
    @GetUser() user: any,
  ) {
    return this.shiftsService.update(
      id,
      updateDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar turno (desactivar)' })
  async delete(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.shiftsService.delete(
      id,
      user.id,
      user.role,
      user.institutionId,
    );
  }
}
