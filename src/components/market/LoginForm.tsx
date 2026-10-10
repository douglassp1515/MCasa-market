"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  consumeCheckoutResume,
  setBuyerSession,
} from "@/lib/auth";
import { loginMarketplaceBuyer } from "@/lib/graphql";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await loginMarketplaceBuyer({ email, password });
      setBuyerSession(result.token, result.buyer);

      const next = searchParams.get("next");
      const resumePath = consumeCheckoutResume();

      if (next && next.startsWith("/")) {
        router.push(next);
        return;
      }

      if (resumePath) {
        router.push(resumePath);
        return;
      }

      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível entrar.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Entrar</h1>
        <p className="text-muted">
          Use sua conta de comprador da Vitrine Luar.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-5">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-field-border bg-field-background px-3 py-2 outline-none focus:border-focus"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-md border border-field-border bg-field-background px-3 py-2 outline-none focus:border-focus"
          />
        </label>

        {error ? (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent px-4 py-2.5 font-medium text-accent-foreground disabled:opacity-60"
        >
          {submitting ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-muted">
        Não tem conta?{" "}
        <Link href="/cadastro" className="text-link underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
