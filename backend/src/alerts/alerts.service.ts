import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Alert, AlertStatus } from './alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { RealtimeEvents } from '../realtime/realtime.events';
import { UsersService } from '../users/users.service';
import { LinksService } from '../links/links.service';
import { AuthUser } from '../common/current-user.decorator';
import { Role } from '../common/role.enum';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert) private readonly repo: Repository<Alert>,
    private readonly realtime: RealtimeGateway,
    private readonly users: UsersService,
    private readonly links: LinksService,
  ) {}

  /** Déclenche une urgence et prévient immédiatement toute la famille. */
  async create(seniorId: string, dto: CreateAlertDto) {
    // Une seule alerte active à la fois : on renvoie l'existante si le senior rappuie
    const existing = await this.findActiveForSenior(seniorId);
    if (existing) return existing;

    const alert = await this.repo.save(
      this.repo.create({
        seniorId,
        message: dto.message ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
      }),
    );
    const senior = await this.users.findById(seniorId);
    this.realtime.emitToSenior(seniorId, RealtimeEvents.ALERT_CREATED, {
      alert,
      seniorName: senior?.fullName,
    });
    return alert;
  }

  /** Clôture une alerte : autorisé pour le senior concerné ou un proche rattaché. */
  async resolve(alertId: string, user: AuthUser) {
    const alert = await this.repo.findOne({ where: { id: alertId } });
    if (!alert) throw new NotFoundException('Alerte introuvable.');

    if (user.role === Role.SENIOR && alert.seniorId !== user.id) throw new ForbiddenException();
    if (user.role === Role.FAMILY) await this.links.assertLinked(user.id, alert.seniorId);

    if (alert.status === AlertStatus.ACTIVE) {
      alert.status = AlertStatus.RESOLVED;
      alert.resolvedAt = new Date();
      alert.resolvedById = user.id;
      await this.repo.save(alert);
      const resolver = await this.users.findById(user.id);
      this.realtime.emitToSenior(alert.seniorId, RealtimeEvents.ALERT_RESOLVED, {
        alert,
        resolvedByName: resolver?.fullName,
      });
    }
    return alert;
  }

  findActiveForSenior(seniorId: string) {
    return this.repo.findOne({ where: { seniorId, status: AlertStatus.ACTIVE } });
  }

  findActiveForSeniors(seniorIds: string[]) {
    if (seniorIds.length === 0) return Promise.resolve([] as Alert[]);
    return this.repo.find({ where: { seniorId: In(seniorIds), status: AlertStatus.ACTIVE } });
  }

  findHistory(seniorId: string, limit = 50) {
    return this.repo.find({ where: { seniorId }, order: { createdAt: 'DESC' }, take: limit });
  }
}
