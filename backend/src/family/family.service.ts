import { Injectable } from "@nestjs/common";
import { LinksService } from "../links/links.service";
import { UsersService } from "../users/users.service";
import { CheckinsService } from "../checkins/checkins.service";
import { AlertsService } from "../alerts/alerts.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";

/** Logique « tableau de bord » de l'app FAMILLE : agrège utilisateurs, pointages et alertes. */
@Injectable()
export class FamilyService {
  constructor(
    private readonly links: LinksService,
    private readonly users: UsersService,
    private readonly checkins: CheckinsService,
    private readonly alerts: AlertsService,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** Rattache le proche à un senior et l'abonne au flux temps réel de ce senior. */
  async linkSenior(familyId: string, inviteCode: string) {
    const senior = await this.links.linkByInviteCode(familyId, inviteCode);
    this.realtime.subscribeFamilyToSenior(familyId, senior.id);
    return { id: senior.id, fullName: senior.fullName };
  }

  /** Une carte par senior suivi : dernier pointage, alerte active, a-t-il pointé aujourd'hui ? */
  async listSummaries(familyId: string) {
    const seniorIds = await this.links.getSeniorIdsForFamily(familyId);
    const [activeAlerts, seniors, lastCheckIns] = await Promise.all([
      this.alerts.findActiveForSeniors(seniorIds),
      this.users.findByIds(seniorIds),
      this.checkins.findLastForSeniors(seniorIds),
    ]);
    const activeAlertsBySeniorId = new Map(
      activeAlerts.map((alert) => [alert.seniorId, alert]),
    );
    const seniorsById = new Map(seniors.map((senior) => [senior.id, senior]));
    const lastCheckInsBySeniorId = new Map(
      lastCheckIns.map((checkIn) => [checkIn.seniorId, checkIn]),
    );

    // Début de journée (heure du serveur). Évolution prévue : fuseau horaire par utilisateur.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return seniorIds.map((seniorId) => {
      const senior = seniorsById.get(seniorId);
      const lastCheckIn = lastCheckInsBySeniorId.get(seniorId);
      return {
        senior: { id: seniorId, fullName: senior?.fullName ?? "Inconnu" },
        lastCheckIn: lastCheckIn ?? null,
        activeAlert: activeAlertsBySeniorId.get(seniorId) ?? null,
        checkedInToday: Boolean(
          lastCheckIn && lastCheckIn.createdAt >= startOfDay,
        ),
      };
    });
  }

  async getCheckins(familyId: string, seniorId: string) {
    await this.links.assertLinked(familyId, seniorId);
    return this.checkins.findHistory(seniorId);
  }

  /** Vérifie le lien familial avant de déléguer la suppression du pointage. */
  async deleteCheckIn(familyId: string, seniorId: string, checkInId: string) {
    await this.links.assertLinked(familyId, seniorId);
    await this.checkins.delete(seniorId, checkInId);
  }

  async getAlerts(familyId: string, seniorId: string) {
    await this.links.assertLinked(familyId, seniorId);
    return this.alerts.findHistory(seniorId);
  }
}
