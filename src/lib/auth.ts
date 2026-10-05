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

export function setCheckoutResume(listingId: number): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(CHECKOUT_RESUME_KEY, String(listingId));
  } catch {
    // ignore
  }
}

export function consumeCheckoutResume(): number | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CHECKOUT_RESUME_KEY);
    window.localStorage.removeItem(CHECKOUT_RESUME_KEY);

    if (!raw) {
      return null;
    }

    const id = Number(raw);

    if (!Number.isInteger(id) || id <= 0) {
      return null;
    }

    return id;
  } catch {
    return null;
  }
}
