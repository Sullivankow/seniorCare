import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser } from "../common/current-user.decorator";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { Role } from "../common/role.enum";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { LinksService } from "./links.service";
import { CreateContactDto } from "./dto/create-contact.dto";

@ApiTags("Répertoire")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SENIOR)
@Controller("links")
export class LinksController {
  constructor(private readonly links: LinksService) {}

  @Get("me/contacts")
  @ApiOperation({
    summary: "Liste les contacts du senior connecté",
  })
  contacts(@CurrentUser() user: AuthUser) {
    return this.links.getContactsForSenior(user.id);
  }

  @Post("me/contacts")
  @ApiOperation({
    summary: "Ajoute un contact au répertoire du senior connecté",
  })
  createContact(@CurrentUser() user: AuthUser, @Body() dto: CreateContactDto) {
    return this.links.createContact(user.id, dto);
  }
}
