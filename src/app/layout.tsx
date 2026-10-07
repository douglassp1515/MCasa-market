import type { Metadata } from "next";

import { clsx } from "clsx";
import { ThemeProvider } from "next-themes";

import { CategoryThemeProvider } from "@/components/market/CategoryTheme";
import { CartProvider } from "@/components/market/CartProvider";
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
          "min-h-screen bg-slate-50 font-sans text-slate-900 antialiased",
          theme.fonts.mono.variable,
          theme.fonts.sans.variable,
        )}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `${themeVariablesCss()}:root{--market-accent:#2563EB;--market-surface:#EFF6FF;--market-accent-fg:#FFFFFF}`,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <CategoryThemeProvider>
            <CartProvider>
              <MarketShell>{children}</MarketShell>
            </CartProvider>
          </CategoryThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
