import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateContactDto } from "./dto/create-contact.dto";
import { UpdateContactDto } from "./dto/update-contact.dto";
import { SeniorContact } from "./senior-contact.entity";
import { SeniorLink } from "./senior-link.entity";
import { UsersService } from "../users/users.service";

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(SeniorLink) private readonly repo: Repository<SeniorLink>,
    @InjectRepository(SeniorContact)
    private readonly contacts: Repository<SeniorContact>,
    private readonly users: UsersService,
  ) {}

  /** Rattache un membre de la famille au senior possédant ce code d'invitation. */
  async linkByInviteCode(familyId: string, inviteCode: string) {
    const senior = await this.users.findByInviteCode(inviteCode.trim());
    if (!senior) throw new NotFoundException("Code d'invitation introuvable.");
    if (await this.repo.exist({ where: { familyId, seniorId: senior.id } })) {
      throw new ConflictException("Vous suivez déjà cette personne.");
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

  /** Combine les comptes familiaux liés et les contacts saisis dans le répertoire. */
  async getContactsForSenior(seniorId: string) {
    const [familyIds, savedContacts] = await Promise.all([
      this.getFamilyIdsForSenior(seniorId),
      this.contacts.find({ where: { seniorId } }),
    ]);
    const users = await this.users.findByIds(familyIds);
    const familyContacts = users.flatMap((user) =>
      user
        ? [
            {
              id: user.id,
              fullName: user.fullName,
              email: user.email,
              phone: null,
              source: "family" as const,
            },
          ]
        : [],
    );
    const personalContacts = savedContacts.map((contact) =>
      this.toPersonalContact(contact),
    );
    return [...familyContacts, ...personalContacts].sort((left, right) =>
      left.fullName.localeCompare(right.fullName),
    );
  }

  async createContact(seniorId: string, dto: CreateContactDto) {
    const contact = this.contacts.create({
      seniorId,
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      email: dto.email?.trim() || null,
    });
    return this.toPersonalContact(await this.contacts.save(contact));
  }

  async updateContact(
    seniorId: string,
    contactId: string,
    dto: UpdateContactDto,
  ) {
    const contact = await this.contacts.findOneBy({ id: contactId, seniorId });
    if (!contact) throw new NotFoundException("Contact introuvable.");

    if (dto.fullName != null) contact.fullName = dto.fullName.trim();
    if (dto.phone != null) contact.phone = dto.phone.trim();
    if (dto.email !== undefined) contact.email = dto.email?.trim() || null;

    return this.toPersonalContact(await this.contacts.save(contact));
  }

  async deleteContact(seniorId: string, contactId: string) {
    const result = await this.contacts.delete({ id: contactId, seniorId });
    if (!result.affected) throw new NotFoundException("Contact introuvable.");
    return { deleted: true };
  }

  private toPersonalContact(contact: SeniorContact) {
    return {
      id: contact.id,
      fullName: contact.fullName,
      email: contact.email,
      phone: contact.phone,
      source: "personal" as const,
    };
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
