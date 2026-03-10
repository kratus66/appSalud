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
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto, UpdateSpecialtyDto } from './dto/specialty.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('specialties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('specialties')
export class SpecialtiesController {
  constructor(private readonly specialtiesService: SpecialtiesService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear especialidad médica' })
  @ApiResponse({ status: 201, description: 'Especialidad creada' })
  create(@Body() dto: CreateSpecialtyDto, @GetUser() user: any) {
    return this.specialtiesService.create(dto, user.id, user.role, user.institutionId);
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
  @ApiOperation({ summary: 'Listar especialidades' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de especialidades' })
  findAll(
    @GetUser() user: any,
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.specialtiesService.findAll(user.role, user.institutionId, {
      search,
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
  @ApiOperation({ summary: 'Obtener especialidad por ID' })
  @ApiResponse({ status: 200, description: 'Especialidad encontrada' })
  findOne(@Param('id') id: string, @GetUser() user: any) {
    return this.specialtiesService.findOne(id, user.role, user.institutionId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar especialidad' })
  @ApiResponse({ status: 200, description: 'Especialidad actualizada' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSpecialtyDto,
    @GetUser() user: any,
  ) {
    return this.specialtiesService.update(id, dto, user.id, user.role, user.institutionId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar especialidad (soft delete)' })
  @ApiResponse({ status: 200, description: 'Especialidad eliminada' })
  delete(@Param('id') id: string, @GetUser() user: any) {
    return this.specialtiesService.delete(id, user.id, user.role, user.institutionId);
  }
}
