import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeniorLink } from './senior-link.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(SeniorLink) private readonly repo: Repository<SeniorLink>,
    private readonly users: UsersService,
  ) {}

  /** Rattache un membre de la famille au senior possédant ce code d'invitation. */
  async linkByInviteCode(familyId: string, inviteCode: string) {
    const senior = await this.users.findByInviteCode(inviteCode.trim());
    if (!senior) throw new NotFoundException("Code d'invitation introuvable.");
    if (await this.repo.exist({ where: { familyId, seniorId: senior.id } })) {
      throw new ConflictException('Vous suivez déjà cette personne.');
    }
    await this.repo.save(this.repo.create({ familyId, seniorId: senior.id }));
    return senior;
  }

  async getSeniorIdsForFamily(familyId: string): Promise<string[]> {
    const links = await this.repo.find({ where: { familyId } });
    return links.map((l) => l.seniorId);
  }

  async getFamilyIdsForSenior(seniorId: string): Promise<string[]> {
    const links = await this.repo.find({ where: { seniorId } });
    return links.map((l) => l.familyId);
  }

  isLinked(familyId: string, seniorId: string) {
    return this.repo.exist({ where: { familyId, seniorId } });
  }

  /** Lève une 403 si le membre de la famille ne suit pas ce senior. */
  async assertLinked(familyId: string, seniorId: string) {
    if (!(await this.isLinked(familyId, seniorId))) {
      throw new ForbiddenException("Vous n'avez pas accès à cette personne.");
    }
  }
}
