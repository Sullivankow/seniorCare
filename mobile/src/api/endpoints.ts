import { request } from "./client";
import {
  Alert,
  AuthResponse,
  CheckIn,
  CheckInStatus,
  DirectoryContact,
  Role,
  SeniorSummary,
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
