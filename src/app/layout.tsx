import type { Metadata } from "next";

import { clsx } from "clsx";
import { ThemeProvider } from "next-themes";

import { MarketShell } from "@/components/shell/MarketShell";
import { theme, themeVariablesCss } from "@/config/theme";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "MCasa Marketplace",
  description: "Vitrine pública de anúncios MCasa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={clsx(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          theme.fonts.mono.variable,
          theme.fonts.sans.variable,
        )}
      >
        <style dangerouslySetInnerHTML={{ __html: themeVariablesCss() }} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <MarketShell>{children}</MarketShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
