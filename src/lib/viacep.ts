export type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export async function fetchAddressByCep(
  cepInput: string,
): Promise<ViaCepResponse | null> {
  const cep = digitsOnly(cepInput);

  if (cep.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ViaCepResponse;

    if (data.erro) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function formatCepDisplay(cep: string) {
  const digits = digitsOnly(cep);

  if (digits.length !== 8) {
    return cep;
  }

  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
