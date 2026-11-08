/** Noms des évènements temps réel (identiques à ceux du backend : realtime.events.ts). */
export const RealtimeEvents = {
  CHECKIN_CREATED: "checkin:created",
  CHECKIN_DELETED: "checkin:deleted",
  ALERT_CREATED: "alert:created",
  ALERT_RESOLVED: "alert:resolved",
  VOICE_MESSAGE_CREATED: "voice-message:created",
  VOICE_MESSAGE_DELETED: "voice-message:deleted",
  PHOTO_CREATED: "photo:created",
  PHOTO_REACTION_UPDATED: "photo:reaction-updated",
} as const;
