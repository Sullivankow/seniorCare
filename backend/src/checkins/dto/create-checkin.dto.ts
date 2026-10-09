import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CheckInStatus } from '../checkin.entity';

export class CreateCheckInDto {
  @ApiProperty({ enum: CheckInStatus, example: CheckInStatus.OK })
  @IsEnum(CheckInStatus)
  status: CheckInStatus;

  @ApiPropertyOptional({ example: 'Petite fatigue ce matin' })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
