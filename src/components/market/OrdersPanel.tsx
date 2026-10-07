"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { hasBuyerSession } from "@/lib/auth";
import {
  fetchMyMarketplaceOrders,
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

type OrdersPanelProps = {
  embedded?: boolean;
};

export function OrdersPanel({ embedded = false }: OrdersPanelProps) {
  const router = useRouter();
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasBuyerSession()) {
      router.replace("/login?next=/perfil/compras");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const rows = await fetchMyMarketplaceOrders();

        if (!cancelled) {
          setOrders(rows);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Falha ao carregar pedidos.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

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
          Cada compra mostra a empresa vendedora do anúncio.
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

          return (
            <li
              key={order.id}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    Pedido #{order.id} · {order.listingTitle || `Anúncio #${order.listingId}`}
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
            </li>
          );
        })}
      </ul>
    </div>
  );
}
