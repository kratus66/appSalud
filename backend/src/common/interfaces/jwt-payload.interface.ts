import { UserRole } from '../enums';

/**
 * Payload del JWT Token
 */
export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: UserRole;
  institutionId: string | null;
  institution?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

/**
 * Usuario autenticado (extendido desde JWT)
 */
export interface AuthenticatedUser extends JwtPayload {
  id: string; // alias de sub
}
