import Constants from 'expo-constants';

/**
 * Adresse de l'API.
 * 1. EXPO_PUBLIC_API_URL si définie (ex. serveur déployé)
 * 2. Sinon : l'IP du PC qui sert Expo (détectée automatiquement) + port 3000.
 *    C'est ce qui permet à Expo Go sur votre téléphone de joindre l'API locale sans rien configurer.
 */
function resolveApiOrigin(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const hostUri = Constants.expoConfig?.hostUri; // ex. "192.168.1.20:8081"
  const host = hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:3000`;
}

export const API_ORIGIN = resolveApiOrigin();
export const API_URL = `${API_ORIGIN}/api`;
export const REALTIME_URL = `${API_ORIGIN}/realtime`;
