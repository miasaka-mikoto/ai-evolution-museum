export interface VisualTheme {
  id: string;
  label: string;
  era: "mechanical" | "symbolic" | "search" | "learning" | "modern" | "agent";
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  line: string;
  grid: string;
  node: string;
  active: string;
  success: string;
  warning: string;
  error: string;
  accent: string;
  glow: string;
  fontSans: string;
  fontMono: string;
  lineWidth: number;
  glowRadius: number;
}

export const THEMES: Record<string, VisualTheme> = {
  mechanical: {
    id: "mechanical",
    label: "Mechanical Origins",
    era: "mechanical",
    background: "#11110f",
    surface: "#1c1b17",
    foreground: "#ece8dc",
    muted: "#a19b8c",
    line: "#c7bfae",
    grid: "rgba(199,191,174,.12)",
    node: "#d8d0ba",
    active: "#e9bc68",
    success: "#a9c9a2",
    warning: "#e9bc68",
    error: "#d97967",
    accent: "#d4a85b",
    glow: "rgba(212,168,91,.35)",
    fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontMono: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace",
    lineWidth: 1,
    glowRadius: 8,
  },
  symbolic: {
    id: "symbolic",
    label: "Symbolic Systems",
    era: "symbolic",
    background: "#101417",
    surface: "#182026",
    foreground: "#e5edf0",
    muted: "#93a5aa",
    line: "#9fb7bc",
    grid: "rgba(159,183,188,.12)",
    node: "#c8dce0",
    active: "#dbb36a",
    success: "#9ec6aa",
    warning: "#dbb36a",
    error: "#cf7b76",
    accent: "#81aeb7",
    glow: "rgba(129,174,183,.3)",
    fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontMono: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace",
    lineWidth: 1,
    glowRadius: 9,
  },
  search: {
    id: "search",
    label: "Search and Planning",
    era: "search",
    background: "#111519",
    surface: "#182026",
    foreground: "#e6ece9",
    muted: "#8d9d9a",
    line: "#9aaca5",
    grid: "rgba(154,172,165,.14)",
    node: "#c1d2ca",
    active: "#d9b969",
    success: "#a6caa0",
    warning: "#d9b969",
    error: "#d17a72",
    accent: "#7eb1a0",
    glow: "rgba(126,177,160,.28)",
    fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontMono: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace",
    lineWidth: 1,
    glowRadius: 10,
  },
  learning: {
    id: "learning",
    label: "Learning Machines",
    era: "learning",
    background: "#121417",
    surface: "#1b2024",
    foreground: "#eceeef",
    muted: "#969da4",
    line: "#a9b2b8",
    grid: "rgba(169,178,184,.12)",
    node: "#d4dde0",
    active: "#d4b369",
    success: "#9fc4a3",
    warning: "#d4b369",
    error: "#cf7b7c",
    accent: "#91a9bd",
    glow: "rgba(145,169,189,.3)",
    fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontMono: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace",
    lineWidth: 1,
    glowRadius: 11,
  },
  modern: {
    id: "modern",
    label: "Representation and Prediction",
    era: "modern",
    background: "#0d1117",
    surface: "#151c24",
    foreground: "#edf1f4",
    muted: "#87919d",
    line: "#a6b1bd",
    grid: "rgba(166,177,189,.13)",
    node: "#cad5dd",
    active: "#ddbb72",
    success: "#9ec8b3",
    warning: "#ddbb72",
    error: "#d27b7a",
    accent: "#8aaac2",
    glow: "rgba(138,170,194,.32)",
    fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontMono: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace",
    lineWidth: 1,
    glowRadius: 12,
  },
  agent: {
    id: "agent",
    label: "Agents and World Models",
    era: "agent",
    background: "#0e1215",
    surface: "#172027",
    foreground: "#eff2eb",
    muted: "#8d9b99",
    line: "#a8b9ad",
    grid: "rgba(168,185,173,.13)",
    node: "#cadbcf",
    active: "#e0bc6a",
    success: "#a2cbaa",
    warning: "#e0bc6a",
    error: "#d27a72",
    accent: "#8db7a2",
    glow: "rgba(141,183,162,.34)",
    fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
    fontMono: "IBM Plex Mono, ui-monospace, SFMono-Regular, monospace",
    lineWidth: 1,
    glowRadius: 13,
  },
};

export function themeForYear(year: number): VisualTheme {
  if (year <= 1949) return THEMES.mechanical;
  if (year <= 1969) return THEMES.symbolic;
  if (year <= 1979) return THEMES.search;
  if (year <= 2009) return THEMES.learning;
  if (year <= 2019) return THEMES.modern;
  return THEMES.agent;
}

export const getThemeForYear = themeForYear;

export function themeCssVariables(theme: VisualTheme): Record<string, string> {
  return {
    "--aem-background": theme.background,
    "--aem-surface": theme.surface,
    "--aem-foreground": theme.foreground,
    "--aem-muted": theme.muted,
    "--aem-line": theme.line,
    "--aem-grid": theme.grid,
    "--aem-node": theme.node,
    "--aem-active": theme.active,
    "--aem-success": theme.success,
    "--aem-warning": theme.warning,
    "--aem-error": theme.error,
    "--aem-accent": theme.accent,
    "--aem-glow": theme.glow,
    "--aem-font-sans": theme.fontSans,
    "--aem-font-mono": theme.fontMono,
  };
}

export function applyThemeToElement(element: HTMLElement, theme: VisualTheme): void {
  Object.entries(themeCssVariables(theme)).forEach(([key, value]) => element.style.setProperty(key, value));
  element.dataset.aemTheme = theme.id;
}
