"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/market/CartProvider";
import {
  DEFAULT_ACCENT,
  resolveMediaUrl,
  type PublicListing,
} from "@/lib/graphql";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type ProductCardProps = {
  listing: PublicListing;
  showBuyButton?: boolean;
};

export function ProductCard({
  listing,
  showBuyButton = true,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const thumb = resolveMediaUrl(listing.thumbnailUrl);
  const accent = listing.category?.accentColor || DEFAULT_ACCENT;
  const companyName = listing.companyTradeName || listing.companyLegalName;
  const categoryName = listing.category?.name || listing.channel;

  function handleAddToCart() {
    addItem({
      listingId: listing.id,
      title: listing.title || `Anúncio #${listing.id}`,
      salePrice: listing.salePrice,
      thumbnailUrl: listing.thumbnailUrl,
      companyId: listing.companyId,
      companyName,
      channel: listing.channel,
      categoryAccent: listing.category?.accentColor || null,
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/anuncio/${listing.id}`} className="block">
        <div className="relative aspect-square bg-slate-50">
          {listing.category ? (
            <span
              className="absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: accent }}
            >
              {listing.category.name}
            </span>
          ) : null}
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={listing.title || "Anúncio"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Sem imagem
            </div>
          )}
        </div>
        <div className="space-y-1 px-4 pt-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
            {listing.title || `Anúncio #${listing.id}`}
          </h3>
          <p className="text-xs text-slate-500">
            {categoryName} · {companyName}
          </p>
          <p className="text-base font-bold text-slate-900">
            {formatPrice(listing.salePrice)}
          </p>
        </div>
      </Link>

      {showBuyButton ? (
        <div className="mt-auto flex flex-col gap-2 p-4 pt-3">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: accent }}
          >
            {added ? "Adicionado ✓" : "Adicionar ao carrinho"}
          </button>
          <Link
            href={`/anuncio/${listing.id}`}
            className="flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Ver detalhes
          </Link>
        </div>
      ) : null}
    </article>
  );
}
