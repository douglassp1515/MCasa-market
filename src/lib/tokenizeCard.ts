/**
 * Tokenização no browser via SDKs oficiais (CDN).
 * Nunca envia PAN/CVV ao backend GraphQL.
 */

import { getStripeCardHandle } from "@/components/market/StripeCardFields";
import {
  detectCardBrand,
  digitsOnly,
  getMercadoPagoPublicKey,
  parseExpiry,
  type CardFormValues,
  type PaymentProvider,
} from "@/lib/payment";

type TokenizeResult = {
  cardToken?: string | null;
  paymentMethodId?: string | null;
  issuerId?: string | null;
  cardLastFour?: string | null;
  cardBrand?: string | null;
};

function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Tokenização só no browser."));
      return;
    }

    const existing = document.getElementById(id);

    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Falha ao carregar SDK: ${src}`));
    };
    document.head.appendChild(script);
  });
}

async function tokenizeMercadoPago(
  values: CardFormValues,
): Promise<TokenizeResult> {
  const publicKey = getMercadoPagoPublicKey();

  if (!publicKey) {
    throw new Error("Chave pública Mercado Pago ausente.");
  }

  await loadScript("https://sdk.mercadopago.com/js/v2", "mp-sdk-v2");

  const MercadoPagoCtor = (
    window as unknown as {
      MercadoPago?: new (
        key: string,
        options?: { locale?: string },
      ) => {
        createCardToken: (data: Record<string, unknown>) => Promise<{
          id?: string;
        }>;
      };
    }
  ).MercadoPago;

  if (!MercadoPagoCtor) {
    throw new Error("SDK Mercado Pago não disponível.");
  }

  const mp = new MercadoPagoCtor(publicKey, { locale: "pt-BR" });
  const expiry = parseExpiry(values.expiry);

  if (!expiry) {
    throw new Error("Validade inválida.");
  }

  const number = digitsOnly(values.number);
  const brand = detectCardBrand(number);

  const token = await mp.createCardToken({
    cardNumber: number,
    cardholderName: values.holderName.trim(),
    cardExpirationMonth: String(expiry.month).padStart(2, "0"),
    cardExpirationYear: String(expiry.year),
    securityCode: digitsOnly(values.cvv),
    identificationType: "CPF",
    identificationNumber: "00000000000",
  });

  if (!token?.id) {
    throw new Error("Mercado Pago não retornou token do cartão.");
  }

  return {
    cardToken: token.id,
    paymentMethodId: brand === "card" ? "visa" : brand,
    issuerId: null,
    cardLastFour: number.slice(-4),
    cardBrand: brand,
  };
}

async function tokenizeStripe(
  values: CardFormValues,
): Promise<TokenizeResult> {
  const handle = getStripeCardHandle();

  if (!handle) {
    throw new Error("Formulário Stripe ainda não está pronto.");
  }

  const paymentMethodId = await handle.createPaymentMethodId(
    values.holderName,
  );

  return {
    paymentMethodId,
    cardToken: paymentMethodId,
    issuerId: null,
    cardLastFour: null,
    cardBrand: null,
  };
}

export async function tokenizeCardForProvider(
  provider: PaymentProvider,
  values: CardFormValues,
): Promise<TokenizeResult> {
  if (provider === "stripe") {
    return tokenizeStripe(values);
  }

  return tokenizeMercadoPago(values);
}
