"use client";

import { useState } from "react";

import { useCategoryTheme } from "@/components/market/CategoryTheme";

export function NewsletterBar() {
  const { accentColor } = useCategoryTheme();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const value = email.trim();

    if (!value || !value.includes("@")) {
      setMessage("Informe um e-mail válido.");
      return;
    }

    setMessage("Obrigado! Em breve você receberá novidades.");
    setEmail("");
  }

  return (
    <section
      className="rounded-2xl px-6 py-8 text-white sm:px-8"
      style={{ backgroundColor: accentColor }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Receba novidades</h2>
          <p className="text-sm text-white/80">
            Cadastre seu e-mail para lançamentos da Vitrine Luar.
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-md flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Seu e-mail"
            className="flex-1 rounded-xl border-0 px-4 py-2.5 text-sm text-slate-900 outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Inscrever
          </button>
        </form>
      </div>
      {message ? <p className="mt-3 text-sm text-white/90">{message}</p> : null}
    </section>
  );
}
