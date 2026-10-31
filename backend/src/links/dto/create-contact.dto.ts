import { Transform } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

export class CreateContactDto {
  @ApiProperty({ example: "Marie Dupont", maxLength: 100 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  fullName: string;

  @ApiProperty({ example: "+33 6 12 34 56 78", maxLength: 30 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Matches(/^(?=(?:.*\d){6,})\+?[\d\s().-]{6,30}$/)
  phone: string;

  @ApiPropertyOptional({ example: "marie@example.com", maxLength: 255 })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}
