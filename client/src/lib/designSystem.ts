/**
 * GroomerFlow Design System
 * Paleta Premium: Dourado/Âmbar + Escuro + Off-white
 */

export const colors = {
  // Primary - Dourado/Âmbar
  primary: {
    50: "#FEF8F0",
    100: "#FDF0E1",
    200: "#FAE0C3",
    300: "#F7D0A5",
    400: "#E8B547",
    500: "#D4AF37", // Dourado principal
    600: "#C09B2E",
    700: "#A68225",
    800: "#8C691C",
    900: "#725013",
  },

  // Secondary - Escuro
  dark: {
    50: "#F8F8F8",
    100: "#F0F0F0",
    200: "#E0E0E0",
    300: "#C0C0C0",
    400: "#808080",
    500: "#404040",
    600: "#2A2A2A",
    700: "#1F1F1F",
    800: "#1A1A1A", // Escuro principal
    900: "#0F0F0F",
  },

  // Neutral - Off-white/Cinza
  neutral: {
    50: "#FAFAFA",
    100: "#F5F5F5", // Off-white principal
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },

  // Semantic
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

export const typography = {
  fontFamily: {
    sans: '"Inter", "Helvetica Neue", sans-serif',
    mono: '"Fira Code", monospace',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "2.5rem",
  "3xl": "3rem",
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  gold: "0 4px 12px rgba(212, 175, 55, 0.15)",
};

export const borderRadius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
};
