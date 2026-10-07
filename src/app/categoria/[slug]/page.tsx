import { CategoryPage } from "@/components/market/CategoryPage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const resolved = await params;
  const slug = String(resolved.slug || "").trim().toLowerCase();

  if (!slug) {
    return (
      <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        Categoria inválida.
      </p>
    );
  }

  return <CategoryPage slug={slug} />;
}
