import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckIn } from './checkin.entity';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn]), RealtimeModule, UsersModule],
  providers: [CheckinsService],
  controllers: [CheckinsController],
  exports: [CheckinsService],
})
export class CheckinsModule {}
