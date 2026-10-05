import { ListingDetail } from "@/components/market/ListingDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ListingPage({ params }: PageProps) {
  const resolved = await params;
  const listingId = Number(resolved.id);

  if (!Number.isInteger(listingId) || listingId <= 0) {
    return (
      <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        Identificador de anúncio inválido.
      </p>
    );
  }

  return <ListingDetail listingId={listingId} />;
}
