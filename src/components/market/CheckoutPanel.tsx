"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { hasBuyerSession, setCheckoutResume } from "@/lib/auth";
import {
  createMarketplaceOrder,
  fetchPublicListing,
  type MarketplaceOrder,
  type PublicListingDetail,
} from "@/lib/graphql";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function CheckoutPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingIdRaw = searchParams.get("listingId");
  const listingId = Number(listingIdRaw);

  const [listing, setListing] = useState<PublicListingDetail | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<MarketplaceOrder | null>(null);

  useEffect(() => {
    if (!Number.isInteger(listingId) || listingId <= 0) {
      setError("Anúncio inválido para checkout.");
      setLoading(false);
      return;
    }

    if (!hasBuyerSession()) {
      setCheckoutResume(listingId);
      router.replace(`/login?next=/checkout?listingId=${listingId}`);
      return;
    }

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
          return;
        }

        setListing(row);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Falha ao carregar checkout.");
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
  }, [listingId, router]);

  async function handleConfirm() {
    if (!listing) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createMarketplaceOrder({
        listingId: listing.id,
        quantity,
      });
      setOrder(created);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível criar o pedido.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Preparando checkout…</p>;
  }

  if (order) {
    const companyName = order.companyTradeName || order.companyLegalName;

    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-border bg-surface p-6">
        <h1 className="text-2xl font-semibold">Pedido criado</h1>
        <p className="text-muted">
          Pedido #{order.id} na loja <strong>{companyName}</strong> (empresa #
          {order.companyId}).
        </p>
        <p>
          {order.listingTitle} · {order.quantity} × {formatPrice(order.unitPrice)}{" "}
          = <strong>{formatPrice(order.totalAmount)}</strong>
        </p>
        <p className="text-sm text-muted">Status: {order.status}</p>
        <div className="flex gap-3">
          <Link
            href="/pedidos"
            className="rounded-md bg-accent px-4 py-2 text-accent-foreground"
          >
            Ver pedidos
          </Link>
          <Link
            href="/"
            className="rounded-md border border-border px-4 py-2"
          >
            Continuar comprando
          </Link>
        </div>
      </div>
    );
  }

  if (error && !listing) {
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
  const total = listing.salePrice * quantity;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-muted">
          Confirme a compra. A empresa vendedora é definida pelo anúncio.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <div>
          <p className="text-sm text-muted">
            {listing.channel} · {companyName}
          </p>
          <h2 className="text-xl font-medium">
            {listing.title || `Anúncio #${listing.id}`}
          </h2>
          <p className="text-accent">{formatPrice(listing.salePrice)}</p>
        </div>

        <label className="flex max-w-32 flex-col gap-1 text-sm">
          <span className="text-muted">Quantidade</span>
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);

              if (!Number.isFinite(next) || next < 1) {
                setQuantity(1);
                return;
              }

              setQuantity(Math.floor(next));
            }}
            className="rounded-md border border-field-border bg-field-background px-3 py-2 outline-none focus:border-focus"
          />
        </label>

        <p className="text-sm">
          Total: <strong>{formatPrice(total)}</strong>
        </p>

        <p className="text-xs text-muted">
          companyId do pedido = {listing.companyId} (do anúncio; não editável).
        </p>

        {error ? (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          className="w-full rounded-md bg-accent px-4 py-2.5 font-medium text-accent-foreground disabled:opacity-60"
        >
          {submitting ? "Criando pedido…" : "Confirmar pedido"}
        </button>
      </div>
    </div>
  );
}
