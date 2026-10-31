import {
  BadRequestException,
  Body,
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  Injectable,
  NestInterceptor,
  Param,
  ParseUUIDPipe,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { randomUUID } from "node:crypto";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { finalize } from "rxjs";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { Role } from "../common/role.enum";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { LinksService } from "../links/links.service";
import { CreateVoiceMessageDto } from "./voice-message.dto";
import { VoiceMessagesService } from "./voice-messages.service";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const acceptedAudioTypes = new Set(["audio/mp4", "audio/m4a", "audio/aac"]);

// Store incoming files outside the app directory and remove them after processing.
const voiceUploadOptions = {
  storage: diskStorage({
    destination: tmpdir(),
    filename: (
      _request: unknown,
      _file: unknown,
      callback: (error: Error | null, filename: string) => void,
    ) => {
      callback(null, `${randomUUID()}.upload`);
    },
  }),
  limits: { fileSize: MAX_AUDIO_BYTES },
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!acceptedAudioTypes.has(file.mimetype)) {
      callback(
        new BadRequestException("Format audio non pris en charge."),
        false,
      );
      return;
    }
    callback(null, true);
  },
};

@Injectable()
class CleanupUploadedFileInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context
      .switchToHttp()
      .getRequest<{ file?: Express.Multer.File }>();
    return next.handle().pipe(
      finalize(() => {
        if (request.file?.path) {
          void rm(request.file.path, { force: true }).catch(() => undefined);
        }
      }),
    );
  }
}

@ApiTags("Messages vocaux")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("voice-messages")
export class VoiceMessagesController {
  constructor(private readonly voiceMessages: VoiceMessagesService) {}

  @Post()
  @Roles(Role.SENIOR)
  @UseInterceptors(
    FileInterceptor("audio", voiceUploadOptions),
    CleanupUploadedFileInterceptor,
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["audio", "durationSeconds"],
      properties: {
        audio: { type: "string", format: "binary" },
        durationSeconds: { type: "integer", minimum: 1, maximum: 60 },
      },
    },
  })
  @ApiOperation({ summary: "Envoie un message vocal du senior à sa famille" })
  create(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateVoiceMessageDto,
  ) {
    if (!file) throw new BadRequestException("Aucun fichier audio reçu.");
    return this.voiceMessages.create(user.id, file, dto);
  }

  @Get(":id/audio")
  @Roles(Role.SENIOR, Role.FAMILY)
  @ApiProduces("audio/mp4")
  @ApiOperation({
    summary: "Lit un message vocal après vérification des droits",
  })
  async audio(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const { message, stream } = await this.voiceMessages.openForUser(id, user);
    return new StreamableFile(stream, {
      type: message.mimeType,
      disposition: "inline",
      length: message.fileSizeBytes,
    });
  }
}

@ApiTags("Messages vocaux")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FAMILY)
@Controller("family/seniors")
export class FamilyVoiceMessagesController {
  constructor(private readonly voiceMessages: VoiceMessagesService) {}

  @Get(":seniorId/voice-messages")
  @ApiOperation({
    summary: "Liste les 50 derniers messages vocaux d’un senior lié",
  })
  list(
    @Param("seniorId", ParseUUIDPipe) seniorId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.voiceMessages.listForFamily(seniorId, user.id);
  }
}
