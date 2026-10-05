"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  clearBuyerSession,
  getBuyerUser,
  hasBuyerSession,
  type MarketplaceBuyer,
} from "@/lib/auth";

type MarketShellProps = {
  children: React.ReactNode;
};

export function MarketShell({ children }: MarketShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [buyer, setBuyer] = useState<MarketplaceBuyer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasBuyerSession()) {
      setBuyer(getBuyerUser());
    } else {
      setBuyer(null);
    }

    setReady(true);
  }, [pathname]);

  function handleLogout() {
    clearBuyerSession();
    setBuyer(null);
    router.push("/");
  }

  return (
    <div className="market-shell min-h-screen text-foreground">
      <header className="border-b border-border/70 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="group flex flex-col">
            <span className="text-2xl font-semibold tracking-tight text-foreground transition group-hover:text-accent">
              MCasa
            </span>
            <span className="text-xs text-muted">Marketplace</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
            <Link
              href="/"
              className="rounded-md px-3 py-2 text-muted transition hover:bg-default hover:text-foreground"
            >
              Vitrine
            </Link>

            {ready && buyer ? (
              <>
                <Link
                  href="/pedidos"
                  className="rounded-md px-3 py-2 text-muted transition hover:bg-default hover:text-foreground"
                >
                  Meus pedidos
                </Link>
                <span className="hidden text-muted sm:inline">{buyer.name}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-border px-3 py-2 text-foreground transition hover:bg-default"
                >
                  Sair
                </button>
              </>
            ) : null}

            {ready && !buyer ? (
              <>
                <Link
                  href="/login"
                  className="rounded-md px-3 py-2 text-muted transition hover:bg-default hover:text-foreground"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-md bg-accent px-3 py-2 font-medium text-accent-foreground transition hover:opacity-90"
                >
                  Criar conta
                </Link>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
