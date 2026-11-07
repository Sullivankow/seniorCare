import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { Readable } from "node:stream";

/** Shared private storage; each domain supplies its own local directory. */
@Injectable()
export class MediaStorageService {
  private readonly driver: "local" | "s3";
  private readonly localRoot: string;
  private readonly bucket: string | null;
  private readonly client: S3Client | null;

  constructor(
    config: ConfigService,
    directorySetting: string,
    defaultDirectory: string,
  ) {
    const driver =
      config.get<string>("MEDIA_STORAGE_DRIVER") ??
      config.get<string>("VOICE_STORAGE_DRIVER", "local");
    if (driver !== "local" && driver !== "s3") {
      throw new Error("MEDIA_STORAGE_DRIVER doit valoir local ou s3.");
    }

    this.driver = driver;
    this.localRoot = resolve(
      config.get<string>(directorySetting, defaultDirectory),
    );
    this.bucket =
      config.get<string>("MEDIA_S3_BUCKET") ??
      config.get<string>("VOICE_S3_BUCKET") ??
      null;

    if (driver === "s3" && !this.bucket) {
      throw new Error(
        "MEDIA_S3_BUCKET est requis avec MEDIA_STORAGE_DRIVER=s3.",
      );
    }

    const accessKeyId =
      config.get<string>("MEDIA_S3_ACCESS_KEY") ??
      config.get<string>("VOICE_S3_ACCESS_KEY");
    const secretAccessKey =
      config.get<string>("MEDIA_S3_SECRET_KEY") ??
      config.get<string>("VOICE_S3_SECRET_KEY");
    this.client =
      driver === "s3"
        ? new S3Client({
            region:
              config.get<string>("MEDIA_S3_REGION") ??
              config.get<string>("VOICE_S3_REGION", "eu-west-3"),
            endpoint:
              config.get<string>("MEDIA_S3_ENDPOINT") ??
              config.get<string>("VOICE_S3_ENDPOINT"),
            forcePathStyle:
              (config.get<string>("MEDIA_S3_FORCE_PATH_STYLE") ??
                config.get<string>("VOICE_S3_FORCE_PATH_STYLE", "false")) ===
              "true",
            ...(accessKeyId && secretAccessKey
              ? { credentials: { accessKeyId, secretAccessKey } }
              : {}),
          })
        : null;
  }

  async store(
    sourcePath: string,
    key: string,
    mimeType: string,
    fileSize: number,
  ) {
    if (this.driver === "s3") {
      await this.client!.send(
        new PutObjectCommand({
          Bucket: this.bucket!,
          Key: key,
          Body: createReadStream(sourcePath),
          ContentLength: fileSize,
          ContentType: mimeType,
        }),
      );
      return;
    }

    const destination = this.localPath(key);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(sourcePath, destination);
  }

  async open(key: string, notFoundMessage = "Fichier audio introuvable.") {
    if (this.driver === "s3") {
      const result = await this.client!.send(
        new GetObjectCommand({ Bucket: this.bucket!, Key: key }),
      );
      if (result.Body instanceof Readable) return result.Body;
      throw new NotFoundException(notFoundMessage);
    }

    const path = this.localPath(key);
    try {
      await stat(path);
    } catch {
      throw new NotFoundException(notFoundMessage);
    }
    return createReadStream(path);
  }

  async remove(key: string) {
    if (this.driver === "s3") {
      await this.client!.send(
        new DeleteObjectCommand({ Bucket: this.bucket!, Key: key }),
      );
      return;
    }
    await rm(this.localPath(key), { force: true });
  }

  private localPath(key: string) {
    const path = resolve(this.localRoot, key);
    if (!path.startsWith(`${this.localRoot}${sep}`)) {
      throw new InternalServerErrorException("Clé de stockage invalide.");
    }
    return path;
  }
}
