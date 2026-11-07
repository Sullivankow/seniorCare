import { API_URL } from "../config";
import { File as ExpoFile } from "expo-file-system";
import { Platform } from "react-native";

/** Token JWT courant, alimenté par AuthContext. */
let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

/** Erreur API avec le message renvoyé par le serveur (déjà lisible en français). */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function connectionError(error: unknown) {
  const reason = error instanceof Error ? ` (${error.message})` : "";
  return new ApiError(
    `Impossible de joindre ${API_URL}${reason}. Vérifiez que l'API tourne et que le téléphone est sur le même Wi-Fi.`,
    0,
  );
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join("\n")
      : data?.message;
    throw new ApiError(message ?? "Une erreur est survenue.", response.status);
  }
  return data as T;
}

/**
 * Petit client HTTP typé : ajoute le token, sérialise le JSON, remonte des erreurs propres.
 * Tous les appels de l'app passent par ici (un seul endroit à modifier pour gérer les erreurs/refresh).
 */
export async function request<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error: unknown) {
    throw connectionError(error);
  }

  return parseResponse<T>(response);
}

/** Envoie un fichier multipart sans fixer Content-Type, pour laisser RN générer le boundary. */
export async function uploadFile<T>(
  path: string,
  file: { uri: string; name: string; type: string; blob?: Blob },
  fields: Record<string, string>,
  fieldName = "audio",
): Promise<T> {
  const form = new FormData();
  if (Platform.OS === "web") {
    let blob = file.blob;
    if (!blob) {
      try {
        const localFile = await fetch(file.uri);
        if (!localFile.ok) throw new Error("Fichier local introuvable.");
        blob = await localFile.blob();
      } catch {
        throw new ApiError("Impossible de lire le fichier sélectionné.", 0);
      }
    }
    form.append(fieldName, blob, file.name);
  } else {
    // Expo's native FormData converter accepts Blob/File objects, not URI descriptors.
    form.append(fieldName, new ExpoFile(file.uri), file.name);
  }
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: form,
    });
  } catch (error: unknown) {
    throw connectionError(error);
  }

  return parseResponse<T>(response);
}
