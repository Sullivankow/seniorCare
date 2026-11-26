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
  User,
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

/** Profil privé du compte connecté; l'image reste protégée par le JWT. */
export const userApi = {
  updateProfile: (data: { fullName: string; email: string }) =>
    request<User>("PUT", "/users/me", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ changed: boolean }>("POST", "/users/me/password", data),
  uploadProfilePhoto: (file: {
    uri: string;
    name: string;
    type: string;
    blob?: Blob;
  }) => uploadFile<User>("/users/me/photo", file, {}, "photo"),
  removeProfilePhoto: () => request<User>("DELETE", "/users/me/photo"),
  deleteProfile: (currentPassword: string) =>
    request<{ deleted: boolean }>("DELETE", "/users/me", { currentPassword }),
  profilePhotoUrl: (updatedAt?: string | null) => {
    const url = `${API_URL}/users/me/photo`;
    return updatedAt ? `${url}?v=${encodeURIComponent(updatedAt)}` : url;
  },
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
  updateContact: (
    id: string,
    data: { fullName: string; phone: string; email: string | null },
  ) => request<DirectoryContact>("PATCH", `/links/me/contacts/${id}`, data),
  deleteContact: (id: string) =>
    request<{ deleted: boolean }>("DELETE", `/links/me/contacts/${id}`),
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
  deleteForFamily: (seniorId: string, messageId: string) =>
    request<void>(
      "DELETE",
      `/family/seniors/${seniorId}/voice-messages/${messageId}`,
    ),
};

export const familyPhotosApi = {
  upload: (
    seniorId: string,
    file: { uri: string; name: string; type: string; blob?: Blob },
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
  deleteCheckIn: (seniorId: string, checkInId: string) =>
    request<void>(
      "DELETE",
      `/family/seniors/${seniorId}/checkins/${checkInId}`,
    ),
  alerts: (seniorId: string) =>
    request<Alert[]>("GET", `/family/seniors/${seniorId}/alerts`),
};
