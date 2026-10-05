"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  fetchPublicListings,
  resolveMediaUrl,
  type PublicListing,
} from "@/lib/graphql";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function companyLabel(listing: PublicListing) {
  if (listing.companyTradeName) {
    return listing.companyTradeName;
  }

  return listing.companyLegalName;
}

export function ListingsGrid() {
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  function load(nextSearch: string, nextChannel: string) {
    setLoading(true);
    setError(null);

    startTransition(async () => {
      try {
        const rows = await fetchPublicListings({
          search: nextSearch.trim() || undefined,
          channel: nextChannel || undefined,
        });
        setListings(rows);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível carregar a vitrine.");
        }
      } finally {
        setLoading(false);
      }
    });
  }

  useEffect(() => {
    load("", "");
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    load(search, channel);
  }

  return (
    <section className="space-y-8">
      <div className="max-w-2xl space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          MCasa
        </h1>
        <p className="text-lg text-muted">
          Anúncios ativos de todas as lojas parceiras — compre com login de
          comprador.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface/90 p-4 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-muted">Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Produto ou loja"
            className="rounded-md border border-field-border bg-field-background px-3 py-2 text-field-foreground outline-none focus:border-focus"
          />
        </label>

        <label className="flex w-full flex-col gap-1 text-sm sm:w-44">
          <span className="text-muted">Canal</span>
          <select
            value={channel}
            onChange={(event) => setChannel(event.target.value)}
            className="rounded-md border border-field-border bg-field-background px-3 py-2 text-field-foreground outline-none focus:border-focus"
          >
            <option value="">Todos</option>
            <option value="MELI">MELI</option>
            <option value="SHOPEE">Shopee</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-60"
        >
          Filtrar
        </button>
      </form>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-muted">Carregando anúncios…</p>
      ) : null}

      {!loading && !error && listings.length === 0 ? (
        <p className="text-muted">
          Nenhum anúncio ACTIVE no momento. Rode o seed demo no backend ou
          ative anúncios no ERP.
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => {
          const thumb = resolveMediaUrl(listing.thumbnailUrl);

          return (
            <Link
              key={listing.id}
              href={`/anuncio/${listing.id}`}
              className="group overflow-hidden rounded-xl border border-border/80 bg-surface transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"
            >
              <div className="aspect-[4/3] bg-default">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={listing.title || "Anúncio"}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    Sem imagem
                  </div>
                )}
              </div>
              <div className="space-y-2 p-4">
                <p className="text-xs uppercase tracking-wide text-muted">
                  {listing.channel} · {companyLabel(listing)}
                </p>
                <h2 className="line-clamp-2 text-base font-medium text-foreground">
                  {listing.title || `Anúncio #${listing.id}`}
                </h2>
                <p className="text-lg font-semibold text-accent">
                  {formatPrice(listing.salePrice)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
