import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/auth.dto';
import { AuditEventType } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const { email, password } = loginDto;

    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { institution: true },
    });

    if (!user) {
      // Auditar login fallido
      await this.auditService.log({
        eventType: AuditEventType.LOGIN_FAILED,
        details: { email, reason: 'User not found' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está bloqueado
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      await this.auditService.log({
        eventType: AuditEventType.LOGIN_FAILED,
        userId: user.id,
        institutionId: user.institutionId || undefined,
        details: { email, reason: 'Account locked' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException(
        `Cuenta bloqueada. Intente nuevamente en ${minutesLeft} minutos`,
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Incrementar intentos fallidos
      const failedAttempts = user.failedLoginAttempts + 1;
      const maxAttempts = this.configService.get<number>('MAX_LOGIN_ATTEMPTS') || 5;
      const blockTimeMinutes = this.configService.get<number>('LOGIN_BLOCK_TIME_MINUTES') || 30;

      const updateData: any = { failedLoginAttempts: failedAttempts };

      // Bloquear si alcanza el máximo
      if (failedAttempts >= maxAttempts) {
        updateData.lockedUntil = new Date(Date.now() + blockTimeMinutes * 60 * 1000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await this.auditService.log({
        eventType: AuditEventType.LOGIN_FAILED,
        userId: user.id,
        institutionId: user.institutionId || undefined,
        details: { email, reason: 'Invalid password', failedAttempts },
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está activo y no eliminado
    if (!user.isActive || user.deletedAt) {
      await this.auditService.log({
        eventType: AuditEventType.LOGIN_FAILED,
        userId: user.id,
        institutionId: user.institutionId || undefined,
        details: { email, reason: 'User inactive or deleted' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Verificar que la institución esté activa (si no es SUPER_ADMIN)
    if (user.institution && user.institution.status !== 'ACTIVE') {
      await this.auditService.log({
        eventType: AuditEventType.LOGIN_FAILED,
        userId: user.id,
        institutionId: user.institutionId || undefined,
        details: { email, reason: 'Institution not active' },
        ipAddress,
        userAgent,
      });
      throw new UnauthorizedException('Institución no activa');
    }

    // Login exitoso - resetear intentos fallidos
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Generar tokens
    const tokens = await this.generateTokens(user);

    // Auditar login exitoso
    await this.auditService.log({
      eventType: AuditEventType.LOGIN_SUCCESS,
      userId: user.id,
      institutionId: user.institutionId || undefined,
      details: { email },
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        institutionId: user.institutionId,
        institution: user.institution ? {
          id: user.institution.id,
          name: user.institution.name,
          code: user.institution.code,
        } : null,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    try {
      // Verificar el refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // Verificar que existe en la base de datos
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: { include: { institution: true } } },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token inválido o expirado');
      }

      // Verificar que el usuario sigue activo
      if (!storedToken.user.isActive || storedToken.user.deletedAt) {
        throw new UnauthorizedException('Usuario inactivo');
      }

      // Generar nuevos tokens
      const tokens = await this.generateTokens(storedToken.user);

      // Eliminar el refresh token usado
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    // Eliminar refresh token
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    }

    // Auditar logout
    await this.auditService.log({
      eventType: AuditEventType.LOGOUT,
      userId,
    });
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    };

    // Access token (15 minutos)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
    });

    // Refresh token (7 días)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    // Guardar refresh token en la BD
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Usuario no válido');
    }

    return user;
  }
}
