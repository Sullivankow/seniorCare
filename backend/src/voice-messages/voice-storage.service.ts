import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MediaStorageService } from "../media/media-storage.service";

/** Préserve le chemin et les variables historiques du stockage des messages vocaux. */
@Injectable()
export class VoiceStorageService extends MediaStorageService {
  constructor(config: ConfigService) {
    super(config, "VOICE_STORAGE_DIR", "uploads/voice-messages");
  }
}
