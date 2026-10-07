"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useCategoryTheme } from "@/components/market/CategoryTheme";
import { useCart } from "@/components/market/CartProvider";
import { hasBuyerSession, setCheckoutResume } from "@/lib/auth";
import { cartLineKey } from "@/lib/cart";
import { DEFAULT_ACCENT, resolveMediaUrl } from "@/lib/graphql";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CartPanel() {
  const router = useRouter();
  const { accentColor } = useCategoryTheme();
  const { items, groups, subtotal, setQuantity, removeItem } = useCart();
  const accent = accentColor || DEFAULT_ACCENT;

  function handleCheckout() {
    if (items.length === 0) {
      return;
    }

    if (!hasBuyerSession()) {
      setCheckoutResume("/checkout");
      router.push("/login?next=/checkout");
      return;
    }

    router.push("/checkout");
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Carrinho</h1>
        <p className="text-slate-500">Seu carrinho está vazio.</p>
        <Link
          href="/#destaques"
          className="inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
          style={{ backgroundColor: accent }}
        >
          Continuar comprando
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Carrinho</h1>
        <p className="text-sm text-slate-500">
          Itens agrupados por loja (split multi-empresa na próxima etapa).
        </p>
      </div>

      <div className="space-y-6">
        {groups.map((group) => (
          <section
            key={group.companyId}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <header className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              {group.companyName}{" "}
              <span className="text-slate-400">#{group.companyId}</span>
            </header>
            <ul className="divide-y divide-slate-100">
              {group.items.map((item) => {
                const thumb = resolveMediaUrl(item.thumbnailUrl);
                const lineTotal = item.salePrice * item.quantity;

                return (
                  <li
                    key={cartLineKey(item.listingId, item.productVariantId)}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <Link
                      href={`/anuncio/${item.listingId}`}
                      className="flex flex-1 items-center gap-3"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-50">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {item.title}
                        </p>
                        {item.variantLabel ? (
                          <p className="truncate text-sm text-slate-600">
                            {item.variantLabel}
                          </p>
                        ) : null}
                        <p className="text-sm text-slate-500">
                          {formatPrice(item.salePrice)} · {item.channel}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        Qtd
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={item.quantity}
                          onChange={(event) => {
                            const next = Number(event.target.value);
                            setQuantity(
                              item.listingId,
                              item.productVariantId,
                              next,
                            );
                          }}
                          className="w-16 rounded-md border border-slate-200 px-2 py-1"
                        />
                      </label>
                      <p className="min-w-20 text-right text-sm font-semibold">
                        {formatPrice(lineTotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          removeItem(item.listingId, item.productVariantId);
                        }}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg">
          Subtotal: <strong>{formatPrice(subtotal)}</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            Continuar comprando
          </Link>
          <button
            type="button"
            onClick={handleCheckout}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: accent }}
          >
            Ir para checkout
          </button>
        </div>
      </div>
    </div>
  );
}
