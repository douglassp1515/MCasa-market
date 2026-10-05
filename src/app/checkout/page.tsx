import { Suspense } from "react";

import { CheckoutPanel } from "@/components/market/CheckoutPanel";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<p className="text-muted">Carregando checkout…</p>}>
      <CheckoutPanel />
    </Suspense>
  );
}
