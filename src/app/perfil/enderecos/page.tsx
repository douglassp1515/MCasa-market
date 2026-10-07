import { Suspense } from "react";

import { DeliveryAddressesPanel } from "@/components/market/DeliveryAddressesPanel";

export default function ProfileAddressesPage() {
  return (
    <Suspense fallback={<p className="text-slate-500">Carregando endereços…</p>}>
      <DeliveryAddressesPanel embedded />
    </Suspense>
  );
}
