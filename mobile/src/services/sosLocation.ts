import * as Location from "expo-location";

const LOCATION_TIMEOUT_MS = 8_000;

/** Demande l'accès ponctuel au GPS uniquement lors du déclenchement du SOS. */
export async function getSosCoordinates(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== "granted") return null;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      // Ne pas retarder indéfiniment une alerte si l'appareil ne fournit pas de position.
      const position = await Promise.race([
        Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }),
        new Promise<null>((resolve) => {
          timeoutId = setTimeout(() => resolve(null), LOCATION_TIMEOUT_MS);
        }),
      ]);
      if (!position) return null;
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  } catch {
    // Une défaillance du GPS ne doit jamais empêcher l'envoi de l'alerte.
    return null;
  }
}
