import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeniorLink } from './senior-link.entity';
import { LinksService } from './links.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([SeniorLink]), UsersModule],
  providers: [LinksService],
  exports: [LinksService],
})
export class LinksModule {}
