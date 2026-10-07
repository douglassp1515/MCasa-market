"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCart } from "@/components/market/CartProvider";
import { useCategoryTheme } from "@/components/market/CategoryTheme";
import { hasBuyerSession, setCheckoutResume } from "@/lib/auth";
import {
  DEFAULT_ACCENT,
  fetchPublicListing,
  formatVariantLabel,
  resolveMediaUrl,
  type PublicListingDetail,
  type PublicListingVariant,
} from "@/lib/graphql";

type ListingDetailProps = {
  listingId: number;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function isVariantPurchasable(variant: PublicListingVariant) {
  return variant.active && variant.stockAvailable > 0;
}

export function ListingDetail({ listingId }: ListingDetailProps) {
  const router = useRouter();
  const { setCategory } = useCategoryTheme();
  const { addItem } = useCart();
  const [listing, setListing] = useState<PublicListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const row = await fetchPublicListing(listingId);

        if (cancelled) {
          return;
        }

        if (!row) {
          setError("Anúncio não encontrado ou indisponível.");
          setListing(null);
          setCategory(null);
          return;
        }

        setListing(row);
        setCategory(row.category);
        const first = row.images[0]?.url || row.thumbnailUrl;
        setSelectedImage(resolveMediaUrl(first));

        const purchasable = row.variants.filter(isVariantPurchasable);

        if (purchasable.length === 1) {
          setSelectedVariantId(purchasable[0].id);
        } else {
          setSelectedVariantId(null);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Falha ao carregar o anúncio.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      setCategory(null);
    };
  }, [listingId, setCategory]);

  function resolveSelectedVariant(): PublicListingVariant | null {
    if (!listing || listing.variants.length === 0) {
      return null;
    }

    if (!selectedVariantId) {
      return null;
    }

    return (
      listing.variants.find((variant) => variant.id === selectedVariantId) ||
      null
    );
  }

  function buildCartLine() {
    if (!listing) {
      return null;
    }

    const hasVariants = listing.variants.length > 0;

    if (hasVariants) {
      const variant = resolveSelectedVariant();

      if (!variant) {
        setActionError("Selecione a variação do produto para continuar.");
        return null;
      }

      if (!isVariantPurchasable(variant)) {
        setActionError("Esta variação está indisponível no momento.");
        return null;
      }

      if (quantity > variant.stockAvailable) {
        setActionError(
          `Estoque disponível: ${Math.floor(variant.stockAvailable)} unidade(s).`,
        );
        return null;
      }

      const companyName = listing.companyTradeName || listing.companyLegalName;
      const unitPrice =
        variant.salePrice != null ? variant.salePrice : listing.salePrice;

      return {
        listingId: listing.id,
        productVariantId: variant.id,
        variantLabel: formatVariantLabel(variant, listing.variationAxes),
        quantity,
        title: listing.title || `Anúncio #${listing.id}`,
        salePrice: unitPrice,
        thumbnailUrl: listing.thumbnailUrl,
        companyId: listing.companyId,
        companyName,
        channel: listing.channel,
        categoryAccent: listing.category?.accentColor || null,
      };
    }

    const companyName = listing.companyTradeName || listing.companyLegalName;

    return {
      listingId: listing.id,
      productVariantId: null,
      variantLabel: null,
      quantity,
      title: listing.title || `Anúncio #${listing.id}`,
      salePrice: listing.salePrice,
      thumbnailUrl: listing.thumbnailUrl,
      companyId: listing.companyId,
      companyName,
      channel: listing.channel,
      categoryAccent: listing.category?.accentColor || null,
    };
  }

  function handleAddToCart() {
    setActionError(null);
    const line = buildCartLine();

    if (!line) {
      return;
    }

    addItem(line);
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  }

  function handleBuyNow() {
    setActionError(null);
    const line = buildCartLine();

    if (!line) {
      return;
    }

    addItem(line);

    if (!hasBuyerSession()) {
      setCheckoutResume("/checkout");
      router.push("/login?next=/checkout");
      return;
    }

    router.push("/checkout");
  }

  if (loading) {
    return <p className="text-slate-500">Carregando anúncio…</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
        <Link href="/" className="text-blue-600 underline">
          Voltar à vitrine
        </Link>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const companyName = listing.companyTradeName || listing.companyLegalName;
  const accent = listing.category?.accentColor || DEFAULT_ACCENT;
  const categoryLabel = listing.category?.name || listing.channel;
  const selectedVariant = resolveSelectedVariant();
  const displayPrice =
    selectedVariant?.salePrice != null
      ? selectedVariant.salePrice
      : listing.salePrice;
  const hasVariants = listing.variants.length > 0;
  const allUnavailable =
    hasVariants && !listing.variants.some(isVariantPurchasable);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {selectedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedImage}
              alt={listing.title || "Anúncio"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              Sem imagem
            </div>
          )}
        </div>

        {listing.images.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            {listing.images.map((image) => {
              const url = resolveMediaUrl(image.url);

              if (!url) {
                return null;
              }

              return (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImage(url)}
                  className="h-16 w-16 overflow-hidden rounded-md border border-slate-200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-slate-500">
            {categoryLabel} · {companyName}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            {listing.title || `Anúncio #${listing.id}`}
          </h1>
          <p className="text-2xl font-semibold" style={{ color: accent }}>
            {formatPrice(displayPrice)}
          </p>
        </div>

        {listing.description ? (
          <p className="whitespace-pre-wrap text-slate-600">
            {listing.description}
          </p>
        ) : null}

        {hasVariants ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Variação</p>
            {allUnavailable ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Todas as variações estão indisponíveis no momento.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {listing.variants.map((variant) => {
                  const purchasable = isVariantPurchasable(variant);
                  const selected = selectedVariantId === variant.id;
                  const label = formatVariantLabel(
                    variant,
                    listing.variationAxes,
                  );

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={!purchasable}
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setActionError(null);
                      }}
                      className="rounded-xl border px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-40"
                      style={
                        selected
                          ? {
                              borderColor: accent,
                              backgroundColor: `${accent}14`,
                              color: accent,
                            }
                          : undefined
                      }
                    >
                      <span className="block font-medium">{label}</span>
                      <span className="block text-xs text-slate-500">
                        {purchasable
                          ? `${Math.floor(variant.stockAvailable)} disp.`
                          : "Indisponível"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        <label className="flex max-w-32 flex-col gap-1 text-sm text-slate-600">
          Quantidade
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next) || next < 1) {
                setQuantity(1);
                return;
              }
              setQuantity(Math.floor(next));
            }}
            className="rounded-md border border-slate-200 px-3 py-2"
          />
        </label>

        {actionError ? (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {actionError}
          </p>
        ) : null}

        <p className="text-xs text-slate-500">
          Empresa #{listing.companyId} — o pedido será vinculado a esta loja.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={allUnavailable}
            className="rounded-xl px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: accent }}
          >
            {added ? "Adicionado ✓" : "Adicionar ao carrinho"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={allUnavailable}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Comprar agora
          </button>
          <Link
            href="/carrinho"
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-800"
          >
            Ver carrinho
          </Link>
        </div>
      </div>
    </div>
  );
}
