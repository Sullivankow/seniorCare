import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../common/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Jeanne Martin' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'jeanne@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'motdepasse123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.SENIOR })
  @IsEnum(Role)
  role: Role;
}
