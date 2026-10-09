import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAlertDto {
  @ApiPropertyOptional({ example: "J'ai besoin d'aide" })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  message?: string;

  @ApiPropertyOptional({ example: 45.7467 })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({ example: -0.6326 })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
