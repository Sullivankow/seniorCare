import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../common/role.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  findByInviteCode(inviteCode: string) {
    return this.repo.findOne({ where: { inviteCode: inviteCode.toUpperCase(), role: Role.SENIOR } });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  /** Variante qui charge aussi le hash du mot de passe (pour le login uniquement). */
  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async create(data: { fullName: string; email: string; passwordHash: string; role: Role }) {
    const user = this.repo.create({
      ...data,
      email: data.email.toLowerCase(),
      inviteCode: data.role === Role.SENIOR ? await this.generateUniqueInviteCode() : null,
    });
    return this.repo.save(user);
  }

  /** Code de 6 caractères, sans caractères ambigus (0/O, 1/I) pour faciliter la dictée. */
  private async generateUniqueInviteCode(): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (;;) {
      let code = '';
      for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
      const exists = await this.repo.exist({ where: { inviteCode: code } });
      if (!exists) return code;
    }
  }
}
