import { Suspense } from "react";

import { HomePage } from "@/components/market/HomePage";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Carregando…</p>}>
      <HomePage />
    </Suspense>
  );
}
