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

/** Local disk is convenient for development; S3-compatible storage supports shared production instances. */
@Injectable()
export class VoiceStorageService {
  private readonly driver: "local" | "s3";
  private readonly localRoot: string;
  private readonly bucket: string | null;
  private readonly client: S3Client | null;

  constructor(config: ConfigService) {
    const driver = config.get<string>("VOICE_STORAGE_DRIVER", "local");
    if (driver !== "local" && driver !== "s3") {
      throw new Error("VOICE_STORAGE_DRIVER doit valoir local ou s3.");
    }

    this.driver = driver;
    this.localRoot = resolve(
      config.get<string>("VOICE_STORAGE_DIR", "uploads/voice-messages"),
    );
    this.bucket = config.get<string>("VOICE_S3_BUCKET") ?? null;

    if (driver === "s3" && !this.bucket) {
      throw new Error(
        "VOICE_S3_BUCKET est requis avec VOICE_STORAGE_DRIVER=s3.",
      );
    }

    const accessKeyId = config.get<string>("VOICE_S3_ACCESS_KEY");
    const secretAccessKey = config.get<string>("VOICE_S3_SECRET_KEY");
    this.client =
      driver === "s3"
        ? new S3Client({
            region: config.get<string>("VOICE_S3_REGION", "eu-west-3"),
            endpoint: config.get<string>("VOICE_S3_ENDPOINT"),
            forcePathStyle:
              config.get<string>("VOICE_S3_FORCE_PATH_STYLE", "false") ===
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

  async open(key: string): Promise<Readable> {
    if (this.driver === "s3") {
      const result = await this.client!.send(
        new GetObjectCommand({
          Bucket: this.bucket!,
          Key: key,
        }),
      );
      if (result.Body instanceof Readable) return result.Body;
      throw new NotFoundException("Fichier audio introuvable.");
    }

    const path = this.localPath(key);
    try {
      await stat(path);
    } catch {
      throw new NotFoundException("Fichier audio introuvable.");
    }
    return createReadStream(path);
  }

  async remove(key: string) {
    if (this.driver === "s3") {
      await this.client!.send(
        new DeleteObjectCommand({
          Bucket: this.bucket!,
          Key: key,
        }),
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
