import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { LinksModule } from '../links/links.module';
import { UsersModule } from '../users/users.module';
import { CheckinsModule } from '../checkins/checkins.module';
import { AlertsModule } from '../alerts/alerts.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [LinksModule, UsersModule, CheckinsModule, AlertsModule, RealtimeModule],
  providers: [FamilyService],
  controllers: [FamilyController],
})
export class FamilyModule {}
