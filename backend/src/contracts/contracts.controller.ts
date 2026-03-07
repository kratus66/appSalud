import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto, UpdateContractDto } from './dto/contract.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Contracts')
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo contrato laboral' })
  async create(
    @Body() createDto: CreateContractDto,
    @GetUser() user: any,
  ) {
    return this.contractsService.create(
      createDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR)
  @ApiOperation({ summary: 'Listar contratos laborales' })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @GetUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.contractsService.findAll(
      user.role,
      user.institutionId,
      { search },
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR)
  @ApiOperation({ summary: 'Obtener contrato por ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.contractsService.findOne(id, user.role, user.institutionId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar contrato' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateContractDto,
    @GetUser() user: any,
  ) {
    return this.contractsService.update(
      id,
      updateDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar contrato' })
  async delete(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.contractsService.delete(
      id,
      user.id,
      user.role,
      user.institutionId,
    );
  }
}
