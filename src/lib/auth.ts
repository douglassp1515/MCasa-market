export type MarketplaceBuyer = {
  id: number;
  email: string;
  name: string;
};

const TOKEN_KEY = "mcasa_marketplace_buyer_token";
const USER_KEY = "mcasa_marketplace_buyer_user";
const CHECKOUT_RESUME_KEY = "mcasa_marketplace_checkout_resume";

function canUseStorage() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function getBuyerToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getBuyerUser(): MarketplaceBuyer | null {
  const parsed = readJson<MarketplaceBuyer>(USER_KEY);

  if (!parsed) {
    return null;
  }

  if (
    typeof parsed.id !== "number" ||
    typeof parsed.email !== "string" ||
    typeof parsed.name !== "string"
  ) {
    return null;
  }

  return parsed;
}

export function setBuyerSession(token: string, user: MarketplaceBuyer): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function updateBuyerUser(user: MarketplaceBuyer): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearBuyerSession(): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

export function hasBuyerSession(): boolean {
  return Boolean(getBuyerToken() && getBuyerUser());
}

/** Limpa a sessão quando o token expira ou `meMarketplaceBuyer` retorna inválido. */
export function invalidateBuyerSession(): void {
  clearBuyerSession();
}

/**
 * Detecta falha de autenticação GraphQL (JWT expirado / 401 / UNAUTHENTICATED).
 * Não trata todo FORBIDDEN — pode ser papel errado com token ainda válido.
 */
export function isGraphqlAuthFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybe = error as {
    response?: {
      status?: number;
      errors?: Array<{
        message?: string;
        extensions?: { code?: string };
      }>;
    };
    message?: string;
  };

  if (maybe.response?.status === 401) {
    return true;
  }

  const first = maybe.response?.errors?.[0];
  const code = String(first?.extensions?.code || "").toUpperCase();

  if (code === "UNAUTHENTICATED") {
    return true;
  }

  const message = String(first?.message || maybe.message || "").toLowerCase();

  if (
    message.includes("jwt expired") ||
    message.includes("invalid token") ||
    message.includes("token expir") ||
    message.includes("sessão expirada") ||
    message.includes("nao autenticado") ||
    message.includes("não autenticado")
  ) {
    return true;
  }

  return false;
}

/** Aceita path (`/checkout`) ou listingId legado (number). */
export function setCheckoutResume(target: string | number): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    if (typeof target === "number") {
      window.localStorage.setItem(
        CHECKOUT_RESUME_KEY,
        `/checkout?listingId=${target}`,
      );
      return;
    }

    window.localStorage.setItem(CHECKOUT_RESUME_KEY, target);
  } catch {
    // ignore
  }
}

/** Retorna path para redirecionar após login (ex. `/checkout`). */
export function consumeCheckoutResume(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CHECKOUT_RESUME_KEY);
    window.localStorage.removeItem(CHECKOUT_RESUME_KEY);

    if (!raw) {
      return null;
    }

    if (raw.startsWith("/")) {
      return raw;
    }

    const id = Number(raw);

    if (Number.isInteger(id) && id > 0) {
      return `/checkout?listingId=${id}`;
    }

    return null;
  } catch {
    return null;
  }
}
