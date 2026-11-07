import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LinksModule } from "../links/links.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { UsersModule } from "../users/users.module";
import { FamilyPhoto } from "./photo.entity";
import { FamilyPhotosController, PhotosController } from "./photos.controller";
import { PhotosService } from "./photos.service";
import { PhotoStorageService } from "./photo-storage.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([FamilyPhoto]),
    LinksModule,
    RealtimeModule,
    UsersModule,
  ],
  controllers: [FamilyPhotosController, PhotosController],
  providers: [PhotosService, PhotoStorageService],
})
export class PhotosModule {}
