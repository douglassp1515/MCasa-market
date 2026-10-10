import type { Metadata } from "next";

import { clsx } from "clsx";
import { ThemeProvider } from "next-themes";

import { CategoryThemeProvider } from "@/components/market/CategoryTheme";
import { CartProvider } from "@/components/market/CartProvider";
import { MarketShell } from "@/components/shell/MarketShell";
import { brand } from "@/config/brand";
import { theme, themeVariablesCss } from "@/config/theme";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: brand.storefront,
    template: `%s · ${brand.titleSuffix}`,
  },
  description: brand.description,
  icons: {
    icon: "/favicon.ico",
  },
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
          "min-h-screen bg-[#f7f4fc] font-sans text-slate-900 antialiased",
          theme.fonts.mono.variable,
          theme.fonts.sans.variable,
        )}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `${themeVariablesCss()}:root{--market-accent:#868BDD;--market-surface:#EEEBF8;--market-accent-fg:#FFFFFF}`,
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
