import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole, AuditEventType } from '../common/enums';
import * as bcrypt from 'bcrypt';

jest.mock('@nestjs/config');
jest.mock('../audit/audit.service');
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let auditService: any;

  const mockUser = {
    id: 'user-123',
    email: 'doctor@test.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.DOCTOR,
    institutionId: 'inst-123',
    isActive: true,
    lockedUntil: null,
    failedLoginAttempts: 0,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: null,
    specialty: null,
    institution: {
      id: 'inst-123',
      name: 'Test Hospital',
      code: 'TH001',
      status: 'ACTIVE',
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mocked-token'),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          JWT_SECRET: 'test-secret',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
          MAX_LOGIN_ATTEMPTS: 5,
          LOGIN_BLOCK_TIME_MINUTES: 30,
        };
        return config[key];
      }),
    };

    const mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);
    auditService = module.get(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = { email: 'doctor@test.com', password: 'password123' };

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.LOGIN_FAILED,
        }),
      );
    });

    it('should throw UnauthorizedException when account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000),
      };
      prisma.user.findUnique.mockResolvedValue(lockedUser);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({ reason: 'Account locked' }),
        }),
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 1 }),
        }),
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when institution is not active', async () => {
      const userWithInactiveInstitution = {
        ...mockUser,
        institution: { ...mockUser.institution, status: 'SUSPENDED' },
      };
      prisma.user.findUnique.mockResolvedValue(userWithInactiveInstitution);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow('Institución no activa');
    });

    it('should login successfully with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue({ ...mockUser, failedLoginAttempts: 0 });
      prisma.refreshToken.create.mockResolvedValue({ id: 'token-1', token: 'refresh', userId: 'user-123', expiresAt: new Date() });
      jwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        institutionId: mockUser.institutionId,
        institution: {
          id: mockUser.institution.id,
          name: mockUser.institution.name,
          code: mockUser.institution.code,
        },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: AuditEventType.LOGIN_SUCCESS,
        }),
      );
    });

    it('should block account after 5 failed attempts', async () => {
      const userWithAttempts = { ...mockUser, failedLoginAttempts: 4 };
      prisma.user.findUnique.mockResolvedValue(userWithAttempts);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('refresh', () => {
    const validRefreshToken = 'valid-refresh-token';
    const mockPayload = { sub: 'user-123', email: 'test@test.com', role: UserRole.DOCTOR };

    it('should throw UnauthorizedException when token is invalid', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('Invalid token'); });

      await expect(service.refresh(validRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token not found in DB', async () => {
      jwtService.verify.mockReturnValue(mockPayload);
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refresh(validRefreshToken)).rejects.toThrow('Refresh token inválido');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      jwtService.verify.mockReturnValue(mockPayload);
      prisma.refreshToken.findUnique.mockResolvedValue({
        ...mockUser,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const mockUserInactive = { ...mockUser, isActive: false };
      prisma.user = {
        findUnique: jest.fn().mockResolvedValue(mockUserInactive),
      };

      await expect(service.refresh(validRefreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should refresh tokens successfully', async () => {
      jwtService.verify.mockReturnValue(mockPayload);
      const storedToken = {
        id: 'token-1',
        token: validRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: mockUser,
      };
      prisma.refreshToken.findUnique.mockResolvedValue(storedToken);
      prisma.refreshToken.delete.mockResolvedValue(storedToken);
      prisma.refreshToken.create.mockResolvedValue({ id: 'new-token', token: 'new-refresh', userId: 'user-123', expiresAt: new Date() });
      jwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');

      const result = await service.refresh(validRefreshToken);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'token-1' } });
    });
  });

  describe('logout', () => {
    it('should delete refresh token and audit logout', async () => {
      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout('user-123', 'refresh-token');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123', token: 'refresh-token' },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: AuditEventType.LOGOUT }),
      );
    });
  });

  describe('validateUser', () => {
    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('invalid-id')).rejects.toThrow(UnauthorizedException);
    });

    it('should return user when valid', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-123');

      expect(result).toEqual(mockUser);
    });
  });
});
