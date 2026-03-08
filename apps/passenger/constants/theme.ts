/**
 * CabConnect Design Tokens
 * Single source of truth for colors, shadows, and spacing.
 * Import from here instead of hardcoding hex values.
 */

export const COLORS = {
  // Brand
  primary: "#10b981",
  primaryLight: "#ecfdf5",
  primaryDark: "#059669",

  // Secondary
  secondary: "#0891b2",
  secondaryLight: "#cffafe",

  // Accent
  accent: "#f59e0b",
  accentLight: "#fef3c7",

  // Semantic
  danger: "#F56565",
  dangerLight: "#FFF5F5",
  warning: "#EAB308",
  warningLight: "#FFFBEB",
  success: "#10b981",

  // Backgrounds
  background: "#F6F8FA",      // general-500 — page bg
  card: "#FFFFFF",
  cardBorder: "#F1F5F9",

  // Text
  textPrimary: "#1a1a2e",
  textSecondary: "#6b7280",
  textMuted: "#9ca3af",
  textOnPrimary: "#FFFFFF",

  // Neutral
  neutral50: "#fafafa",
  neutral100: "#f5f5f5",
  neutral200: "#e5e5e5",
  neutral300: "#d4d4d4",
  neutral400: "#a3a3a3",
  neutral500: "#737373",
  neutral600: "#525252",
  neutral700: "#404040",
  neutral800: "#262626",
  neutral900: "#171717",
} as const;

/** Standard ActivityIndicator / RefreshControl color */
export const ACTIVITY_COLOR = COLORS.primary;

/** Standard card shadow style (for use with `style` prop) */
export const SHADOW_SM = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 2,
};

export const SHADOW_MD = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 4,
};

export const SHADOW_LG = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 8,
};
