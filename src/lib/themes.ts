export const baseDark = {
  background: "#0B0D12",
  surface: "#11141B",
  raised: "#171B24",
  hover: "#1F2430",
  border: "#2D3746",
  borderStrong: "#65758B",
  text: "#EEF1F7",
  secondary: "#AAB6C6",
  muted: "#8796A8",
  accent: "#F5B544",
  accentHover: "#FFC568",
  accentInk: "#201404",
  correct: "#EEF1F7",
  error: "#FF7A85",
  errorSurface: "#351C25",
  extra: "#E88891",
  success: "#55D6A0",
  info: "#70B7FF",
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
  muted: "#5F6C7E",
  accent: "#9B5700",
  accentHover: "#814600",
  accentInk: "#FFFFFF",
  correct: "#202B3C",
  error: "#B42336",
  errorSurface: "#FDE9ED",
  extra: "#9F2B42",
  success: "#12683D",
  info: "#175FA8",
};
export const THEMES: ForgeTheme[] = [
  variant("forge-dark", "Forge dark", {}),
  { id: "forge-light", name: "Forge light", light: true, colors: lightColors },
  variant("graphite", "Graphite", {
    background: "#111111",
    surface: "#191919",
    raised: "#222222",
    hover: "#292929",
    border: "#383838",
    borderStrong: "#818181",
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
      muted: "#696352",
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
  }),
];
export function hexToHsl(hex: string): string {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/../g)!
    .map((v) => parseInt(v, 16) / 255);
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
  return `${(h * 60).toFixed(2)} ${(s * 100).toFixed(2)}% ${(l * 100).toFixed(2)}%`;
}
export function applyTheme(id: string, root = document.documentElement) {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0],
    c = theme.colors;
  root.dataset.theme = theme.id;
  root.classList.toggle("dark", !theme.light);
  root.style.colorScheme = theme.light ? "light" : "dark";
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
    accent: c.hover,
    "accent-foreground": c.text,
    destructive: c.error,
    "destructive-foreground": c.background,
    success: c.success,
    "success-foreground": c.background,
    warning: c.accent,
    "warning-foreground": c.accentInk,
    border: c.border,
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
}
