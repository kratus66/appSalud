import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  async create(
    @Body() createDto: CreateUserDto,
    @GetUser() user: any,
  ) {
    return this.usersService.create(
      createDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @GetUser() user: any,
    @Query('role') role?: UserRole,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(user.role, user.institutionId, { role, search });
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Estadísticas de usuarios' })
  async getStats(@GetUser() user: any) {
    return this.usersService.getStats(user.role, user.institutionId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.usersService.findOne(id, user.role, user.institutionId);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar usuario' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @GetUser() user: any,
  ) {
    return this.usersService.update(
      id,
      updateDto,
      user.id,
      user.role,
      user.institutionId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar usuario (soft delete)' })
  async remove(
    @Param('id') id: string,
    @GetUser() user: any,
  ) {
    return this.usersService.softDelete(
      id,
      user.id,
      user.role,
      user.institutionId,
    );
  }
}
