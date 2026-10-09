/** Noms des évènements Socket.IO (partagés avec l'app mobile : mobile/src/api/events.ts). */
export const RealtimeEvents = {
  CHECKIN_CREATED: 'checkin:created',
  ALERT_CREATED: 'alert:created',
  ALERT_RESOLVED: 'alert:resolved',
} as const;

/** Nom de la « room » Socket.IO d'un senior : la famille et le senior y sont abonnés. */
export const seniorRoom = (seniorId: string) => `senior:${seniorId}`;
