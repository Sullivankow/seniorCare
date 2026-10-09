import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Exige un token JWT valide (header Authorization: Bearer ...). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
