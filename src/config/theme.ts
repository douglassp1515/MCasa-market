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

const colors = {
  light: {
    "--accent": "oklch(0.48 0.11 175)",
    "--accent-foreground": "oklch(0.99 0.002 175)",
    "--background": "oklch(0.985 0.004 95)",
    "--border": "oklch(0.9 0.01 95)",
    "--default": "oklch(0.96 0.006 95)",
    "--default-foreground": "oklch(0.22 0.02 95)",
    "--field-background": "oklch(1 0 0)",
    "--field-border": "oklch(0.88 0.01 95)",
    "--field-foreground": "oklch(0.22 0.02 95)",
    "--field-placeholder": "oklch(0.55 0.015 95)",
    "--focus": "oklch(0.48 0.11 175)",
    "--foreground": "oklch(0.22 0.02 95)",
    "--link": "oklch(0.42 0.1 175)",
    "--muted": "oklch(0.5 0.02 95)",
    "--overlay": "oklch(1 0 0)",
    "--overlay-foreground": "oklch(0.22 0.02 95)",
    "--separator": "oklch(0.92 0.008 95)",
    "--surface": "oklch(1 0 0)",
    "--surface-foreground": "oklch(0.22 0.02 95)",
  },
  dark: {
    "--accent": "oklch(0.72 0.12 175)",
    "--accent-foreground": "oklch(0.16 0.02 175)",
    "--background": "oklch(0.16 0.02 160)",
    "--border": "oklch(0.35 0.03 160)",
    "--default": "oklch(0.28 0.03 160)",
    "--default-foreground": "oklch(0.96 0.01 160)",
    "--field-background": "oklch(0.2 0.025 160)",
    "--field-border": "oklch(0.4 0.03 160)",
    "--field-foreground": "oklch(0.96 0.01 160)",
    "--field-placeholder": "oklch(0.68 0.02 160)",
    "--focus": "oklch(0.72 0.12 175)",
    "--foreground": "oklch(0.96 0.01 160)",
    "--link": "oklch(0.78 0.1 175)",
    "--muted": "oklch(0.72 0.02 160)",
    "--overlay": "oklch(0.2 0.025 160)",
    "--overlay-foreground": "oklch(0.96 0.01 160)",
    "--separator": "oklch(0.3 0.025 160)",
    "--surface": "oklch(0.21 0.025 160)",
    "--surface-foreground": "oklch(0.96 0.01 160)",
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
