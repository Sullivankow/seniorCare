import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/role.enum';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

/** Routes utilisées par l'app SENIOR. */
@ApiTags('Pointages (senior)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SENIOR)
@Controller('checkins')
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  @Post()
  @ApiOperation({ summary: 'Pointer : « Je vais bien » (la famille est prévenue en temps réel)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCheckInDto) {
    return this.checkins.create(user.id, dto);
  }

  @Get('me/last')
  @ApiOperation({ summary: 'Mon dernier pointage' })
  async last(@CurrentUser() user: AuthUser) {
    return (await this.checkins.findLast(user.id)) ?? null;
  }
}
