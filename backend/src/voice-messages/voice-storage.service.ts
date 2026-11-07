import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MediaStorageService } from "../media/media-storage.service";

/** Keeps the existing voice storage path and configuration backward-compatible. */
@Injectable()
export class VoiceStorageService extends MediaStorageService {
  constructor(config: ConfigService) {
    super(config, "VOICE_STORAGE_DIR", "uploads/voice-messages");
  }
}
