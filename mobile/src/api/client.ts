import { API_URL } from '../config';

/** Token JWT courant, alimenté par AuthContext. */
let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** Erreur API avec le message renvoyé par le serveur (déjà lisible en français). */
export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Petit client HTTP typé : ajoute le token, sérialise le JSON, remonte des erreurs propres.
 * Tous les appels de l'app passent par ici (un seul endroit à modifier pour gérer les erreurs/refresh).
 */
export async function request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Impossible de joindre le serveur. Vérifiez que l'API tourne et que le téléphone est sur le même Wi-Fi.", 0);
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    // NestJS renvoie `message` en string ou en tableau (erreurs de validation)
    const msg = Array.isArray(data?.message) ? data.message.join('\n') : data?.message;
    throw new ApiError(msg ?? 'Une erreur est survenue.', response.status);
  }
  return data as T;
}
