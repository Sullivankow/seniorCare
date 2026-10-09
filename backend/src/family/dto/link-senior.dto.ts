import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class LinkSeniorDto {
  @ApiProperty({ example: 'K7P2QX', description: "Code d'invitation affiché sur l'écran du senior" })
  @IsString()
  @Length(6, 6)
  inviteCode: string;
}
