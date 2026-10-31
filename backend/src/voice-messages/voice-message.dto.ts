import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Max, Min } from "class-validator";

export class CreateVoiceMessageDto {
  @ApiProperty({
    minimum: 1,
    maximum: 60,
    description: "Durée du message en secondes",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  durationSeconds: number;
}
