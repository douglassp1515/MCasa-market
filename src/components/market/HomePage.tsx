"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { CategoryGrid } from "@/components/market/CategoryGrid";
import { FeatureBanner } from "@/components/market/FeatureBanner";
import { HeroBanner } from "@/components/market/HeroBanner";
import { MarketFooter } from "@/components/market/MarketFooter";
import { NewsletterBar } from "@/components/market/NewsletterBar";
import { ProductCard } from "@/components/market/ProductCard";
import { TrustBar } from "@/components/market/TrustBar";
import {
  fetchPublicCategories,
  fetchPublicListings,
  type MarketplaceCategory,
  type PublicListing,
} from "@/lib/graphql";

export function HomePage() {
  const searchParams = useSearchParams();
  const queryFromUrl = searchParams.get("q") || "";

  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [listings, setListings] = useState<PublicListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [cats, rows] = await Promise.all([
          fetchPublicCategories(),
          fetchPublicListings({
            search: queryFromUrl.trim() || undefined,
          }),
        ]);

        if (cancelled) {
          return;
        }

        setCategories(cats);
        setListings(rows);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível carregar a vitrine.");
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
  }, [queryFromUrl]);

  return (
    <div className="flex flex-col">
      <HeroBanner />
      <TrustBar />

      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 py-12 sm:px-6">
        <section id="categorias" className="scroll-mt-24 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Categorias
              </h2>
              <p className="text-sm text-slate-500">
                Cada categoria define a cor dos botões e destaques.
              </p>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Carregando categorias…</p>
          ) : (
            <CategoryGrid categories={categories} />
          )}
        </section>

        <section id="destaques" className="scroll-mt-24 space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Destaques
              </h2>
              <p className="text-sm text-slate-500">
                {queryFromUrl
                  ? `Resultados para “${queryFromUrl}”`
                  : "Anúncios ACTIVE de todas as lojas"}
              </p>
            </div>
            {categories[0] ? (
              <Link
                href={`/categoria/${categories[0].slug}`}
                className="text-sm font-medium text-[var(--market-accent,#2563EB)] hover:underline"
              >
                Ver tudo →
              </Link>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="text-sm text-slate-500">Carregando anúncios…</p>
          ) : null}

          {!loading && !error && listings.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum anúncio ACTIVE. Rode o seed marketplace no backend.
            </p>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>

        <FeatureBanner />
        <NewsletterBar />
      </div>

      <MarketFooter />
    </div>
  );
}
