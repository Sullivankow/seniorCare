import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MediaStorageService } from "../media/media-storage.service";

/** Stockage privé des portraits, séparé de l'album familial. */
@Injectable()
export class ProfileStorageService extends MediaStorageService {
  constructor(config: ConfigService) {
    super(config, "PROFILE_STORAGE_DIR", "uploads/profile-photos");
  }
}
