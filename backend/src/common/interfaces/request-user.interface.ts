import { UserRole } from '../enums';

/**
 * Usuario adjunto al Request por el JwtStrategy
 */
export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  institutionId: string | null;
  institution?: {
    id: string;
    name: string;
    code: string;
  } | null;
}
