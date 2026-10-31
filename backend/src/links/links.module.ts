import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SeniorContact } from "./senior-contact.entity";
import { SeniorLink } from "./senior-link.entity";
import { LinksService } from "./links.service";
import { LinksController } from "./links.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([SeniorLink, SeniorContact]), UsersModule],
  controllers: [LinksController],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
