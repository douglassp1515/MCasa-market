/**
 * Stub de pagamento — montado para A3 (PIX / cartão).
 * Sem chaves reais nesta fase; UI e contrato locais apenas.
 */

export type PaymentMethod = "PIX" | "CARD" | "NONE";

export type PaymentStubConfig = {
  /** Quando true, checkout tenta chamar gateway (ainda não implementado). */
  enabled: boolean;
  /** Provider futuro: mercadopago | stripe | pagarme | none */
  provider: "none" | "mercadopago" | "stripe" | "pagarme";
  /** Env keys a configurar depois (não lidas ainda no client). */
  requiredEnvKeys: string[];
  methods: PaymentMethod[];
};

export const paymentStub: PaymentStubConfig = {
  enabled: false,
  provider: "none",
  requiredEnvKeys: [
    "PAYMENT_PROVIDER",
    "PAYMENT_PUBLIC_KEY",
    "PAYMENT_SECRET_KEY",
  ],
  methods: ["PIX", "CARD"],
};

export type PaymentIntentStub = {
  method: PaymentMethod;
  amount: number;
  status: "STUB_PENDING" | "STUB_SKIPPED";
  message: string;
};

/** Cria intenção fictícia até a integração real. */
export function createPaymentIntentStub(input: {
  method: PaymentMethod;
  amount: number;
}): PaymentIntentStub {
  if (!paymentStub.enabled || input.method === "NONE") {
    return {
      method: input.method,
      amount: input.amount,
      status: "STUB_SKIPPED",
      message:
        "Pagamento ainda não integrado. Pedidos são criados como PENDING.",
    };
  }

  return {
    method: input.method,
    amount: input.amount,
    status: "STUB_PENDING",
    message: `Stub ${input.method}: configure ${paymentStub.requiredEnvKeys.join(", ")}.`,
  };
}
