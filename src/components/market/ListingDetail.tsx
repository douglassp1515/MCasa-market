"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { hasBuyerSession, setCheckoutResume } from "@/lib/auth";
import {
  fetchPublicListing,
  resolveMediaUrl,
  type PublicListingDetail,
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

export function ListingDetail({ listingId }: ListingDetailProps) {
  const router = useRouter();
  const [listing, setListing] = useState<PublicListingDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
          return;
        }

        setListing(row);
        const first = row.images[0]?.url || row.thumbnailUrl;
        setSelectedImage(resolveMediaUrl(first));
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
    };
  }, [listingId]);

  function handleBuy() {
    if (!listing) {
      return;
    }

    if (!hasBuyerSession()) {
      setCheckoutResume(listing.id);
      router.push(`/login?next=/checkout?listingId=${listing.id}`);
      return;
    }

    router.push(`/checkout?listingId=${listing.id}`);
  }

  if (loading) {
    return <p className="text-muted">Carregando anúncio…</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
        <Link href="/" className="text-link underline">
          Voltar à vitrine
        </Link>
      </div>
    );
  }

  if (!listing) {
    return null;
  }

  const companyName = listing.companyTradeName || listing.companyLegalName;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="aspect-square overflow-hidden rounded-xl border border-border bg-default">
          {selectedImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedImage}
              alt={listing.title || "Anúncio"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
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
                  className="h-16 w-16 overflow-hidden rounded-md border border-border"
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
          <p className="text-sm uppercase tracking-wide text-muted">
            {listing.channel} · {companyName}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {listing.title || `Anúncio #${listing.id}`}
          </h1>
          <p className="text-2xl font-semibold text-accent">
            {formatPrice(listing.salePrice)}
          </p>
        </div>

        {listing.description ? (
          <p className="whitespace-pre-wrap text-muted">{listing.description}</p>
        ) : null}

        <p className="text-xs text-muted">
          Empresa #{listing.companyId} — o pedido será vinculado a esta loja.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleBuy}
            className="rounded-md bg-accent px-5 py-2.5 font-medium text-accent-foreground"
          >
            Comprar
          </button>
          <Link
            href="/"
            className="rounded-md border border-border px-5 py-2.5 text-foreground"
          >
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
