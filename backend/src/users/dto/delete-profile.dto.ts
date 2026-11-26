import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class DeleteProfileDto {
  @ApiProperty({ minLength: 1 })
  @IsString()
  @MinLength(1)
  currentPassword: string;
}
