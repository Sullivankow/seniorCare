import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from './checkin.entity';
import { CreateCheckInDto } from './dto/create-checkin.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RealtimeEvents } from '../realtime/realtime.events';
import { UsersService } from '../users/users.service';

@Injectable()
export class CheckinsService {
  constructor(
    @InjectRepository(CheckIn) private readonly repo: Repository<CheckIn>,
    private readonly realtime: RealtimeGateway,
    private readonly users: UsersService,
  ) {}

  /** Enregistre le pointage puis prévient la famille en temps réel. */
  async create(seniorId: string, dto: CreateCheckInDto) {
    const checkIn = await this.repo.save(
      this.repo.create({ seniorId, status: dto.status, note: dto.note ?? null }),
    );
    const senior = await this.users.findById(seniorId);
    this.realtime.emitToSenior(seniorId, RealtimeEvents.CHECKIN_CREATED, {
      checkIn,
      seniorName: senior?.fullName,
    });
    return checkIn;
  }

  findLast(seniorId: string) {
    return this.repo.findOne({ where: { seniorId }, order: { createdAt: 'DESC' } });
  }

  findHistory(seniorId: string, limit = 50) {
    return this.repo.find({ where: { seniorId }, order: { createdAt: 'DESC' }, take: limit });
  }
}
