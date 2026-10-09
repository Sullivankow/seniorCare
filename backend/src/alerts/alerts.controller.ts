import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/role.enum';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

@ApiTags('Alertes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alerts: AlertsService) {}

  @Post()
  @Roles(Role.SENIOR)
  @ApiOperation({ summary: "Déclencher une urgence (bouton SOS) – la famille est prévenue en temps réel" })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAlertDto) {
    return this.alerts.create(user.id, dto);
  }

  @Get('me/active')
  @Roles(Role.SENIOR)
  @ApiOperation({ summary: "Mon alerte active (null s'il n'y en a pas)" })
  async myActive(@CurrentUser() user: AuthUser) {
    return (await this.alerts.findActiveForSenior(user.id)) ?? null;
  }

  @Post(':id/resolve')
  @Roles(Role.SENIOR, Role.FAMILY)
  @ApiOperation({ summary: 'Clôturer une alerte (senior concerné ou proche rattaché)' })
  resolve(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.alerts.resolve(id, user);
  }
}
