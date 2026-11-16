/**
 * Design tokens de l'application : une seule source de vérité pour couleurs, tailles et espacements.
 * Pensé pour les seniors : texte large, fort contraste, grandes zones tactiles.
 */
export type ThemeMode = "light" | "dark";

export interface AppColors {
  bg: string;
  surface: string;
  ink: string;
  inkSoft: string;
  line: string;
  primary: string;
  primarySoft: string;
  ok: string;
  okSoft: string;
  warn: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  white: string;
  seniorBg: string;
  seniorPanel: string;
  seniorLine: string;
  seniorOk: string;
  seniorBlue: string;
  seniorPurple: string;
  seniorOrange: string;
}

const lightColors: AppColors = {
  bg: "#F4F7F8",
  surface: "#FFFFFF",
  ink: "#15252D",
  inkSoft: "#52636C",
  line: "#DCE5E8",
  primary: "#0E5A6B", // bleu-vert profond
  primarySoft: "#E4F1F4",
  ok: "#18794E",
  okSoft: "#E5F3EA",
  warn: "#8A4B00",
  warnSoft: "#FFF1D8",
  danger: "#B42318",
  dangerSoft: "#FDE9E7",
  white: "#FFFFFF",
  // Aliases senior : mêmes surfaces que l'app, avec des aplats d'action à contraste élevé.
  seniorBg: "#F4F7F8",
  seniorPanel: "#0E5A6B",
  seniorLine: "#DCE5E8",
  seniorOk: "#18794E",
  seniorBlue: "#0E5A6B",
  seniorPurple: "#1D737C",
  seniorOrange: "#286878",
};

const darkColors: AppColors = {
  bg: "#111B1F",
  surface: "#1C292E",
  ink: "#EFF5F5",
  inkSoft: "#B6C5C9",
  line: "#35484E",
  primary: "#72C4CE",
  primarySoft: "#263F44",
  ok: "#69C58D",
  okSoft: "#243D30",
  warn: "#F0BF72",
  warnSoft: "#49391F",
  danger: "#F28A82",
  dangerSoft: "#482B2A",
  white: "#FFFFFF",
  seniorBg: "#111B1F",
  seniorPanel: "#1C5962",
  seniorLine: "#35484E",
  seniorOk: "#69C58D",
  seniorBlue: "#246B79",
  seniorPurple: "#236873",
  seniorOrange: "#315F68",
};

export const getColors = (mode: ThemeMode): AppColors =>
  mode === "dark" ? darkColors : lightColors;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 4, md: 8, lg: 8, pill: 999 };

export const font = {
  body: 18,
  small: 15,
  title: 28,
  huge: 36,
  action: 23,
};
