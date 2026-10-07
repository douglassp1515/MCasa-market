"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useCategoryTheme } from "@/components/market/CategoryTheme";
import {
  DEFAULT_ACCENT,
  fetchPublicHeroSlides,
  resolveMediaUrl,
  type HeroSlide,
} from "@/lib/graphql";

const SLIDE_INTERVAL_MS = 6000;

export function HeroBanner() {
  const { accentColor, setCategory } = useCategoryTheme();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const rows = await fetchPublicHeroSlides();

        if (cancelled) {
          return;
        }

        setSlides(rows);
        setIndex(0);

        if (rows[0]?.category) {
          setCategory(rows[0].category);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível carregar o banner.");
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
  }, [setCategory]);

  useEffect(() => {
    if (slides.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % slides.length;
        return next;
      });
    }, SLIDE_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides.length]);

  useEffect(() => {
    const slide = slides[index];

    if (!slide) {
      return;
    }

    if (slide.category) {
      setCategory(slide.category);
    }
  }, [index, slides, setCategory]);

  const active = slides[index] || null;
  const imageUrl = resolveMediaUrl(active?.imageUrl);
  const buttonColor = active?.category?.accentColor || accentColor || DEFAULT_ACCENT;
  const ctaHref = active?.ctaHref || "/#categorias";
  const ctaLabel = active?.ctaLabel || "Explorar agora";

  function goTo(nextIndex: number) {
    if (nextIndex < 0 || nextIndex >= slides.length) {
      return;
    }

    setIndex(nextIndex);
  }

  if (loading) {
    return (
      <section className="bg-slate-950 px-4 py-20 text-center text-slate-400">
        Carregando destaques…
      </section>
    );
  }

  if (error || !active) {
    return (
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">MCasa Marketplace</h1>
          <p className="text-slate-400">
            {error || "Nenhum banner ativo. Rode o seed marketplace."}
          </p>
          <Link
            href="/#categorias"
            className="inline-flex rounded-xl px-5 py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: buttonColor }}
          >
            Explorar categorias
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-[420px] overflow-hidden bg-slate-950 text-white sm:min-h-[480px]">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/35" />
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background: `radial-gradient(700px 360px at 75% 40%, ${buttonColor}55, transparent 65%)`,
        }}
      />

      <div className="relative mx-auto flex min-h-[420px] max-w-6xl flex-col justify-center gap-8 px-4 py-16 sm:min-h-[480px] sm:px-6 lg:py-20">
        <div className="max-w-xl space-y-5">
          {active.category ? (
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: buttonColor }}
            >
              {active.category.name}
            </p>
          ) : null}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {active.title}
          </h1>
          {active.subtitle ? (
            <p className="max-w-md text-base text-slate-300">{active.subtitle}</p>
          ) : null}
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: buttonColor }}
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>

        {slides.length > 1 ? (
          <div className="flex items-center gap-2">
            {slides.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Ir para slide ${slideIndex + 1}`}
                onClick={() => goTo(slideIndex)}
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: slideIndex === index ? "1.75rem" : "0.625rem",
                  backgroundColor:
                    slideIndex === index ? buttonColor : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
