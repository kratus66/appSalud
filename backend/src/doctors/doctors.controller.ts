import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('doctors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear médico (usuario + perfil de médico)' })
  @ApiResponse({ status: 201, description: 'Médico creado exitosamente' })
  create(@Body() dto: CreateDoctorDto, @GetUser() user: any) {
    return this.doctorsService.create(dto, user.id, user.role, user.institutionId);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPCIONISTA,
    UserRole.PLANIFICADOR,
    UserRole.DOCTOR,
    UserRole.CONSULTA,
  )
  @ApiOperation({ summary: 'Listar médicos' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'specialtyId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de médicos' })
  findAll(
    @GetUser() user: any,
    @Query('search') search?: string,
    @Query('specialtyId') specialtyId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.doctorsService.findAll(user.role, user.institutionId, {
      search,
      specialtyId,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.RECEPCIONISTA,
    UserRole.PLANIFICADOR,
    UserRole.DOCTOR,
    UserRole.CONSULTA,
  )
  @ApiOperation({ summary: 'Obtener médico por ID' })
  @ApiResponse({ status: 200, description: 'Médico encontrado' })
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.doctorsService.findOne(id, user.role, user.institutionId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar médico' })
  @ApiResponse({ status: 200, description: 'Médico actualizado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorDto,
    @GetUser() user: any,
  ) {
    return this.doctorsService.update(id, dto, user.id, user.role, user.institutionId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar médico (soft delete)' })
  @ApiResponse({ status: 200, description: 'Médico eliminado' })
  delete(@Param('id') id: string, @GetUser() user: any) {
    return this.doctorsService.delete(id, user.id, user.role, user.institutionId);
  }
}
