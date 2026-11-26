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
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";
import { RolesGuard } from "../common/roles.guard";
import { Roles } from "../common/roles.decorator";
import { Role } from "../common/role.enum";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { DeleteProfileDto } from "./dto/delete-profile.dto";

const MAX_PROFILE_PHOTO_BYTES = 12 * 1024 * 1024;
const acceptedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const profilePhotoUploadOptions = {
  storage: diskStorage({
    destination: tmpdir(),
    filename: (
      _request: unknown,
      _file: unknown,
      callback: (error: Error | null, filename: string) => void,
    ) => callback(null, `${randomUUID()}.upload`),
  }),
  limits: { fileSize: MAX_PROFILE_PHOTO_BYTES },
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
class CleanupProfileUploadInterceptor implements NestInterceptor {
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

@ApiTags("Utilisateurs")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Profil de l'utilisateur connecté" })
  me(@CurrentUser() user: AuthUser) {
    return this.users.findById(user.id);
  }

  @Put("me")
  @Roles(Role.SENIOR)
  @ApiOperation({ summary: "Modifier le nom ou l’adresse e-mail du senior" })
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }

  @Post("me/password")
  @Roles(Role.SENIOR)
  @ApiOperation({ summary: "Changer le mot de passe du senior" })
  changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.users.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post("me/photo")
  @Roles(Role.SENIOR)
  @UseInterceptors(
    FileInterceptor("photo", profilePhotoUploadOptions),
    CleanupProfileUploadInterceptor,
  )
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["photo"],
      properties: { photo: { type: "string", format: "binary" } },
    },
  })
  @ApiOperation({ summary: "Ajouter ou remplacer la photo de profil" })
  uploadProfilePhoto(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException("Aucune photo reçue.");
    return this.users.updateProfilePhoto(user.id, file);
  }

  @Get("me/photo")
  @Roles(Role.SENIOR)
  @ApiProduces("image/jpeg", "image/png", "image/webp")
  async profilePhoto(@CurrentUser() user: AuthUser) {
    const photo = await this.users.openProfilePhoto(user.id);
    return new StreamableFile(photo.stream, { type: photo.mimeType });
  }

  @Delete("me/photo")
  @Roles(Role.SENIOR)
  @ApiOperation({ summary: "Supprimer la photo de profil" })
  removeProfilePhoto(@CurrentUser() user: AuthUser) {
    return this.users.removeProfilePhoto(user.id);
  }

  @Delete("me")
  @Roles(Role.SENIOR)
  @ApiOperation({ summary: "Supprimer le compte senior et ses données" })
  deleteProfile(@CurrentUser() user: AuthUser, @Body() dto: DeleteProfileDto) {
    return this.users.deleteSeniorAccount(user.id, dto.currentPassword);
  }
}
