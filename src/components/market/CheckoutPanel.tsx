"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { CardPaymentForm } from "@/components/market/CardPaymentForm";
import { StripeCardFields } from "@/components/market/StripeCardFields";
import { useCart } from "@/components/market/CartProvider";
import { useCategoryTheme } from "@/components/market/CategoryTheme";
import { hasBuyerSession, setCheckoutResume } from "@/lib/auth";
import {
  createMarketplaceCheckout,
  fetchMyMarketplaceDeliveryAddresses,
  fetchPublicListing,
  type MarketplaceBuyerAddress,
  type PublicListingDetail,
} from "@/lib/graphql";
import { formatCepDisplay } from "@/lib/viacep";
import {
  cardMetaFromForm,
  isMercadoPagoPublicConfigured,
  isProviderPublicConfigured,
  isStripePublicConfigured,
  validateCardForm,
  type CardFormValues,
  type PaymentMethod,
  type PaymentProvider,
} from "@/lib/payment";
import { tokenizeCardForProvider } from "@/lib/tokenizeCard";
import { cartLineKey, type CartItem } from "@/lib/cart";

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const EMPTY_CARD: CardFormValues = {
  holderName: "",
  number: "",
  expiry: "",
  cvv: "",
};

export function CheckoutPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingIdRaw = searchParams.get("listingId");
  const listingId = Number(listingIdRaw);
  const { accentColor } = useCategoryTheme();
  const cart = useCart();

  const [legacyListing, setLegacyListing] =
    useState<PublicListingDetail | null>(null);
  const [legacyQuantity, setLegacyQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [paymentProvider, setPaymentProvider] =
    useState<PaymentProvider>("mercadopago");
  const [cardForm, setCardForm] = useState<CardFormValues>(EMPTY_CARD);
  const [addresses, setAddresses] = useState<MarketplaceBuyerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );

  const useCartCheckout =
    !Number.isInteger(listingId) || listingId <= 0;

  useEffect(() => {
    if (!hasBuyerSession()) {
      if (useCartCheckout) {
        setCheckoutResume("/checkout");
        router.replace("/login?next=/checkout");
      } else {
        setCheckoutResume(`/checkout?listingId=${listingId}`);
        router.replace(`/login?next=/checkout?listingId=${listingId}`);
      }
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const rows = await fetchMyMarketplaceDeliveryAddresses();

        if (cancelled) {
          return;
        }

        setAddresses(rows);

        const defaultRow = rows.find((row) => row.isDefault) || rows[0] || null;

        if (defaultRow) {
          setSelectedAddressId(defaultRow.id);
        }

        if (!useCartCheckout) {
          const row = await fetchPublicListing(listingId);

          if (cancelled) {
            return;
          }

          if (!row) {
            setError("Anúncio não encontrado ou indisponível.");
            return;
          }

          setLegacyListing(row);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Falha ao carregar checkout.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [listingId, router, useCartCheckout]);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);

    try {
      if (!selectedAddressId) {
        setError("Selecione ou cadastre um endereço de entrega.");
        return;
      }

      let lines: CartItem[] = [];

      if (useCartCheckout) {
        lines = cart.items;
      } else if (legacyListing) {
        if (legacyListing.variants.length > 0) {
          setError(
            "Este produto exige seleção de variação. Abra o anúncio e escolha a opção antes do checkout.",
          );
          return;
        }

        lines = [
          {
            listingId: legacyListing.id,
            productVariantId: null,
            variantLabel: null,
            quantity: legacyQuantity,
            title: legacyListing.title || `Anúncio #${legacyListing.id}`,
            salePrice: legacyListing.salePrice,
            thumbnailUrl: legacyListing.thumbnailUrl,
            companyId: legacyListing.companyId,
            companyName:
              legacyListing.companyTradeName || legacyListing.companyLegalName,
            channel: legacyListing.channel,
            categoryAccent: legacyListing.category?.accentColor || null,
          },
        ];
      }

      if (lines.length === 0) {
        setError("Carrinho vazio.");
        return;
      }

      let cardToken: string | null = null;
      let paymentMethodId: string | null = null;
      let issuerId: string | null = null;
      let cardLastFour: string | null = null;
      let cardBrand: string | null = null;
      let providerForCheckout: PaymentProvider | null = null;

      if (paymentMethod === "CARD") {
        providerForCheckout = paymentProvider;

        const useStripeElements =
          paymentProvider === "stripe" && isStripePublicConfigured();

        if (useStripeElements) {
          if (!cardForm.holderName.trim()) {
            setError("Informe o nome impresso no cartão.");
            return;
          }
        } else {
          const cardError = validateCardForm(cardForm);

          if (cardError) {
            setError(cardError);
            return;
          }

          const meta = cardMetaFromForm(cardForm);
          cardLastFour = meta.cardLastFour;
          cardBrand = meta.cardBrand;
        }

        if (isProviderPublicConfigured(paymentProvider)) {
          const tokenized = await tokenizeCardForProvider(
            paymentProvider,
            cardForm,
          );
          cardToken = tokenized.cardToken || null;
          paymentMethodId = tokenized.paymentMethodId || null;
          issuerId = tokenized.issuerId || null;

          if (tokenized.cardLastFour) {
            cardLastFour = tokenized.cardLastFour;
          }

          if (tokenized.cardBrand) {
            cardBrand = tokenized.cardBrand;
          }
        }
      }

      const checkout = await createMarketplaceCheckout({
        items: lines.map((line) => ({
          listingId: line.listingId,
          quantity: line.quantity,
          productVariantId: line.productVariantId,
        })),
        deliveryAddressId: selectedAddressId,
        paymentMethod,
        paymentProvider: providerForCheckout,
        cardToken,
        paymentMethodId,
        issuerId,
        cardLastFour,
        cardBrand,
        installments: paymentMethod === "CARD" ? 1 : null,
      });

      if (useCartCheckout) {
        cart.clear();
      }

      router.push(`/pagamento/${checkout.payment.id}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível criar o(s) pedido(s).");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-slate-500">Preparando checkout…</p>;
  }

  if (useCartCheckout && cart.items.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-slate-500">Nada para finalizar. Monte o carrinho.</p>
        <Link href="/carrinho" className="text-blue-600 underline">
          Ir ao carrinho
        </Link>
      </div>
    );
  }

  if (!useCartCheckout && error && !legacyListing) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
        <Link href="/" className="text-blue-600 underline">
          Voltar à vitrine
        </Link>
      </div>
    );
  }

  const displayItems: CartItem[] = useCartCheckout
    ? cart.items
    : legacyListing
      ? [
          {
            listingId: legacyListing.id,
            productVariantId: null,
            variantLabel: null,
            quantity: legacyQuantity,
            title: legacyListing.title || `Anúncio #${legacyListing.id}`,
            salePrice: legacyListing.salePrice,
            thumbnailUrl: legacyListing.thumbnailUrl,
            companyId: legacyListing.companyId,
            companyName:
              legacyListing.companyTradeName || legacyListing.companyLegalName,
            channel: legacyListing.channel,
            categoryAccent: legacyListing.category?.accentColor || null,
          },
        ]
      : [];

  const companyCount = new Set(displayItems.map((item) => item.companyId)).size;

  const total = displayItems.reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0,
  );

  const cardUsesSdk =
    paymentMethod === "CARD" && isProviderPublicConfigured(paymentProvider);
  const useStripeElements =
    paymentMethod === "CARD" &&
    paymentProvider === "stripe" &&
    isStripePublicConfigured();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Checkout</h1>
        <p className="text-slate-500">
          Um checkout gera um pedido por anúncio, agrupado por empresa (
          {companyCount} empresa
          {companyCount === 1 ? "" : "s"}).
        </p>
      </div>

      <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-medium text-slate-800">
          Endereço de entrega
        </legend>
        {addresses.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum endereço cadastrado.{" "}
            <Link
              href={`/perfil/enderecos?next=${encodeURIComponent(
                useCartCheckout
                  ? "/checkout"
                  : `/checkout?listingId=${listingId}`,
              )}`}
              className="text-blue-600 underline"
            >
              Adicionar endereço
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {addresses.map((row) => (
              <li key={row.id}>
                <label className="flex cursor-pointer gap-3 rounded-lg border border-slate-100 p-3 text-sm hover:bg-slate-50">
                  <input
                    type="radio"
                    name="deliveryAddress"
                    checked={selectedAddressId === row.id}
                    onChange={() => {
                      setSelectedAddressId(row.id);
                    }}
                  />
                  <span>
                    <span className="font-medium">
                      {row.label || row.recipientName}
                      {row.isDefault ? " (padrão)" : ""}
                    </span>
                    <span className="mt-0.5 block text-slate-500">
                      {row.street}, {row.number} — {row.district},{" "}
                      {row.city}/{row.state} ·{" "}
                      {formatCepDisplay(row.zipCode)}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={`/perfil/enderecos?next=${encodeURIComponent(
            useCartCheckout ? "/checkout" : `/checkout?listingId=${listingId}`,
          )}`}
          className="text-sm text-blue-600 underline"
        >
          Gerenciar endereços
        </Link>
      </fieldset>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
        <ul className="divide-y divide-slate-100">
          {displayItems.map((item) => (
            <li
              key={cartLineKey(item.listingId, item.productVariantId)}
              className="flex justify-between gap-3 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                {item.variantLabel ? (
                  <p className="text-slate-600">{item.variantLabel}</p>
                ) : null}
                <p className="text-slate-500">
                  {item.companyName} · {item.channel}
                </p>
                {!useCartCheckout ? (
                  <label className="mt-2 flex max-w-28 items-center gap-2">
                    Qtd
                    <input
                      type="number"
                      min={1}
                      value={legacyQuantity}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        if (!Number.isFinite(next) || next < 1) {
                          setLegacyQuantity(1);
                          return;
                        }
                        setLegacyQuantity(Math.floor(next));
                      }}
                      className="w-16 rounded border border-slate-200 px-2 py-1"
                    />
                  </label>
                ) : (
                  <p className="text-slate-500">Qtd {item.quantity}</p>
                )}
              </div>
              <p className="font-semibold">
                {formatPrice(item.salePrice * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <p className="text-base">
          Total: <strong>{formatPrice(total)}</strong>
        </p>

        <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-700">
            Pagamento
          </legend>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "PIX"}
                onChange={() => {
                  setPaymentMethod("PIX");
                }}
              />
              PIX
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "CARD"}
                onChange={() => {
                  setPaymentMethod("CARD");
                }}
              />
              Cartão
            </label>
          </div>

          {paymentMethod === "PIX" ? (
            <p className="text-xs text-slate-500">
              PIX via Mercado Pago
              {!isMercadoPagoPublicConfigured()
                ? " (simulado sem token no .env)."
                : "."}
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-600">
                  Meio de pagamento
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentProvider"
                      checked={paymentProvider === "mercadopago"}
                      onChange={() => {
                        setPaymentProvider("mercadopago");
                      }}
                    />
                    Mercado Pago
                    {!isMercadoPagoPublicConfigured() ? " (simulado)" : ""}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentProvider"
                      checked={paymentProvider === "stripe"}
                      onChange={() => {
                        setPaymentProvider("stripe");
                      }}
                    />
                    Stripe
                    {!isStripePublicConfigured() ? " (simulado)" : ""}
                  </label>
                </div>
              </div>

              <CardPaymentForm
                values={cardForm}
                onChange={setCardForm}
                disabled={submitting}
                mode={useStripeElements ? "nameOnly" : "full"}
              />

              {useStripeElements ? (
                <StripeCardFields disabled={submitting} />
              ) : null}

              <p className="text-xs text-slate-500">
                {useStripeElements
                  ? "Número e CVV no campo seguro Stripe (Elements). PAN não vai ao servidor."
                  : cardUsesSdk
                    ? "Os dados do cartão são tokenizados no navegador (não enviamos o número ao servidor)."
                    : "Sem chave pública do provedor: pagamento simulado no backend (só final/bandeira)."}
              </p>
            </div>
          )}
        </fieldset>

        {error ? (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void handleConfirm();
          }}
          disabled={submitting || !selectedAddressId}
          className="w-full rounded-md px-4 py-2.5 font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {submitting
            ? "Processando…"
            : paymentMethod === "PIX"
              ? "Gerar PIX"
              : "Pagar com cartão"}
        </button>

        {useCartCheckout ? (
          <Link href="/carrinho" className="block text-center text-sm text-blue-600 underline">
            Voltar ao carrinho
          </Link>
        ) : null}
      </div>
    </div>
  );
}
