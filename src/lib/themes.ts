export const baseDark = {
  background: "#07070A",
  surface: "#0E0E14",
  raised: "#151520",
  hover: "#1C1C28",
  border: "rgba(255, 255, 255, 0.08)",
  borderStrong: "#68687F",
  text: "#EDEDF2",
  secondary: "#B6B6C6",
  muted: "#8B8BA0",
  accent: "#C6FF3D",
  // Brand violet is decorative; use accent2Text for small secondary-accent text.
  accent2: "#7B61FF",
  accent2Text: "#AA98FF",
  accentHover: "#D5FF79",
  accentInk: "#07070A",
  correct: "#EDEDF2",
  error: "#FF4D6D",
  errorSurface: "#29121B",
  extra: "#FF4D6D",
  success: "#3DFFA2",
  info: "#AA98FF",
};
export type ThemeColors = typeof baseDark;
export interface ForgeTheme {
  id: string;
  name: string;
  light: boolean;
  colors: ThemeColors;
}
const variant = (
  id: string,
  name: string,
  changes: Partial<ThemeColors>,
  light = false,
): ForgeTheme => ({ id, name, light, colors: { ...baseDark, ...changes } });
const lightColors: ThemeColors = {
  background: "#F6F7FA",
  surface: "#FFFFFF",
  raised: "#EDF1F6",
  hover: "#E4EAF2",
  border: "#C9D2DE",
  borderStrong: "#67778D",
  text: "#121A26",
  secondary: "#4F5D70",
  muted: "#5B687A",
  accent: "#496600",
  accent2: "#6546D8",
  accent2Text: "#6546D8",
  accentHover: "#354D00",
  accentInk: "#FFFFFF",
  correct: "#202B3C",
  error: "#B42336",
  errorSurface: "#FDE9ED",
  extra: "#9F2B42",
  success: "#12683D",
  info: "#175FA8",
};
export const THEMES: ForgeTheme[] = [
  variant("sparow-dark", "Sparow dark", {}),
  { id: "sparow-light", name: "Sparow light", light: true, colors: lightColors },
  variant("graphite", "Graphite", {
    background: "#111111",
    surface: "#191919",
    raised: "#222222",
    hover: "#292929",
    border: "#383838",
    borderStrong: "#818181",
    muted: "#9191A6",
    accent: "#E4E4E4",
    accentHover: "#FFFFFF",
    accentInk: "#161616",
  }),
  variant("midnight-blue", "Midnight blue", {
    background: "#090F1C",
    surface: "#101A2C",
    raised: "#17243A",
    hover: "#20304B",
    accent: "#88C8FF",
    accentHover: "#B2DBFF",
    accentInk: "#071B2D",
    muted: "#9999AE",
    error: "#FF6882",
    extra: "#FF6882",
  }),
  variant("ember", "Ember", {
    background: "#150D0D",
    surface: "#211615",
    raised: "#2B1D1B",
    hover: "#382624",
    accent: "#FFAF89",
    accentHover: "#FFC8AD",
    accentInk: "#321209",
    border: "#493631",
    muted: "#9292A7",
    error: "#FF5675",
    extra: "#FF5675",
  }),
  variant("mono-ink", "Mono ink", {
    background: "#080808",
    surface: "#121212",
    raised: "#1D1D1D",
    hover: "#292929",
    text: "#FFFFFF",
    correct: "#FFFFFF",
    muted: "#A8A8A8",
    secondary: "#C4C4C4",
    accent: "#FFFFFF",
    accentHover: "#DDDDDD",
    accentInk: "#000000",
    border: "#404040",
    borderStrong: "#919191",
  }),
  {
    id: "paper",
    name: "Paper",
    light: true,
    colors: {
      ...lightColors,
      background: "#F5F1E8",
      surface: "#FFFCF5",
      raised: "#ECE6D9",
      hover: "#E5DECE",
      text: "#292820",
      correct: "#292820",
      muted: "#676150",
      secondary: "#575242",
      accent: "#655016",
      accentHover: "#4D3C0F",
      border: "#CFC6B2",
    },
  },
  variant("aurora", "Aurora", {
    background: "#0A1314",
    surface: "#111F21",
    raised: "#182A2D",
    hover: "#223A3E",
    border: "#35494C",
    accent: "#86E5C6",
    accentHover: "#B0F4DF",
    accentInk: "#07271F",
    muted: "#A1A1B6",
    error: "#FF8098",
    extra: "#FF8098",
  }),
];
/** Legacy preference values keep their meaning after the brand/theme rename. */
export function resolveThemeId(id: unknown): string | undefined {
  const candidate = id === "forge-dark"
    ? "sparow-dark"
    : id === "forge-light"
      ? "sparow-light"
      : id;
  return THEMES.some((theme) => theme.id === candidate) ? candidate as string : undefined;
}
export function hexToHsl(hex: string): string {
  const rgba = hex.match(/^rgba\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)$/);
  const [r, g, b] = rgba
    ? rgba.slice(1, 4).map((value) => Number(value) / 255)
    : hex.replace("#", "").match(/../g)!.slice(0, 3).map((v) => parseInt(v, 16) / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    l = (max + min) / 2;
  let h = 0;
  if (d)
    h =
      max === r
        ? (g - b) / d + (g < b ? 6 : 0)
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return `${(h * 60).toFixed(2)} ${(s * 100).toFixed(2)}% ${(l * 100).toFixed(2)}%${rgba ? ` / ${rgba[4]}` : ""}`;
}
export function applyTheme(id: string, root = document.documentElement) {
  const theme = THEMES.find((t) => t.id === resolveThemeId(id)) || THEMES[0],
    c = theme.colors;
  root.dataset.theme = theme.id;
  root.classList.toggle("dark", !theme.light);
  root.style.colorScheme = theme.light ? "light" : "dark";
  if (typeof document !== "undefined" && root === document.documentElement) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", c.background);
  }
  const aliases: Record<string, string> = {
    background: c.background,
    foreground: c.text,
    card: c.surface,
    "card-foreground": c.text,
    popover: c.raised,
    "popover-foreground": c.text,
    primary: c.accent,
    "primary-foreground": c.accentInk,
    secondary: c.raised,
    "secondary-foreground": c.text,
    muted: c.raised,
    "muted-foreground": c.muted,
    "ui-accent": c.hover,
    "accent-foreground": c.text,
    destructive: c.error,
    "destructive-foreground": c.background,
    "ui-success": c.success,
    "success-foreground": c.background,
    warning: c.accent,
    "warning-foreground": c.accentInk,
    "ui-border": c.border,
    input: c.borderStrong,
    ring: c.accent,
    "typing-correct": c.correct,
    "typing-error": c.error,
    "typing-current": c.accent,
    "typing-upcoming": c.muted,
    "typing-bg": c.background,
  };
  Object.entries(c).forEach(([key, value]) =>
    root.style.setProperty(`--forge-${key}`, value),
  );
  Object.entries(aliases).forEach(([key, value]) =>
    root.style.setProperty(`--${key}`, hexToHsl(value)),
  );
  Object.entries({
    bg: c.background,
    surface: c.surface,
    "surface-2": c.raised,
    border: c.border,
    text: c.text,
    "text-dim": c.muted,
    accent: c.accent,
    "accent-2": c.accent2,
    accent2: c.accent2,
    "text-accent-2": c.accent2Text,
    error: c.error,
    success: c.success,
  }).forEach(([key, value]) => root.style.setProperty(`--${key}`, value));
}
