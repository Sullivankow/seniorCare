import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MediaStorageService } from "../media/media-storage.service";

/** Isole la configuration de stockage des photos du service média partagé. */
@Injectable()
export class PhotoStorageService extends MediaStorageService {
  constructor(config: ConfigService) {
    super(config, "PHOTO_STORAGE_DIR", "uploads/family-photos");
  }
}
