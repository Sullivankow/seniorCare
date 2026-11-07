import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePhotoDto {
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @ApiPropertyOptional({ format: "date", example: "2020-06-18" })
  @IsOptional()
  @IsDateString()
  memoryDate?: string;

  @ApiPropertyOptional({ format: "date", example: "2026-11-07" })
  @IsOptional()
  @IsDateString()
  surpriseDate?: string;
}
