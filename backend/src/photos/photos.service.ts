import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { Repository } from "typeorm";
import { AuthUser } from "../common/current-user.decorator";
import { Role } from "../common/role.enum";
import { LinksService } from "../links/links.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { RealtimeEvents } from "../realtime/realtime.events";
import { UsersService } from "../users/users.service";
import { CreatePhotoDto } from "./photo.dto";
import { FamilyPhoto } from "./photo.entity";
import { PhotoStorageService } from "./photo-storage.service";

export type PhotoSummary = Pick<
  FamilyPhoto,
  | "id"
  | "seniorId"
  | "senderName"
  | "mimeType"
  | "fileSizeBytes"
  | "caption"
  | "memoryDate"
  | "surpriseDate"
  | "likedAt"
  | "createdAt"
>;

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(FamilyPhoto)
    private readonly repo: Repository<FamilyPhoto>,
    private readonly storage: PhotoStorageService,
    private readonly links: LinksService,
    private readonly users: UsersService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(
    seniorId: string,
    familyId: string,
    file: Express.Multer.File,
    dto: CreatePhotoDto,
  ): Promise<PhotoSummary> {
    await this.links.assertLinked(familyId, seniorId);
    const sender = await this.users.findById(familyId);
    if (!sender) throw new NotFoundException("Compte familial introuvable.");

    const id = randomUUID();
    let extension = "jpg";
    if (file.mimetype === "image/png") extension = "png";
    else if (file.mimetype === "image/webp") extension = "webp";
    const storageKey = `${seniorId}/${id}.${extension}`;
    let stored = false;

    try {
      await this.storage.store(file.path, storageKey, file.mimetype, file.size);
      stored = true;
      const photo = await this.repo.save(
        this.repo.create({
          id,
          seniorId,
          uploadedByFamilyId: familyId,
          senderName: sender.fullName,
          storageKey,
          mimeType: file.mimetype,
          fileSizeBytes: file.size,
          caption: dto.caption?.trim() || null,
          memoryDate: dto.memoryDate ?? null,
          surpriseDate: dto.surpriseDate ?? null,
          likedAt: null,
        }),
      );
      const summary = this.toSummary(photo);

      // La room ne reçoit que les métadonnées ; l'image reste derrière la route authentifiée.
      this.realtime.emitToSenior(
        seniorId,
        RealtimeEvents.PHOTO_CREATED,
        summary,
      );
      return summary;
    } catch (error) {
      // Évite un fichier orphelin si l'enregistrement des métadonnées échoue.
      if (stored) await this.storage.remove(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async listForFamily(seniorId: string, familyId: string) {
    await this.links.assertLinked(familyId, seniorId);
    return this.listForSenior(seniorId);
  }

  listForSenior(seniorId: string) {
    return this.repo
      .find({ where: { seniorId }, order: { createdAt: "DESC" }, take: 100 })
      .then((photos) => photos.map((photo) => this.toSummary(photo)));
  }

  async openForUser(id: string, user: AuthUser) {
    const photo = await this.findById(id);
    if (user.role === Role.SENIOR) {
      if (photo.seniorId !== user.id) throw new ForbiddenException();
    } else {
      await this.links.assertLinked(user.id, photo.seniorId);
    }

    return {
      photo: this.toSummary(photo),
      stream: await this.storage.open(photo.storageKey, "Photo introuvable."),
    };
  }

  async setLiked(id: string, seniorId: string, liked: boolean) {
    const photo = await this.findById(id);
    if (photo.seniorId !== seniorId) throw new ForbiddenException();
    photo.likedAt = liked ? (photo.likedAt ?? new Date()) : null;
    const summary = this.toSummary(await this.repo.save(photo));
    this.realtime.emitToSenior(
      seniorId,
      RealtimeEvents.PHOTO_REACTION_UPDATED,
      summary,
    );
    return summary;
  }

  private async findById(id: string) {
    const photo = await this.repo.findOne({ where: { id } });
    if (!photo) throw new NotFoundException("Photo introuvable.");
    return photo;
  }

  private toSummary(photo: FamilyPhoto): PhotoSummary {
    // Ne jamais exposer la clé de stockage ni l'identifiant interne de l'expéditeur.
    const {
      storageKey: _storageKey,
      uploadedByFamilyId: _uploadedByFamilyId,
      ...summary
    } = photo;
    return summary;
  }
}
