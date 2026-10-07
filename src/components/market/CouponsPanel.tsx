"use client";

import Link from "next/link";

export function CouponsPanel() {
  return (
    <div className="space-y-4 rounded-xl border border-dashed border-slate-200 bg-white p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">
          Cupons disponíveis
        </h2>
        <p className="text-sm text-slate-500">
          Em breve você verá aqui cupons ativos, expirados e o histórico de uso.
        </p>
      </div>

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Nenhum cupom por enquanto — a funcionalidade será ligada depois do
        checkout/pagamento.
      </p>

      <Link href="/" className="inline-block text-sm text-blue-600 underline">
        Continuar comprando
      </Link>
    </div>
  );
}
