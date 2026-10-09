/** Types partagés : miroir des réponses de l'API NestJS. */
export type Role = 'SENIOR' | 'FAMILY';
export type CheckInStatus = 'OK' | 'NOT_GREAT';
export type AlertStatus = 'ACTIVE' | 'RESOLVED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  /** Présent uniquement pour les seniors : code à donner à la famille. */
  inviteCode?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface CheckIn {
  id: string;
  seniorId: string;
  status: CheckInStatus;
  note?: string | null;
  createdAt: string;
}

export interface Alert {
  id: string;
  seniorId: string;
  status: AlertStatus;
  message?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

/** Carte du tableau de bord famille. */
export interface SeniorSummary {
  senior: { id: string; fullName: string };
  lastCheckIn: CheckIn | null;
  activeAlert: Alert | null;
  checkedInToday: boolean;
}
