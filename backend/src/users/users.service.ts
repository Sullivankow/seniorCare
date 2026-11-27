import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomInt, randomUUID } from "node:crypto";
import { DataSource, In, Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "./user.entity";
import { Role } from "../common/role.enum";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileStorageService } from "./profile-storage.service";
import { PhotoStorageService } from "../photos/photo-storage.service";
import { VoiceStorageService } from "../voice-messages/voice-storage.service";
import { CheckIn } from "../checkins/checkin.entity";
import { Alert } from "../alerts/alert.entity";
import { SeniorContact } from "../links/senior-contact.entity";
import { SeniorLink } from "../links/senior-link.entity";
import { VoiceMessage } from "../voice-messages/voice-message.entity";
import { FamilyPhoto } from "../photos/photo.entity";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly profileStorage: ProfileStorageService,
    private readonly photoStorage: PhotoStorageService,
    private readonly voiceStorage: VoiceStorageService,
  ) {}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.requireUser(id);
    if (dto.email) {
      const email = dto.email.trim().toLowerCase();
      const existing = await this.findByEmail(email);
      if (existing && existing.id !== id) {
        throw new ConflictException("Un compte existe déjà avec cet e-mail.");
      }
      user.email = email;
    }
    if (dto.fullName !== undefined) user.fullName = dto.fullName.trim();

    try {
      return this.toPublicProfile(await this.repo.save(user));
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Un compte existe déjà avec cet e-mail.");
      }
      throw error;
    }
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.findByIdWithPassword(id);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Mot de passe actuel incorrect.");
    }
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.repo.save(user);
    return { changed: true };
  }

  async updateProfilePhoto(id: string, file: Express.Multer.File) {
    const user = await this.findByIdWithPhoto(id);
    const previousKey = user.profilePhotoKey;
    let extension = "jpg";
    if (file.mimetype === "image/png") extension = "png";
    else if (file.mimetype === "image/webp") extension = "webp";
    const storageKey = `${id}/${randomUUID()}.${extension}`;
    let stored = false;

    try {
      await this.profileStorage.store(
        file.path,
        storageKey,
        file.mimetype,
        file.size,
      );
      stored = true;
      user.profilePhotoKey = storageKey;
      user.profilePhotoMimeType = file.mimetype;
      user.profilePhotoUpdatedAt = new Date();
      const saved = await this.repo.save(user);
      if (previousKey)
        await this.removeStoredFile(this.profileStorage, previousKey);
      return this.toPublicProfile(saved);
    } catch (error) {
      if (stored)
        await this.profileStorage.remove(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async openProfilePhoto(id: string) {
    const user = await this.findByIdWithPhoto(id);
    if (!user.profilePhotoKey || !user.profilePhotoMimeType) {
      throw new NotFoundException("Photo de profil introuvable.");
    }
    return {
      mimeType: user.profilePhotoMimeType,
      stream: await this.profileStorage.open(
        user.profilePhotoKey,
        "Photo de profil introuvable.",
      ),
    };
  }

  async removeProfilePhoto(id: string) {
    const user = await this.findByIdWithPhoto(id);
    const previousKey = user.profilePhotoKey;
    user.profilePhotoKey = null;
    user.profilePhotoMimeType = null;
    user.profilePhotoUpdatedAt = null;
    const saved = await this.repo.save(user);
    if (previousKey)
      await this.removeStoredFile(this.profileStorage, previousKey);
    return this.toPublicProfile(saved);
  }

  async deleteSeniorAccount(id: string, currentPassword: string) {
    const user = await this.findByIdWithPassword(id);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Mot de passe actuel incorrect.");
    }

    const files = await this.dataSource.transaction(async (manager) => {
      const photoRepo = manager.getRepository(FamilyPhoto);
      const voiceRepo = manager.getRepository(VoiceMessage);
      const photos = await photoRepo.find({
        where: { seniorId: id },
        select: { storageKey: true },
      });
      const messages = await voiceRepo.find({
        where: { seniorId: id },
        select: { storageKey: true },
      });
      const profile = await this.findByIdWithPhoto(id);

      await photoRepo.delete({ seniorId: id });
      await voiceRepo.delete({ seniorId: id });
      await manager.getRepository(CheckIn).delete({ seniorId: id });
      await manager.getRepository(Alert).delete({ seniorId: id });
      await manager.getRepository(SeniorContact).delete({ seniorId: id });
      await manager.getRepository(SeniorLink).delete({ seniorId: id });
      await manager.getRepository(User).delete({ id });

      return {
        profilePhotoKey: profile.profilePhotoKey,
        photoKeys: photos.map(({ storageKey }) => storageKey),
        voiceKeys: messages.map(({ storageKey }) => storageKey),
      };
    });

    // The database rows are removed atomically; external storage cleanup is best-effort.
    await Promise.all([
      ...(files.profilePhotoKey
        ? [this.removeStoredFile(this.profileStorage, files.profilePhotoKey)]
        : []),
      ...files.photoKeys.map((key) =>
        this.removeStoredFile(this.photoStorage, key),
      ),
      ...files.voiceKeys.map((key) =>
        this.removeStoredFile(this.voiceStorage, key),
      ),
    ]);
    return { deleted: true };
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

  private findByIdWithPassword(id: string) {
    return this.repo
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.id = :id", { id })
      .getOne();
  }

  private findByIdWithPhoto(id: string) {
    return this.repo
      .createQueryBuilder("u")
      .addSelect(["u.profilePhotoKey", "u.profilePhotoMimeType"])
      .where("u.id = :id", { id })
      .getOne()
      .then((user) => {
        if (!user) throw new NotFoundException("Compte introuvable.");
        return user;
      });
  }

  private async requireUser(id: string) {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException("Compte introuvable.");
    return user;
  }

  private toPublicProfile(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      inviteCode: user.inviteCode,
      profilePhotoUpdatedAt: user.profilePhotoUpdatedAt,
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    );
  }

  private async removeStoredFile(
    storage: ProfileStorageService | PhotoStorageService | VoiceStorageService,
    key: string,
  ) {
    try {
      await storage.remove(key);
    } catch (error) {
      this.logger.error(
        `Impossible de supprimer le média ${key}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async create(data: {
    fullName: string;
    email: string;
    passwordHash: string;
    role: Role;
    termsAcceptedAt: Date;
    termsVersion: string;
    privacyPolicyAcceptedAt: Date;
    privacyPolicyVersion: string;
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
