// Modern dark theme colors with blue accent (Messenger-inspired)
export const Colors = {
  // Background colors
  background: '#0B141A', // Main background (very dark blue-gray)
  backgroundSecondary: '#1F2C34', // Cards, headers (dark gray-blue)
  backgroundTertiary: '#2A3942', // Subtle elements

  // Primary colors - BLUE THEME
  primary: '#0084FF', // Messenger blue for main actions
  primaryDark: '#0066CC', // Darker blue for pressed states
  primaryLight: '#4A9EFF', // Lighter blue for highlights

  // Accent colors
  accent: '#0084FF', // Bright blue for links, icons
  accentDark: '#0066CC', // Darker blue
  accentLight: '#4A9EFF', // Lighter blue

  // Text colors
  textPrimary: '#FFFFFF', // Main text
  textSecondary: '#8696A0', // Secondary text (gray)
  textTertiary: '#667781', // Tertiary text (darker gray)
  textDisabled: '#3B4A54', // Disabled text

  // Message bubbles
  bubbleOwn: '#0084FF', // Your messages (blue)
  bubbleOther: '#1F2C34', // Others' messages (dark gray)

  // Status colors
  success: '#0084FF', // Blue for success
  error: '#F15C6D', // Softer red
  warning: '#F5A623',
  info: '#0084FF',

  // Borders
  border: '#2A3942',
  borderLight: '#3B4A54',

  // Special
  online: '#0084FF', // Blue for online status
  offline: '#667781',
  unread: '#0084FF', // Blue for unread badge

  // Overlays
  overlay: 'rgba(11, 20, 26, 0.9)',
  overlayLight: 'rgba(31, 44, 52, 0.95)',
};

// Typography
export const Typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

// Spacing (8px base unit)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 1000, // Fully rounded
};

// Shadows (iOS style)
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
