import { SetMetadata } from '@nestjs/common';
import { Role } from './role.enum';

export const ROLES_KEY = 'roles';
/** Restreint une route à certains rôles. Usage : `@Roles(Role.SENIOR)` */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
