import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HolidaysService } from './holidays.service';
import { CreateHolidayDto, UpdateHolidayDto } from './dto/holiday.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Holidays')
@Controller('holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo festivo' })
  async create(
    @Body() createDto: CreateHolidayDto,
    @GetUser() user: any,
  ) {
    return this.holidaysService.create(
      createDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR)
  @ApiOperation({ summary: 'Listar festivos' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'countryCode', required: false })
  async findAll(
    @GetUser() user: any,
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('countryCode') countryCode?: string,
  ) {
    return this.holidaysService.findAll(
      user.role,
      user.institutionId,
      {
        year: year ? parseInt(year) : undefined,
        month: month ? parseInt(month) : undefined,
        countryCode,
      },
    );
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PLANIFICADOR, UserRole.APROBADOR)
  @ApiOperation({ summary: 'Obtener festivo por ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.holidaysService.findOne(id, user.role, user.institutionId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar festivo' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateHolidayDto,
    @GetUser() user: any,
  ) {
    return this.holidaysService.update(
      id,
      updateDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar festivo' })
  async delete(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.holidaysService.delete(
      id,
      user.id,
      user.role,
      user.institutionId,
    );
  }
}
