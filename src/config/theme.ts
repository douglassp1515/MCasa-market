import { IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";

const sans = Source_Sans_3({
  display: "swap",
  subsets: ["latin"],
  variable: "--app-font-sans",
});

const mono = IBM_Plex_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--app-font-mono",
  weight: ["400", "500"],
});

/** Paleta Vitrine Luar — #799DE2 / #868BDD (logo oficial). */
const colors = {
  light: {
    "--accent": "#868BDD",
    "--accent-foreground": "#FFFFFF",
    "--background": "#F7F6FC",
    "--border": "#DCD9F0",
    "--default": "#EEEBF8",
    "--default-foreground": "#2E2A4A",
    "--field-background": "#FFFFFF",
    "--field-border": "#D5D1EA",
    "--field-foreground": "#2E2A4A",
    "--field-placeholder": "#7A7699",
    "--focus": "#799DE2",
    "--foreground": "#2E2A4A",
    "--link": "#6B73C9",
    "--muted": "#6F6B8C",
    "--overlay": "#FFFFFF",
    "--overlay-foreground": "#2E2A4A",
    "--separator": "#E8E5F4",
    "--surface": "#FFFFFF",
    "--surface-foreground": "#2E2A4A",
  },
  dark: {
    "--accent": "#9AA0E8",
    "--accent-foreground": "#1E1833",
    "--background": "#1E1833",
    "--border": "#3D3460",
    "--default": "#2A2448",
    "--default-foreground": "#F5F3FF",
    "--field-background": "#261F40",
    "--field-border": "#4A4270",
    "--field-foreground": "#F5F3FF",
    "--field-placeholder": "#A39EBF",
    "--focus": "#799DE2",
    "--foreground": "#F5F3FF",
    "--link": "#A8B4F0",
    "--muted": "#B0ABC8",
    "--overlay": "#261F40",
    "--overlay-foreground": "#F5F3FF",
    "--separator": "#342C55",
    "--surface": "#261F40",
    "--surface-foreground": "#F5F3FF",
  },
} as const;

export const theme = {
  colors,
  fonts: {
    mono,
    sans,
  },
};

function colorDeclarations(
  palette: Record<string, string>,
  scheme: "dark" | "light",
) {
  return [`color-scheme:${scheme}`]
    .concat(Object.entries(palette).map(([name, value]) => `${name}:${value}`))
    .join(";");
}

export function themeVariablesCss() {
  return [
    `html:root{${colorDeclarations(theme.colors.light, "light")}}`,
    `html.dark{${colorDeclarations(theme.colors.dark, "dark")}}`,
  ].join("");
}
