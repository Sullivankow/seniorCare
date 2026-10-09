import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { LinksService } from '../links/links.service';
import { Role } from '../common/role.enum';
import { seniorRoom } from './realtime.events';

/**
 * Passerelle temps réel (namespace /realtime).
 *
 * Connexion : le client envoie son JWT dans `auth: { token }`.
 *  - un SENIOR rejoint la room de son propre compte
 *  - un membre de la FAMILLE rejoint la room de chaque senior qu'il suit
 * Ainsi, un évènement émis vers `senior:<id>` n'atteint que les personnes concernées.
 */
@WebSocketGateway({ namespace: '/realtime', cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly links: LinksService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      const payload = await this.jwt.verifyAsync<{ sub: string; role: Role }>(token);

      client.join(`user:${payload.sub}`); // room personnelle (utile pour abonner plus tard)
      if (payload.role === Role.SENIOR) {
        client.join(seniorRoom(payload.sub));
      } else {
        const seniorIds = await this.links.getSeniorIdsForFamily(payload.sub);
        seniorIds.forEach((id) => client.join(seniorRoom(id)));
      }
    } catch {
      client.disconnect(true); // token absent ou invalide
    }
  }

  /** Diffuse un évènement à toutes les personnes liées à ce senior. */
  emitToSenior(seniorId: string, event: string, payload: unknown) {
    this.server.to(seniorRoom(seniorId)).emit(event, payload);
  }

  /** Abonne immédiatement les appareils connectés d'un proche à un nouveau senior. */
  subscribeFamilyToSenior(familyId: string, seniorId: string) {
    this.server.in(`user:${familyId}`).socketsJoin(seniorRoom(seniorId));
  }
}
