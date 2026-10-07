"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCategoryTheme } from "@/components/market/CategoryTheme";
import { MarketFooter } from "@/components/market/MarketFooter";
import { ProductCard } from "@/components/market/ProductCard";
import {
  fetchPublicCategory,
  fetchPublicListings,
  type MarketplaceCategory,
  type PublicListing,
} from "@/lib/graphql";

type CategoryPageProps = {
  slug: string;
};

export function CategoryPage({ slug }: CategoryPageProps) {
  const { setCategory, accentColor } = useCategoryTheme();
  const [category, setLocalCategory] = useState<MarketplaceCategory | null>(
    null,
  );
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const cat = await fetchPublicCategory(slug);

        if (cancelled) {
          return;
        }

        if (!cat) {
          setError("Categoria não encontrada.");
          setLocalCategory(null);
          setCategory(null);
          setListings([]);
          return;
        }

        setLocalCategory(cat);
        setCategory(cat);

        const rows = await fetchPublicListings({ categorySlug: slug });

        if (cancelled) {
          return;
        }

        setListings(rows);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Falha ao carregar a categoria.");
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
  }, [slug, setCategory]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-10 sm:px-6">
        <div className="space-y-3">
          <Link href="/" className="text-sm text-slate-500 hover:underline">
            ← Voltar à vitrine
          </Link>
          {category ? (
            <div
              className="rounded-2xl p-6"
              style={{ backgroundColor: category.surfaceColor }}
            >
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {category.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Botões e destaques usam a cor desta categoria.
              </p>
              <span
                className="mt-4 inline-block rounded-lg px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {category.accentColor}
              </span>
            </div>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {!loading && !error && listings.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum anúncio ACTIVE nesta categoria.
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {listings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
      <MarketFooter />
    </div>
  );
}
