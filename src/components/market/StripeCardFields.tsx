"use client";

import { useEffect, useRef, useState } from "react";

import { getStripePublishableKey } from "@/lib/payment";

type StripeCardFieldsProps = {
  disabled?: boolean;
  onReadyChange?: (ready: boolean) => void;
};

type StripeLike = {
  elements: (opts?: { locale?: string }) => {
    create: (
      type: "card",
      options?: Record<string, unknown>,
    ) => StripeCardElement;
  };
  createPaymentMethod: (params: {
    type: "card";
    card: StripeCardElement;
    billing_details?: { name?: string };
  }) => Promise<{
    error?: { message?: string };
    paymentMethod?: { id?: string };
  }>;
};

type StripeCardElement = {
  mount: (el: HTMLElement) => void;
  destroy: () => void;
  on: (
    event: string,
    cb: (e: { complete?: boolean; error?: { message?: string } }) => void,
  ) => void;
};

type StripeCardHandle = {
  createPaymentMethodId: (holderName: string) => Promise<string>;
};

let sharedHandle: StripeCardHandle | null = null;

export function getStripeCardHandle(): StripeCardHandle | null {
  return sharedHandle;
}

function loadStripeJs(): Promise<(key: string) => StripeLike> {
  return new Promise((resolve, reject) => {
    const w = window as unknown as {
      Stripe?: (key: string) => StripeLike;
    };

    if (w.Stripe) {
      resolve(w.Stripe);
      return;
    }

    const existing = document.getElementById("stripe-js-v3");

    if (existing) {
      existing.addEventListener("load", () => {
        if (w.Stripe) {
          resolve(w.Stripe);
        } else {
          reject(new Error("Stripe.js não carregou."));
        }
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "stripe-js-v3";
    script.src = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => {
      if (w.Stripe) {
        resolve(w.Stripe);
      } else {
        reject(new Error("Stripe.js não disponível."));
      }
    };
    script.onerror = () => {
      reject(new Error("Falha ao carregar Stripe.js."));
    };
    document.head.appendChild(script);
  });
}

export function StripeCardFields({
  disabled = false,
  onReadyChange,
}: StripeCardFieldsProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let cardInstance: StripeCardElement | null = null;

    async function mount() {
      const key = getStripePublishableKey();

      if (!key || !mountRef.current) {
        return;
      }

      try {
        const StripeCtor = await loadStripeJs();

        if (cancelled || !mountRef.current) {
          return;
        }

        const stripe = StripeCtor(key);
        const elements = stripe.elements({ locale: "pt-BR" });
        const card = elements.create("card", {
          style: {
            base: {
              fontSize: "16px",
              color: "#0f172a",
              "::placeholder": { color: "#94a3b8" },
            },
          },
          disabled,
        });
        card.mount(mountRef.current);
        cardInstance = card;

        sharedHandle = {
          createPaymentMethodId: async (holderName: string) => {
            const result = await stripe.createPaymentMethod({
              type: "card",
              card,
              billing_details: {
                name: holderName.trim() || undefined,
              },
            });

            if (result.error) {
              throw new Error(
                result.error.message || "Falha ao tokenizar no Stripe.",
              );
            }

            if (!result.paymentMethod?.id) {
              throw new Error("Stripe não retornou payment method.");
            }

            return result.paymentMethod.id;
          },
        };

        card.on("change", (event) => {
          if (event.error?.message) {
            setError(event.error.message);
            onReadyChange?.(false);
            return;
          }

          setError(null);
          onReadyChange?.(Boolean(event.complete));
        });

        onReadyChange?.(false);
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Não foi possível carregar o formulário Stripe.");
        }
        onReadyChange?.(false);
      }
    }

    void mount();

    return () => {
      cancelled = true;
      sharedHandle = null;

      if (cardInstance) {
        try {
          cardInstance.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, [disabled, onReadyChange]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-600">Cartão (Stripe Elements — PCI)</p>
      <div
        ref={mountRef}
        className="rounded-md border border-slate-200 bg-white px-3 py-3"
      />
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
