const ITEMS = [
  { title: "Entrega rápida", subtitle: "Parceiros em todo o Brasil" },
  { title: "Troca em 30 dias", subtitle: "Política clara por loja" },
  { title: "Pagamento seguro", subtitle: "Em breve PIX e cartão" },
  { title: "Suporte", subtitle: "Atendimento às lojas Luar Hub" },
];

export function TrustBar() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xs font-bold text-[var(--market-accent,#2563EB)]">
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
