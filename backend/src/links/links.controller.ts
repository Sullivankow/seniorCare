import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { Role } from "../common/role.enum";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { LinksService } from "./links.service";

@ApiTags("Répertoire")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SENIOR)
@Controller("links")
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Get("me/contacts")
  @ApiOperation({
    summary: "Liste les membres de famille liés au senior connecté",
  })
  contacts(@CurrentUser() user: AuthUser) {
    return this.links.getFamilyContactsForSenior(user.id);
  }
}
