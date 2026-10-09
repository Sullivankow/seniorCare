import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from './role.enum';

/** Utilisateur authentifié, extrait du token JWT (voir JwtStrategy). */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

/** Usage : `@CurrentUser() user: AuthUser` dans un contrôleur protégé. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
