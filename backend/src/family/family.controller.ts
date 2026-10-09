import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FamilyService } from './family.service';
import { LinkSeniorDto } from './dto/link-senior.dto';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Role } from '../common/role.enum';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';

/** Routes utilisées par l'app FAMILLE. */
@ApiTags('Famille')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.FAMILY)
@Controller('family')
export class FamilyController {
  constructor(private readonly family: FamilyService) {}

  @Post('seniors')
  @ApiOperation({ summary: "Suivre un senior grâce à son code d'invitation" })
  link(@CurrentUser() user: AuthUser, @Body() dto: LinkSeniorDto) {
    return this.family.linkSenior(user.id, dto.inviteCode);
  }

  @Get('seniors')
  @ApiOperation({ summary: 'Tableau de bord : état de chacun de mes proches' })
  list(@CurrentUser() user: AuthUser) {
    return this.family.listSummaries(user.id);
  }

  @Get('seniors/:seniorId/checkins')
  @ApiOperation({ summary: "Historique des pointages d'un proche" })
  checkins(@CurrentUser() user: AuthUser, @Param('seniorId', ParseUUIDPipe) seniorId: string) {
    return this.family.getCheckins(user.id, seniorId);
  }

  @Get('seniors/:seniorId/alerts')
  @ApiOperation({ summary: "Historique des alertes d'un proche" })
  alerts(@CurrentUser() user: AuthUser, @Param('seniorId', ParseUUIDPipe) seniorId: string) {
    return this.family.getAlerts(user.id, seniorId);
  }
}
