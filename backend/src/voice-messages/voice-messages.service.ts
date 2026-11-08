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
import { CreateVoiceMessageDto } from "./voice-message.dto";
import { VoiceMessage } from "./voice-message.entity";
import { VoiceStorageService } from "./voice-storage.service";

type VoiceMessageSummary = Omit<VoiceMessage, "storageKey">;

@Injectable()
export class VoiceMessagesService {
  constructor(
    @InjectRepository(VoiceMessage)
    private readonly repo: Repository<VoiceMessage>,
    private readonly storage: VoiceStorageService,
    private readonly links: LinksService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async create(
    seniorId: string,
    file: Express.Multer.File,
    dto: CreateVoiceMessageDto,
  ) {
    const id = randomUUID();
    const storageKey = `${seniorId}/${id}.m4a`;
    let stored = false;

    try {
      await this.storage.store(file.path, storageKey, file.mimetype, file.size);
      stored = true;
      const message = await this.repo.save(
        this.repo.create({
          id,
          seniorId,
          storageKey,
          mimeType: file.mimetype,
          durationSeconds: dto.durationSeconds,
          fileSizeBytes: file.size,
        }),
      );
      const summary = this.toSummary(message);

      // Seules les métadonnées sont diffusées ; l'audio reste derrière la route authentifiée.
      this.realtime.emitToSenior(
        seniorId,
        RealtimeEvents.VOICE_MESSAGE_CREATED,
        summary,
      );
      return summary;
    } catch (error) {
      // Retire le fichier orphelin si l'écriture des métadonnées échoue après le transfert.
      if (stored) await this.storage.remove(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async listForFamily(
    seniorId: string,
    familyId: string,
  ): Promise<VoiceMessageSummary[]> {
    await this.links.assertLinked(familyId, seniorId);
    const messages = await this.repo.find({
      where: { seniorId },
      order: { createdAt: "DESC" },
      take: 50,
    });
    return messages.map((message) => this.toSummary(message));
  }

  async deleteForFamily(seniorId: string, id: string, familyId: string) {
    // Le lien est vérifié avant toute suppression de média ou de métadonnées.
    await this.links.assertLinked(familyId, seniorId);
    const message = await this.repo.findOne({ where: { id, seniorId } });
    if (!message) throw new NotFoundException("Message vocal introuvable.");

    await this.storage.remove(message.storageKey);
    await this.repo.remove(message);
    this.realtime.emitToSenior(seniorId, RealtimeEvents.VOICE_MESSAGE_DELETED, {
      id,
      seniorId,
    });
  }

  async openForUser(id: string, user: AuthUser) {
    const message = await this.repo.findOne({ where: { id } });
    if (!message) throw new NotFoundException("Message vocal introuvable.");

    if (user.role === Role.SENIOR) {
      if (message.seniorId !== user.id) throw new ForbiddenException();
    } else {
      await this.links.assertLinked(user.id, message.seniorId);
    }

    return {
      message: this.toSummary(message),
      stream: await this.storage.open(message.storageKey),
    };
  }

  private toSummary(message: VoiceMessage): VoiceMessageSummary {
    // La clé interne ne doit jamais être envoyée aux clients.
    const { storageKey: _storageKey, ...summary } = message;
    return summary;
  }
}
