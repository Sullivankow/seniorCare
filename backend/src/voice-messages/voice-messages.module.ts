import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LinksModule } from "../links/links.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { VoiceMessage } from "./voice-message.entity";
import {
  FamilyVoiceMessagesController,
  VoiceMessagesController,
} from "./voice-messages.controller";
import { VoiceMessagesService } from "./voice-messages.service";
import { VoiceStorageService } from "./voice-storage.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([VoiceMessage]),
    LinksModule,
    RealtimeModule,
  ],
  controllers: [VoiceMessagesController, FamilyVoiceMessagesController],
  providers: [VoiceMessagesService, VoiceStorageService],
})
export class VoiceMessagesModule {}
