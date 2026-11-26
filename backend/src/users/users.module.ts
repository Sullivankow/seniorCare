import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { ProfileStorageService } from "./profile-storage.service";
import { PhotoStorageService } from "../photos/photo-storage.service";
import { VoiceStorageService } from "../voice-messages/voice-storage.service";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [
    UsersService,
    ProfileStorageService,
    PhotoStorageService,
    VoiceStorageService,
  ],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
