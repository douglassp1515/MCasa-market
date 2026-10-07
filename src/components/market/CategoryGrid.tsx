"use client";

import Link from "next/link";

import {
  resolveMediaUrl,
  type MarketplaceCategory,
} from "@/lib/graphql";

type CategoryGridProps = {
  categories: MarketplaceCategory[];
};

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Nenhuma categoria ativa no momento.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => {
        const image = resolveMediaUrl(category.imageUrl);

        return (
          <Link
            key={category.id}
            href={`/categoria/${category.slug}`}
            className="group flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: category.surfaceColor }}
          >
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {category.name}
              </h3>
              <p
                className="text-sm font-medium transition group-hover:underline"
                style={{ color: category.accentColor }}
              >
                Ver anúncios →
              </p>
            </div>
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="mt-4 h-20 w-full object-contain object-right"
              />
            ) : (
              <div
                className="mt-4 h-16 w-16 self-end rounded-xl opacity-30"
                style={{ backgroundColor: category.accentColor }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
