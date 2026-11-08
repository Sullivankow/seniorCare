import {
  BadRequestException,
  Body,
  CallHandler,
  Controller,
  Delete,
  ExecutionContext,
  Get,
  Injectable,
  NestInterceptor,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
import { CreatePhotoDto } from "./photo.dto";
import { PhotosService } from "./photos.service";

const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
const acceptedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

const photoUploadOptions = {
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
  limits: { fileSize: MAX_PHOTO_BYTES },
  fileFilter: (
    _request: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!acceptedPhotoTypes.has(file.mimetype)) {
      callback(
        new BadRequestException("Format photo non pris en charge."),
        false,
      );
      return;
    }
    callback(null, true);
  },
};

@Injectable()
class CleanupUploadedPhotoInterceptor implements NestInterceptor {
  /** Supprime le fichier temporaire Multer même si le traitement échoue. */
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

@ApiTags("Photos familiales")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("family/seniors")
export class FamilyPhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Post(":seniorId/photos")
  @Roles(Role.FAMILY)
  @UseInterceptors(
    FileInterceptor("photo", photoUploadOptions),
    CleanupUploadedPhotoInterceptor,
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["photo"],
      properties: {
        photo: { type: "string", format: "binary" },
        caption: { type: "string", maxLength: 500 },
        memoryDate: { type: "string", format: "date" },
        surpriseDate: { type: "string", format: "date" },
      },
    },
  })
  @ApiOperation({ summary: "Ajoute une photo à l'album d'un senior lié" })
  create(
    @Param("seniorId", ParseUUIDPipe) seniorId: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreatePhotoDto,
  ) {
    if (!file) throw new BadRequestException("Aucune photo reçue.");
    return this.photos.create(seniorId, user.id, file, dto);
  }

  @Get(":seniorId/photos")
  @Roles(Role.FAMILY)
  list(
    @Param("seniorId", ParseUUIDPipe) seniorId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.photos.listForFamily(seniorId, user.id);
  }
}

@ApiTags("Photos familiales")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("photos")
export class PhotosController {
  constructor(private readonly photos: PhotosService) {}

  @Get("me")
  @Roles(Role.SENIOR)
  listMine(@CurrentUser() user: AuthUser) {
    return this.photos.listForSenior(user.id);
  }

  @Get(":id/image")
  @Roles(Role.SENIOR, Role.FAMILY)
  @ApiProduces("image/jpeg", "image/png", "image/webp")
  async image(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const { photo, stream } = await this.photos.openForUser(id, user);
    return new StreamableFile(stream, {
      type: photo.mimeType,
      disposition: "inline",
      length: photo.fileSizeBytes,
    });
  }

  @Put(":id/like")
  @Roles(Role.SENIOR)
  like(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.photos.setLiked(id, user.id, true);
  }

  @Delete(":id/like")
  @Roles(Role.SENIOR)
  unlike(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.photos.setLiked(id, user.id, false);
  }
}
