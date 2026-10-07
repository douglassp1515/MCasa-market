"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useCategoryTheme } from "@/components/market/CategoryTheme";
import { hasBuyerSession } from "@/lib/auth";
import {
  confirmSimulatedMarketplacePayment,
  fetchMarketplacePayment,
  refreshMarketplacePayment,
  type MarketplacePayment,
} from "@/lib/graphql";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function PaymentPanel() {
  const params = useParams();
  const router = useRouter();
  const { accentColor } = useCategoryTheme();
  const paymentId = Number(params.id);

  const [payment, setPayment] = useState<MarketplacePayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const row = await fetchMarketplacePayment(paymentId);
    setPayment(row);
    return row;
  }, [paymentId]);

  useEffect(() => {
    if (!hasBuyerSession()) {
      router.replace(`/login?next=/pagamento/${paymentId}`);
      return;
    }

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      setError("Pagamento inválido.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const row = await load();

        if (cancelled) {
          return;
        }

        setPayment(row);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Falha ao carregar pagamento.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [load, paymentId, router]);

  useEffect(() => {
    if (!payment) {
      return;
    }

    if (payment.status !== "AWAITING_PAYMENT" || payment.method !== "PIX") {
      return;
    }

    const id = payment.id;
    const simulated = payment.simulated;

    const timer = window.setInterval(() => {
      void (async () => {
        try {
          let row: MarketplacePayment;

          if (simulated) {
            row = await fetchMarketplacePayment(id);
          } else {
            row = await refreshMarketplacePayment(id);
          }

          setPayment(row);
        } catch {
          // ignore poll errors
        }
      })();
    }, 4000);

    return () => {
      window.clearInterval(timer);
    };
  }, [payment?.id, payment?.status, payment?.method, payment?.simulated]);

  async function handleConfirmSimulated() {
    if (!payment) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const row = await confirmSimulatedMarketplacePayment(payment.id);
      setPayment(row);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível confirmar.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh() {
    if (!payment) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const row = await refreshMarketplacePayment(payment.id);
      setPayment(row);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao atualizar status.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleCopyPix() {
    if (!payment?.pixQrCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(payment.pixQrCode);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Não foi possível copiar o código PIX.");
    }
  }

  if (loading) {
    return <p className="text-slate-500">Carregando pagamento…</p>;
  }

  if (error && !payment) {
    return (
      <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </p>
    );
  }

  if (!payment) {
    return null;
  }

  if (payment.status === "PAID") {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-emerald-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-emerald-800">
          Pagamento confirmado
        </h1>
        <p className="text-slate-600">
          {formatPrice(payment.amount)} · {payment.method}
          {payment.cardLastFour
            ? ` · final ${payment.cardLastFour}`
            : null}
        </p>
        <Link
          href="/perfil/compras"
          className="inline-block rounded-md px-4 py-2 text-white"
          style={{ backgroundColor: accentColor }}
        >
          Ver minhas compras
        </Link>
      </div>
    );
  }

  if (payment.status === "FAILED" || payment.status === "EXPIRED") {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-red-800">
          Pagamento não concluído
        </h1>
        <p className="text-sm text-slate-600">
          {payment.failureReason || payment.status}
        </p>
        <Link href="/checkout" className="text-blue-600 underline">
          Voltar ao checkout
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Pagamento</h1>
        <p className="text-slate-500">
          {payment.method === "PIX" ? "PIX" : "Cartão"} ·{" "}
          {formatPrice(payment.amount)}
          {payment.simulated
            ? " · modo simulado"
            : payment.provider === "stripe"
              ? " · Stripe"
              : " · Mercado Pago"}
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {payment.method === "PIX" ? (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          {payment.pixQrCodeBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="QR Code PIX"
              src={`data:image/png;base64,${payment.pixQrCodeBase64}`}
              className="mx-auto h-48 w-48"
            />
          ) : (
            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-center text-xs text-slate-500">
              QR simulado — use o código copia e cola
            </div>
          )}

          {payment.pixQrCode ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">
                PIX copia e cola
              </p>
              <textarea
                readOnly
                value={payment.pixQrCode}
                className="h-24 w-full rounded-md border border-slate-200 bg-slate-50 p-2 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  void handleCopyPix();
                }}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                {copied ? "Copiado!" : "Copiar código"}
              </button>
            </div>
          ) : null}

          <p className="text-xs text-slate-500">
            Status: aguardando pagamento
            {payment.pixExpiresAt
              ? ` · expira ${new Date(payment.pixExpiresAt).toLocaleString("pt-BR")}`
              : ""}
          </p>

          <div className="flex flex-wrap gap-2">
            {!payment.simulated ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void handleRefresh();
                }}
                className="rounded-md border border-slate-200 px-3 py-2 text-sm disabled:opacity-60"
              >
                Já paguei — atualizar
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  void handleConfirmSimulated();
                }}
                className="rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {busy ? "Confirmando…" : "Simular pagamento PIX"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">
            Cartão processado no checkout.
            {payment.simulated
              ? " Em modo simulado, a aprovação é imediata."
              : " Atualize se o status ainda estiver pendente."}
          </p>
          {!payment.simulated ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void handleRefresh();
              }}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm"
            >
              Atualizar status
            </button>
          ) : null}
        </div>
      )}

      <Link href="/perfil/compras" className="text-sm text-blue-600 underline">
        Ir para minhas compras
      </Link>
    </div>
  );
}
