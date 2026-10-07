"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  clearBuyerSession,
  getBuyerToken,
  getBuyerUser,
  hasBuyerSession,
  invalidateBuyerSession,
  setBuyerSession,
  type MarketplaceBuyer,
} from "@/lib/auth";
import { fetchMeMarketplaceBuyer } from "@/lib/graphql";

type ProfileSection = {
  href: string;
  label: string;
  description: string;
};

const SECTIONS: ProfileSection[] = [
  {
    href: "/perfil/compras",
    label: "Minhas compras",
    description: "Pedidos e histórico",
  },
  {
    href: "/perfil/enderecos",
    label: "Endereços",
    description: "Entrega e ViaCEP",
  },
  {
    href: "/perfil/cupons",
    label: "Cupons",
    description: "Disponíveis e usados",
  },
];

type BuyerProfileShellProps = {
  children: React.ReactNode;
};

export function BuyerProfileShell({ children }: BuyerProfileShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [buyer, setBuyer] = useState<MarketplaceBuyer | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const nextLogin = `/login?next=${encodeURIComponent(pathname || "/perfil")}`;

    async function verifySession(silent: boolean) {
      if (!hasBuyerSession()) {
        invalidateBuyerSession();
        router.replace(nextLogin);
        return;
      }

      try {
        const me = await fetchMeMarketplaceBuyer();

        if (cancelled) {
          return;
        }

        if (!me) {
          invalidateBuyerSession();
          router.replace(nextLogin);
          return;
        }

        const token = getBuyerToken();

        if (token) {
          setBuyerSession(token, me);
        }

        setBuyer(me);
        setReady(true);
      } catch {
        if (cancelled) {
          return;
        }

        if (!silent) {
          const cached = getBuyerUser();

          if (cached) {
            setBuyer(cached);
            setReady(true);
            return;
          }

          invalidateBuyerSession();
          router.replace(nextLogin);
        }
      }
    }

    void verifySession(false);

    function onFocus() {
      void verifySession(true);
    }

    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname, router]);

  function handleLogout() {
    clearBuyerSession();
    router.push("/");
  }

  if (!ready) {
    return <p className="text-slate-500">Verificando sessão…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Meu perfil</h1>
          <p className="text-slate-500">
            {buyer?.name} · {buyer?.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Sair
        </button>
      </div>

      <nav className="flex flex-wrap gap-2">
        {SECTIONS.map((section) => {
          const active = pathname === section.href;

          return (
            <Link
              key={section.href}
              href={section.href}
              className={
                active
                  ? "rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                  : "rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              }
            >
              <span className="font-medium">{section.label}</span>
              <span className="mt-0.5 block text-xs opacity-80">
                {section.description}
              </span>
            </Link>
          );
        })}
      </nav>

      {children}
    </div>
  );
}
