import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const REMINDER_HOUR = 20;
const SCHEDULE_DAYS = 30;
const REMINDER_TYPE = "checkin-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function preferenceKey(userId: string) {
  return `seniorcare.checkin-reminder.${userId}`;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isReminderForUser(
  notification: Notifications.NotificationRequest,
  userId: string,
) {
  return (
    notification.content.data?.type === REMINDER_TYPE &&
    notification.content.data?.userId === userId
  );
}

async function cancelUserReminders(userId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => isReminderForUser(notification, userId))
      .map((notification) =>
        Notifications.cancelScheduledNotificationAsync(notification.identifier),
      ),
  );
}

/**
 * Planifie seulement les jours sans pointage connu. Le renouvellement à l'ouverture
 * maintient un horizon borné pour respecter les quotas iOS de notifications en attente.
 */
export async function syncCheckInReminders(
  userId: string,
  lastCheckInAt: string | null,
) {
  if (
    Platform.OS === "web" ||
    (await SecureStore.getItemAsync(preferenceKey(userId))) !== "enabled"
  )
    return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existingByDate = new Map<string, string>();
  const duplicateIds: string[] = [];
  for (const notification of scheduled) {
    if (!isReminderForUser(notification, userId)) continue;
    const dateKey = notification.content.data?.dateKey;
    if (typeof dateKey !== "string") {
      duplicateIds.push(notification.identifier);
    } else if (existingByDate.has(dateKey)) {
      duplicateIds.push(notification.identifier);
    } else {
      existingByDate.set(dateKey, notification.identifier);
    }
  }

  const now = new Date();
  const checkedInDateKey = lastCheckInAt
    ? localDateKey(new Date(lastCheckInAt))
    : null;
  const desiredDates = new Map<string, Date>();
  for (let offset = 0; offset < SCHEDULE_DAYS; offset += 1) {
    const reminderAt = new Date(now);
    reminderAt.setDate(now.getDate() + offset);
    reminderAt.setHours(REMINDER_HOUR, 0, 0, 0);
    const dateKey = localDateKey(reminderAt);
    if (reminderAt <= now || dateKey === checkedInDateKey) continue;
    desiredDates.set(dateKey, reminderAt);
  }

  await Promise.all([
    ...duplicateIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id),
    ),
    ...[...existingByDate]
      .filter(([dateKey]) => !desiredDates.has(dateKey))
      .map(([, id]) => Notifications.cancelScheduledNotificationAsync(id)),
  ]);

  await Promise.all(
    [...desiredDates]
      .filter(([dateKey]) => !existingByDate.has(dateKey))
      .map(([dateKey, reminderAt]) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Votre pointage du jour",
            body: "Pensez à indiquer à vos proches que vous allez bien.",
            sound: "default",
            data: { type: REMINDER_TYPE, userId, dateKey },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminderAt,
          },
        }),
      ),
  );
}

export async function isCheckInReminderEnabled(userId: string) {
  if (Platform.OS === "web") return false;
  return (await SecureStore.getItemAsync(preferenceKey(userId))) === "enabled";
}

/** Renvoie false si les notifications ne sont pas autorisées ou disponibles. */
export async function configureCheckInReminder(
  userId: string,
  enabled: boolean,
  lastCheckInAt: string | null,
) {
  if (Platform.OS === "web") return false;

  if (!enabled) {
    await SecureStore.deleteItemAsync(preferenceKey(userId));
    await cancelUserReminders(userId);
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Rappels de pointage",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;

  await SecureStore.setItemAsync(preferenceKey(userId), "enabled");
  try {
    await syncCheckInReminders(userId, lastCheckInAt);
  } catch (error) {
    await SecureStore.deleteItemAsync(preferenceKey(userId));
    await cancelUserReminders(userId);
    throw error;
  }
  return true;
}
