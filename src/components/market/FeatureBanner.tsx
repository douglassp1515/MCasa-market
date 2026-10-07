"use client";

import Link from "next/link";

import { useCategoryTheme } from "@/components/market/CategoryTheme";

export function FeatureBanner() {
  const { accentColor } = useCategoryTheme();

  return (
    <section className="overflow-hidden rounded-2xl bg-slate-950 text-white">
      <div className="grid gap-6 p-8 lg:grid-cols-2 lg:items-center lg:p-10">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Impulsione seu dia a dia
          </h2>
          <p className="max-w-md text-sm text-slate-400">
            Acesse anúncios ACTIVE de todas as lojas. A cor da categoria tintura
            botões e destaques enquanto você navega.
          </p>
          <Link
            href="/#categorias"
            className="inline-flex rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-white transition hover:border-white"
          >
            Ver categorias →
          </Link>
        </div>
        <div
          className="min-h-32 rounded-xl opacity-80"
          style={{
            background: `linear-gradient(135deg, ${accentColor}55, transparent)`,
          }}
        />
      </div>
    </section>
  );
}
