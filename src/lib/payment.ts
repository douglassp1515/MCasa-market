/**
 * Config pública de pagamento (Mercado Pago + Stripe).
 * Sem public key do provedor escolhido → backend usa modo simulated.
 */

export type PaymentMethod = "PIX" | "CARD";
export type PaymentProvider = "mercadopago" | "stripe";

export type CardFormValues = {
  holderName: string;
  number: string;
  expiry: string;
  cvv: string;
};

export function getMercadoPagoPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

  if (!key || !String(key).trim()) {
    return null;
  }

  return String(key).trim();
}

export function isMercadoPagoPublicConfigured(): boolean {
  return Boolean(getMercadoPagoPublicKey());
}

export function getStripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!key || !String(key).trim()) {
    return null;
  }

  return String(key).trim();
}

export function isStripePublicConfigured(): boolean {
  return Boolean(getStripePublishableKey());
}

export function isProviderPublicConfigured(
  provider: PaymentProvider,
): boolean {
  if (provider === "stripe") {
    return isStripePublicConfigured();
  }

  return isMercadoPagoPublicConfigured();
}

export function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

export function formatCardNumberDisplay(value: string): string {
  const digits = digitsOnly(value).slice(0, 19);
  const parts: string[] = [];

  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }

  return parts.join(" ");
}

export function formatExpiryDisplay(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function detectCardBrand(number: string): string {
  const digits = digitsOnly(number);

  if (/^4/.test(digits)) {
    return "visa";
  }

  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
    return "mastercard";
  }

  if (/^3[47]/.test(digits)) {
    return "amex";
  }

  if (/^6(?:011|5)/.test(digits)) {
    return "discover";
  }

  if (/^(606282|3841)/.test(digits)) {
    return "hipercard";
  }

  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|6277|6362|6363)/.test(digits)) {
    return "elo";
  }

  return "card";
}

/** Luhn check — leve; não substitui validação do gateway. */
export function luhnValid(number: string): boolean {
  const digits = digitsOnly(number);

  if (digits.length < 13) {
    return false;
  }

  let sum = 0;
  let alt = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);

    if (alt) {
      n *= 2;

      if (n > 9) {
        n -= 9;
      }
    }

    sum += n;
    alt = !alt;
  }

  return sum % 10 === 0;
}

export function parseExpiry(expiry: string): {
  month: number;
  year: number;
} | null {
  const digits = digitsOnly(expiry);

  if (digits.length !== 4) {
    return null;
  }

  const month = Number(digits.slice(0, 2));
  const yearShort = Number(digits.slice(2, 4));

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  if (!Number.isInteger(yearShort)) {
    return null;
  }

  return {
    month,
    year: 2000 + yearShort,
  };
}

export function validateCardForm(values: CardFormValues): string | null {
  const holder = String(values.holderName || "").trim();

  if (holder.length < 3) {
    return "Informe o nome impresso no cartão.";
  }

  const number = digitsOnly(values.number);

  if (number.length < 13 || number.length > 19 || !luhnValid(number)) {
    return "Número do cartão inválido.";
  }

  const expiry = parseExpiry(values.expiry);

  if (!expiry) {
    return "Validade inválida (MM/AA).";
  }

  const now = new Date();
  const expEnd = new Date(expiry.year, expiry.month, 0, 23, 59, 59);

  if (expEnd < now) {
    return "Cartão vencido.";
  }

  const cvv = digitsOnly(values.cvv);
  const brand = detectCardBrand(number);
  const cvvLen = brand === "amex" ? 4 : 3;

  if (cvv.length !== cvvLen) {
    return `CVV inválido (${cvvLen} dígitos).`;
  }

  return null;
}

export function cardMetaFromForm(values: CardFormValues): {
  cardLastFour: string;
  cardBrand: string;
} {
  const number = digitsOnly(values.number);

  return {
    cardLastFour: number.slice(-4),
    cardBrand: detectCardBrand(number),
  };
}
