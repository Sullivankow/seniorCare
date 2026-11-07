import { API_URL } from "../config";
import { request, uploadFile } from "./client";
import {
  Alert,
  AuthResponse,
  CheckIn,
  CheckInStatus,
  DirectoryContact,
  FamilyPhoto,
  Role,
  SeniorSummary,
  VoiceMessage,
} from "../types";

/** Un objet par domaine : facile à retrouver, facile à étendre. */

export const authApi = {
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    role: Role;
  }) => request<AuthResponse>("POST", "/auth/register", data),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("POST", "/auth/login", data),
};

/** Côté SENIOR */
export const checkinsApi = {
  create: (status: CheckInStatus, note?: string) =>
    request<CheckIn>("POST", "/checkins", { status, note }),
  last: () => request<CheckIn | null>("GET", "/checkins/me/last"),
};

export const alertsApi = {
  create: (message?: string) => request<Alert>("POST", "/alerts", { message }),
  myActive: () => request<Alert | null>("GET", "/alerts/me/active"),
  resolve: (id: string) => request<Alert>("POST", `/alerts/${id}/resolve`),
};

export const directoryApi = {
  listContacts: () => request<DirectoryContact[]>("GET", "/links/me/contacts"),
  createContact: (data: { fullName: string; phone: string; email?: string }) =>
    request<DirectoryContact>("POST", "/links/me/contacts", data),
};

export const voiceMessagesApi = {
  upload: (
    file: { uri: string; name: string; type: string },
    durationSeconds: number,
  ) =>
    uploadFile<VoiceMessage>("/voice-messages", file, {
      durationSeconds: String(durationSeconds),
    }),
  listForFamily: (seniorId: string) =>
    request<VoiceMessage[]>(
      "GET",
      `/family/seniors/${seniorId}/voice-messages`,
    ),
};

export const familyPhotosApi = {
  upload: (
    seniorId: string,
    file: { uri: string; name: string; type: string },
    fields: Record<string, string>,
  ) =>
    uploadFile<FamilyPhoto>(
      `/family/seniors/${seniorId}/photos`,
      file,
      fields,
      "photo",
    ),
  listForFamily: (seniorId: string) =>
    request<FamilyPhoto[]>("GET", `/family/seniors/${seniorId}/photos`),
  listMine: () => request<FamilyPhoto[]>("GET", "/photos/me"),
  imageUrl: (photoId: string) => `${API_URL}/photos/${photoId}/image`,
  like: (photoId: string) =>
    request<FamilyPhoto>("PUT", `/photos/${photoId}/like`),
  unlike: (photoId: string) =>
    request<FamilyPhoto>("DELETE", `/photos/${photoId}/like`),
};

/** Côté FAMILLE */
export const familyApi = {
  listSeniors: () => request<SeniorSummary[]>("GET", "/family/seniors"),
  linkSenior: (inviteCode: string) =>
    request<{ id: string; fullName: string }>("POST", "/family/seniors", {
      inviteCode,
    }),
  checkins: (seniorId: string) =>
    request<CheckIn[]>("GET", `/family/seniors/${seniorId}/checkins`),
  alerts: (seniorId: string) =>
    request<Alert[]>("GET", `/family/seniors/${seniorId}/alerts`),
};
