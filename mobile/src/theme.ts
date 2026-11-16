/**
 * Design tokens de l'application : une seule source de vérité pour couleurs, tailles et espacements.
 * Pensé pour les seniors : texte large, fort contraste, grandes zones tactiles.
 */
export const colors = {
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

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 4, md: 8, lg: 8, pill: 999 };

export const font = {
  body: 18,
  small: 15,
  title: 28,
  huge: 36,
  action: 23,
};
