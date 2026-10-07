"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCategoryTheme } from "@/components/market/CategoryTheme";
import { useCart } from "@/components/market/CartProvider";
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

type MarketShellProps = {
  children: React.ReactNode;
};

type NavKey = "home" | "vitrine" | null;

const PROFILE_MENU_ITEMS = [
  { href: "/perfil/compras", label: "Minhas compras" },
  { href: "/perfil/enderecos", label: "Endereços" },
  { href: "/perfil/cupons", label: "Cupons" },
];

function NavLink({
  href,
  label,
  active,
  accentColor,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  accentColor: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      className="inline-flex flex-col items-center px-0.5 text-sm transition-colors hover:text-white"
      style={{ color: active ? "#FFFFFF" : undefined }}
      onClick={() => {
        if (onNavigate) {
          onNavigate();
        }
      }}
    >
      <span className="leading-none">{label}</span>
      <span
        aria-hidden
        className="mt-1.5 block h-[2px] w-full"
        style={{
          backgroundColor: active ? accentColor : "transparent",
        }}
      />
    </Link>
  );
}

function ProfileMenu({
  buyer,
  accentColor,
  onLogout,
}: {
  buyer: MarketplaceBuyer;
  accentColor: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const root = rootRef.current;

      if (!root) {
        return;
      }

      if (event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const firstName = buyer.name.split(" ")[0] || buyer.name;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 rounded-lg border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 hover:bg-slate-900 hover:text-white"
      >
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {firstName.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate sm:inline">{firstName}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={open ? "rotate-180 transition" : "transition"}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-700 bg-slate-950 py-1 shadow-xl"
        >
          <div className="border-b border-slate-800 px-3 py-2">
            <p className="truncate text-sm font-medium text-white">{buyer.name}</p>
            <p className="truncate text-xs text-slate-400">{buyer.email}</p>
          </div>

          {PROFILE_MENU_ITEMS.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={
                  active
                    ? "block px-3 py-2 text-sm text-white"
                    : "block px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
                }
                style={active ? { backgroundColor: `${accentColor}33` } : undefined}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="block w-full border-t border-slate-800 px-3 py-2 text-left text-sm text-red-300 hover:bg-slate-900 hover:text-red-200"
          >
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function MarketShell({ children }: MarketShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { accentColor } = useCategoryTheme();
  const { count: cartCount } = useCart();
  const [buyer, setBuyer] = useState<MarketplaceBuyer | null>(null);
  const [ready, setReady] = useState(false);
  const [search, setSearch] = useState("");
  const [hash, setHash] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      if (!hasBuyerSession()) {
        setBuyer(null);
        setReady(true);
        return;
      }

      try {
        const me = await fetchMeMarketplaceBuyer();

        if (cancelled) {
          return;
        }

        if (!me) {
          invalidateBuyerSession();
          setBuyer(null);
          setReady(true);
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

        // Rede instável: mantém cache local; focus/me posterior revalida.
        setBuyer(getBuyerUser());
        setReady(true);
      }
    }

    void verifySession();

    function onFocus() {
      void verifySession();
    }

    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  useEffect(() => {
    function syncHash() {
      const next = window.location.hash.replace(/^#/, "");
      setHash(next);
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, [pathname]);

  function handleLogout() {
    clearBuyerSession();
    setBuyer(null);
    router.push("/");
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const q = search.trim();

    if (!q) {
      router.push("/#destaques");
      return;
    }

    router.push(`/?q=${encodeURIComponent(q)}#destaques`);
  }

  const isHome = pathname === "/";
  const isCategory = pathname.startsWith("/categoria/");
  const isListing = pathname.startsWith("/anuncio/");
  const isCart =
    pathname.startsWith("/carrinho") || pathname.startsWith("/checkout");
  const fullBleed = isHome || isCategory;

  let activeNav: NavKey = null;

  if (isCart) {
    activeNav = "vitrine";
  } else if (isCategory || isListing || (isHome && hash === "categorias")) {
    activeNav = "vitrine";
  } else if (isHome) {
    activeNav = "home";
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: accentColor }}
            >
              M
            </span>
            <span className="text-lg font-semibold tracking-tight">MCasa</span>
          </Link>

          <nav className="hidden items-end gap-6 text-sm text-slate-300 md:flex">
            <NavLink
              href="/"
              label="Início"
              active={activeNav === "home"}
              accentColor={accentColor}
              onNavigate={() => {
                setHash("");
              }}
            />
            <NavLink
              href="/#categorias"
              label="Vitrine"
              active={activeNav === "vitrine"}
              accentColor={accentColor}
              onNavigate={() => {
                setHash("categorias");
              }}
            />
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar…"
                className="w-36 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-slate-500 lg:w-48"
              />
            </form>

            <Link
              href="/carrinho"
              className="relative rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white"
              aria-label="Carrinho"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
                <path d="M6 6L5 2H2" />
              </svg>
              {cartCount > 0 ? (
                <span
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>

            {ready && !buyer ? (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:text-white"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  Criar conta
                </Link>
              </>
            ) : null}

            {ready && buyer ? (
              <ProfileMenu
                buyer={buyer}
                accentColor={accentColor}
                onLogout={handleLogout}
              />
            ) : null}
          </div>
        </div>
      </header>

      <main
        className={
          fullBleed
            ? "flex-1"
            : "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6"
        }
      >
        {children}
      </main>
    </div>
  );
}
