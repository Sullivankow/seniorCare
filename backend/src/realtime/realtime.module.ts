import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LinksModule } from '../links/links.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule, LinksModule],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
