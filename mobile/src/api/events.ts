/** Noms des évènements temps réel (identiques à ceux du backend : realtime.events.ts). */
export const RealtimeEvents = {
  CHECKIN_CREATED: "checkin:created",
  ALERT_CREATED: "alert:created",
  ALERT_RESOLVED: "alert:resolved",
  VOICE_MESSAGE_CREATED: "voice-message:created",
} as const;
