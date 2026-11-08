import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomInt } from "node:crypto";
import { In, Repository } from "typeorm";
import { User } from "./user.entity";
import { Role } from "../common/role.enum";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  /** Charge plusieurs comptes en une requête pour éviter les lectures N+1. */
  findByIds(ids: string[]) {
    if (ids.length === 0) return Promise.resolve([] as User[]);
    return this.repo.find({ where: { id: In(ids) } });
  }

  findByInviteCode(inviteCode: string) {
    return this.repo.findOne({
      where: { inviteCode: inviteCode.toUpperCase(), role: Role.SENIOR },
    });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email: email.toLowerCase() } });
  }

  /** Variante qui charge aussi le hash du mot de passe (pour le login uniquement). */
  findByEmailWithPassword(email: string) {
    return this.repo
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.email = :email", { email: email.toLowerCase() })
      .getOne();
  }

  async create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    role: Role;
  }) {
    const user = this.repo.create({
      ...data,
      email: data.email.toLowerCase(),
      inviteCode:
        data.role === Role.SENIOR
          ? await this.generateUniqueInviteCode()
          : null,
    });
    return this.repo.save(user);
  }

  /** Code de 6 caractères, sans caractères ambigus (0/O, 1/I) pour faciliter la dictée. */
  private async generateUniqueInviteCode(): Promise<string> {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (;;) {
      const code = Array.from(
        { length: 6 },
        () => alphabet[randomInt(alphabet.length)],
      ).join("");
      const exists = await this.repo.exist({ where: { inviteCode: code } });
      if (!exists) return code;
    }
  }
}
