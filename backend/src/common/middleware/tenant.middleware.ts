import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware Multi-Tenant
 * 
 * Asegura que:
 * 1. SUPER_ADMIN puede acceder a todos los datos
 * 2. Otros roles solo ven datos de su institución
 * 3. El filtro se aplica automáticamente en todas las queries
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (user) {
      // Si no es SUPER_ADMIN, debe tener institutionId
      if (user.role !== 'SUPER_ADMIN' && !user.institutionId) {
        throw new ForbiddenException('Usuario sin institución asignada');
      }

      // Agregar el filtro de tenant al request para uso posterior
      (req as any).tenantId = user.institutionId;
    }

    next();
  }
}
