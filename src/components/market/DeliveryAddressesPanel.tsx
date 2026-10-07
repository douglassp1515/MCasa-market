"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { hasBuyerSession, setCheckoutResume } from "@/lib/auth";
import {
  createMarketplaceDeliveryAddress,
  deleteMarketplaceDeliveryAddress,
  fetchMyMarketplaceDeliveryAddresses,
  setDefaultMarketplaceDeliveryAddress,
  type MarketplaceBuyerAddress,
} from "@/lib/graphql";
import { fetchAddressByCep, formatCepDisplay } from "@/lib/viacep";

const UF_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

type AddressForm = {
  label: string;
  recipientName: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
};

function emptyForm(): AddressForm {
  return {
    label: "",
    recipientName: "",
    phone: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    isDefault: false,
  };
}

function formatAddressLine(row: MarketplaceBuyerAddress) {
  const parts = [
    row.street,
    row.number,
    row.complement,
    row.district,
    `${row.city}/${row.state}`,
    formatCepDisplay(row.zipCode),
  ].filter(Boolean);

  return parts.join(" · ");
}

type DeliveryAddressesPanelProps = {
  embedded?: boolean;
};

export function DeliveryAddressesPanel({
  embedded = false,
}: DeliveryAddressesPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");

  const [addresses, setAddresses] = useState<MarketplaceBuyerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm());
  const [cepLoading, setCepLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const rows = await fetchMyMarketplaceDeliveryAddresses();
    setAddresses(rows);
  }, []);

  useEffect(() => {
    if (!hasBuyerSession()) {
      setCheckoutResume(nextPath || "/perfil/enderecos");
      router.replace("/login?next=/perfil/enderecos");
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
      } catch (err) {
        if (cancelled) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Falha ao carregar endereços.");
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
  }, [router, nextPath]);

  function patchForm<K extends keyof AddressForm>(key: K, value: AddressForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCepLookup() {
    setCepLoading(true);
    setError(null);

    try {
      const result = await fetchAddressByCep(form.zipCode);

      if (!result) {
        setError("CEP não encontrado na ViaCEP.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        zipCode: result.cep.replace(/\D/g, ""),
        street: result.logradouro || prev.street,
        complement: result.complemento || prev.complement,
        district: result.bairro || prev.district,
        city: result.localidade || prev.city,
        state: result.uf || prev.state,
      }));
    } finally {
      setCepLoading(false);
    }
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await createMarketplaceDeliveryAddress({
        label: form.label.trim() || null,
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim() || null,
        zipCode: form.zipCode.trim(),
        street: form.street.trim(),
        number: form.number.trim(),
        complement: form.complement.trim() || null,
        district: form.district.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        isDefault: form.isDefault || addresses.length === 0,
      });

      await reload();
      setForm(emptyForm());
      setFormOpen(false);
      setSuccess("Endereço adicionado.");

      if (nextPath && nextPath.startsWith("/")) {
        const rows = await fetchMyMarketplaceDeliveryAddresses();

        if (rows.length > 0) {
          router.push(nextPath);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível salvar o endereço.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    setError(null);

    try {
      await deleteMarketplaceDeliveryAddress(id);
      await reload();
      setSuccess("Endereço removido.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível excluir.");
      }
    }
  }

  async function handleSetDefault(id: number) {
    setError(null);

    try {
      await setDefaultMarketplaceDeliveryAddress(id);
      await reload();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Não foi possível definir padrão.");
      }
    }
  }

  if (loading) {
    return <p className="text-slate-500">Carregando endereços…</p>;
  }

  return (
    <div className={embedded ? "space-y-6" : "mx-auto max-w-2xl space-y-6"}>
      <div className="space-y-2">
        {embedded ? (
          <h2 className="text-xl font-semibold tracking-tight">
            Endereços de entrega
          </h2>
        ) : (
          <h1 className="text-3xl font-semibold tracking-tight">
            Endereços de entrega
          </h1>
        )}
        <p className="text-slate-500">
          Cadastre um ou mais endereços. O CEP busca logradouro na ViaCEP.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}

      <ul className="space-y-3">
        {addresses.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-slate-200 bg-white p-4 text-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {row.label || "Endereço"}
                  {row.isDefault ? (
                    <span className="ml-2 rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                      Padrão
                    </span>
                  ) : null}
                </p>
                <p className="text-slate-600">{row.recipientName}</p>
                <p className="mt-1 text-slate-500">{formatAddressLine(row)}</p>
                {row.phone ? (
                  <p className="text-slate-500">Tel. {row.phone}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {!row.isDefault ? (
                  <button
                    type="button"
                    onClick={() => {
                      void handleSetDefault(row.id);
                    }}
                    className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
                  >
                    Tornar padrão
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    void handleDelete(row.id);
                  }}
                  className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {addresses.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nenhum endereço ainda. Adicione o primeiro para finalizar compras.
        </p>
      ) : null}

      {!formOpen ? (
        <button
          type="button"
          onClick={() => {
            setFormOpen(true);
            setError(null);
            setSuccess(null);
          }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          Novo endereço
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 className="text-lg font-semibold">Novo endereço</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">Apelido (opcional)</span>
              <input
                value={form.label}
                onChange={(event) => patchForm("label", event.target.value)}
                placeholder="Casa, trabalho…"
                className="rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">Destinatário</span>
              <input
                required
                value={form.recipientName}
                onChange={(event) =>
                  patchForm("recipientName", event.target.value)
                }
                className="rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500">Telefone (opcional)</span>
            <input
              value={form.phone}
              onChange={(event) => patchForm("phone", event.target.value)}
              className="max-w-xs rounded-md border border-slate-200 px-3 py-2"
            />
          </label>

          <div className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">CEP</span>
              <input
                required
                value={form.zipCode}
                onChange={(event) => patchForm("zipCode", event.target.value)}
                onBlur={() => {
                  void handleCepLookup();
                }}
                placeholder="00000000"
                className="w-36 rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <button
              type="button"
              disabled={cepLoading}
              onClick={() => {
                void handleCepLookup();
              }}
              className="rounded-md border border-slate-200 px-3 py-2 text-sm disabled:opacity-60"
            >
              {cepLoading ? "Buscando…" : "Buscar ViaCEP"}
            </button>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-500">Logradouro</span>
            <input
              required
              value={form.street}
              onChange={(event) => patchForm("street", event.target.value)}
              className="rounded-md border border-slate-200 px-3 py-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">Número</span>
              <input
                required
                value={form.number}
                onChange={(event) => patchForm("number", event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="col-span-2 flex flex-col gap-1 text-sm">
              <span className="text-slate-500">Complemento</span>
              <input
                value={form.complement}
                onChange={(event) =>
                  patchForm("complement", event.target.value)
                }
                className="rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">Bairro</span>
              <input
                required
                value={form.district}
                onChange={(event) => patchForm("district", event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">Cidade</span>
              <input
                required
                value={form.city}
                onChange={(event) => patchForm("city", event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">UF</span>
              <select
                required
                value={form.state}
                onChange={(event) => patchForm("state", event.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2"
              >
                <option value="">—</option>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) =>
                patchForm("isDefault", event.target.checked)
              }
            />
            Definir como endereço padrão
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Salvando…" : "Salvar endereço"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setForm(emptyForm());
              }}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <p className="text-sm text-slate-500">
        <Link href="/checkout" className="text-blue-600 underline">
          Ir ao checkout
        </Link>
        {" · "}
        <Link href="/perfil/compras" className="text-blue-600 underline">
          Minhas compras
        </Link>
      </p>
    </div>
  );
}
