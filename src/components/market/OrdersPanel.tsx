"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { hasBuyerSession } from "@/lib/auth";
import {
  fetchMyMarketplaceOrders,
  requestMarketplaceOrderReturn,
  uploadMarketplaceReturnPhoto,
  type MarketplaceOrder,
} from "@/lib/graphql";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function returnStatusLabel(status: string) {
  if (status === "REQUESTED") {
    return "Devolução solicitada";
  }

  if (status === "APPROVED") {
    return "Devolução aprovada";
  }

  if (status === "REFUNDED") {
    return "Reembolso registrado";
  }

  if (status === "REJECTED") {
    return "Devolução rejeitada";
  }

  return status;
}

function publicAssetUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(
    /\/$/,
    "",
  );

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

type OrdersPanelProps = {
  embedded?: boolean;
};

export function OrdersPanel({ embedded = false }: OrdersPanelProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openOrderId, setOpenOrderId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadOrders() {
    setLoading(true);
    setError(null);

    try {
      const rows = await fetchMyMarketplaceOrders();
      setOrders(rows);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Falha ao carregar pedidos.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!hasBuyerSession()) {
      router.replace("/login?next=/perfil/compras");
      return;
    }

    void loadOrders();
  }, [router]);

  function canRequestReturn(order: MarketplaceOrder) {
    if (order.status !== "PAID") {
      return false;
    }

    const status = order.returnStatus || "NONE";
    return status === "NONE" || status === "REJECTED";
  }

  async function handleSubmitReturn(
    event: FormEvent<HTMLFormElement>,
    orderId: number,
  ) {
    event.preventDefault();
    setFormError(null);

    const trimmed = reason.trim();

    if (trimmed.length < 10) {
      setFormError("Descreva o motivo com pelo menos 10 caracteres.");
      return;
    }

    if (files.length < 1 || files.length > 5) {
      setFormError("Envie entre 1 e 5 fotos.");
      return;
    }

    setSubmitting(true);

    try {
      const uploadedPaths: string[] = [];

      for (const file of files) {
        const uploaded = await uploadMarketplaceReturnPhoto(file);
        uploadedPaths.push(uploaded.storagePath);
      }

      const updated = await requestMarketplaceOrderReturn({
        marketplaceOrderId: orderId,
        reason: trimmed,
        photoStoragePaths: uploadedPaths,
      });

      setOrders((current) =>
        current.map((row) => {
          if (row.id === updated.id) {
            return updated;
          }

          return row;
        }),
      );
      setOpenOrderId(null);
      setReason("");
      setFiles([]);
    } catch (submitError) {
      if (submitError instanceof Error) {
        setFormError(submitError.message);
      } else {
        setFormError("Não foi possível solicitar a devolução.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-muted">Carregando pedidos…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        {embedded ? (
          <h2 className="text-xl font-semibold tracking-tight">Minhas compras</h2>
        ) : (
          <h1 className="text-3xl font-semibold tracking-tight">Minhas compras</h1>
        )}
        <p className="text-muted">
          Cada compra mostra a empresa vendedora. Pedidos pagos podem solicitar
          devolução com motivo e fotos.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {!error && orders.length === 0 ? (
        <p className="text-muted">
          Você ainda não tem pedidos.{" "}
          <Link href="/" className="text-link underline">
            Ver vitrine
          </Link>
        </p>
      ) : null}

      <ul className="space-y-3">
        {orders.map((order) => {
          const companyName =
            order.companyTradeName || order.companyLegalName;
          const showForm = openOrderId === order.id;

          return (
            <li
              key={order.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    Pedido #{order.id} ·{" "}
                    {order.listingTitle || `Anúncio #${order.listingId}`}
                  </p>
                  <p className="text-sm text-muted">
                    {companyName} (empresa #{order.companyId}) · {order.channel}
                  </p>
                </div>
                <p className="font-semibold text-accent">
                  {formatPrice(order.totalAmount)}
                </p>
              </div>
              <p className="mt-2 text-sm text-muted">
                {order.quantity} × {formatPrice(order.unitPrice)} ·{" "}
                {order.status} · {formatDate(order.createdAt)}
              </p>

              {order.returnStatus && order.returnStatus !== "NONE" ? (
                <div className="mt-3 space-y-2 rounded-lg border border-border bg-background/60 p-3 text-sm">
                  <p className="font-medium">
                    {returnStatusLabel(order.returnStatus)}
                  </p>
                  {order.returnReason ? (
                    <p className="text-muted">{order.returnReason}</p>
                  ) : null}
                  {order.returnPhotoUrls?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {order.returnPhotoUrls.map((url) => (
                        <a
                          key={url}
                          href={publicAssetUrl(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-md border border-border"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={publicAssetUrl(url)}
                            alt="Foto da devolução"
                            className="h-16 w-16 object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {canRequestReturn(order) ? (
                <div className="mt-3">
                  {!showForm ? (
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-background"
                      onClick={() => {
                        setOpenOrderId(order.id);
                        setReason("");
                        setFiles([]);
                        setFormError(null);
                      }}
                    >
                      Pedir devolução
                    </button>
                  ) : (
                    <form
                      className="space-y-3 rounded-lg border border-border p-3"
                      onSubmit={(event) => {
                        void handleSubmitReturn(event, order.id);
                      }}
                    >
                      <label className="block space-y-1 text-sm">
                        <span className="font-medium">Motivo da devolução</span>
                        <textarea
                          className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2"
                          value={reason}
                          onChange={(event) => {
                            setReason(event.target.value);
                          }}
                          maxLength={1000}
                          required
                          placeholder="Descreva o problema com o produto (mín. 10 caracteres)"
                        />
                      </label>
                      <label className="block space-y-1 text-sm">
                        <span className="font-medium">Fotos (1 a 5)</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="block w-full text-sm"
                          onChange={(event) => {
                            const list = event.target.files
                              ? Array.from(event.target.files).slice(0, 5)
                              : [];
                            setFiles(list);
                          }}
                        />
                        {files.length > 0 ? (
                          <span className="text-muted">
                            {files.length} arquivo(s) selecionado(s)
                          </span>
                        ) : null}
                      </label>
                      {formError ? (
                        <p className="text-sm text-red-700">{formError}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                        >
                          {submitting ? "Enviando…" : "Enviar pedido"}
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          className="rounded-md border border-border px-3 py-2 text-sm"
                          onClick={() => {
                            setOpenOrderId(null);
                            setFormError(null);
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
