export const theme = {
  colors: {
    // Bole.to brand palette
    bg: "#0A0D14",
    
    // Legacy colors for compatibility
    black: "#0A0D14",
    blackSoft: "#111623",
    darkGray: "#151B2C",
    midGray: "#333333",
    lightGray: "#666666",
    offWhite: "#F5F5F5",
    white: "#FFFFFF",
    
    // Brand gradients
    gradient: {
      primary: ["#00E0FF", "#7C5CFF"],
      accent: ["#22D3EE", "#14B8A6"],
      warm: ["#FF7A59", "#F44173"],
      dark: ["#111623", "#151B2C"],
      subtle: ["#F5F5F5", "#E0E0E0"],
      ticket: ["#3AA3FF", "#FF7A59"], // center nav icon gradient
    },
    
    // Status colors
    success: "#4CAF50",
    warning: "#FF9500",
    error: "#FF3B30",
    info: "#007AFF",
    
    // Surface colors
    surface: {
      primary: "#0A0D14",
      secondary: "#111623",
      tertiary: "#151B2C",
      card: "#111623",
      overlay: "rgba(10, 13, 20, 0.9)",
    },
    
    // Text colors  
    text: {
      primary: "#E5ECFF",
      secondary: "#A9B1C7",
      tertiary: "#6B7280",
      onLight: "#0A0D14",
      onDark: "#E5ECFF",
    },
    
    // Border colors
    border: {
      primary: "rgba(255,255,255,0.06)",
      secondary: "rgba(255,255,255,0.03)",
      light: "#E0E0E0",
    },
    
    // Navigation colors
    nav: {
      bg: "rgba(17,22,35,0.92)",
      border: "rgba(255,255,255,0.06)",
      text: "#E5ECFF",
      textDim: "rgba(229,236,255,0.8)",
      white: "#FFFFFF",
      glowBlue: "rgba(58,163,255,0.35)",
      glowOrange: "rgba(255,122,89,0.35)",
    },
  },
  
  typography: {
    // Font weights
    weights: {
      regular: "400",
      medium: "500", 
      semibold: "600",
      bold: "700",
    },
    
    // Font sizes
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      huge: 32,
    },
    
    // Line heights
    lineHeights: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    huge: 32,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 22,
    nav: 28, // navigation capsule radius
    round: 50,
  },
  
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    nav: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 20,
    },
    glow: {
      shadowColor: "#3AA3FF",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    },
  },
  
  dimensions: {
    // Component sizes
    topBarHeight: 56,
    quickActionHeight: 72,
    eventCardSize: 160,
    
    // Layout
    screenPadding: 16,
    sectionGap: 20,
    cardGap: 12,
  },
};

export type Theme = typeof theme;