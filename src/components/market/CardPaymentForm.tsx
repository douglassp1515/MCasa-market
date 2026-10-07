"use client";

import type { CardFormValues } from "@/lib/payment";
import {
  formatCardNumberDisplay,
  formatExpiryDisplay,
} from "@/lib/payment";

type CardPaymentFormProps = {
  values: CardFormValues;
  onChange: (next: CardFormValues) => void;
  disabled?: boolean;
  /** nameOnly: só titular (Stripe Elements cuida do restante). */
  mode?: "full" | "nameOnly";
};

export function CardPaymentForm({
  values,
  onChange,
  disabled = false,
  mode = "full",
}: CardPaymentFormProps) {
  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-medium text-slate-800">Dados do cartão</p>

      <label className="block space-y-1 text-sm">
        <span className="text-slate-600">Nome no cartão</span>
        <input
          type="text"
          autoComplete="cc-name"
          disabled={disabled}
          value={values.holderName}
          onChange={(event) => {
            onChange({ ...values, holderName: event.target.value });
          }}
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2"
          placeholder="Como impresso no cartão"
        />
      </label>

      {mode === "full" ? (
        <>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-600">Número</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              disabled={disabled}
              value={values.number}
              onChange={(event) => {
                onChange({
                  ...values,
                  number: formatCardNumberDisplay(event.target.value),
                });
              }}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono tracking-wide"
              placeholder="0000 0000 0000 0000"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1 text-sm">
              <span className="text-slate-600">Validade</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                disabled={disabled}
                value={values.expiry}
                onChange={(event) => {
                  onChange({
                    ...values,
                    expiry: formatExpiryDisplay(event.target.value),
                  });
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono"
                placeholder="MM/AA"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-slate-600">CVV</span>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                disabled={disabled}
                value={values.cvv}
                onChange={(event) => {
                  const next = event.target.value.replace(/\D/g, "").slice(0, 4);
                  onChange({ ...values, cvv: next });
                }}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono"
                placeholder="***"
              />
            </label>
          </div>
        </>
      ) : null}
    </div>
  );
}
