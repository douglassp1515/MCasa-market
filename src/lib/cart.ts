export type CartItem = {
  listingId: number;
  productVariantId: number | null;
  variantLabel: string | null;
  quantity: number;
  title: string;
  salePrice: number;
  thumbnailUrl: string | null;
  companyId: number;
  companyName: string;
  channel: string;
  categoryAccent: string | null;
};

const CART_KEY = "mcasa_marketplace_cart_v2";

export function cartLineKey(
  listingId: number,
  productVariantId: number | null | undefined,
): string {
  const variantPart =
    productVariantId && Number.isInteger(productVariantId)
      ? productVariantId
      : 0;
  return `${listingId}:${variantPart}`;
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function normalizeCartItem(raw: unknown): CartItem | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const item = raw as Partial<CartItem>;

  if (
    !Number.isInteger(item.listingId) ||
    !item.listingId ||
    item.listingId <= 0 ||
    !Number.isFinite(item.quantity) ||
    (item.quantity ?? 0) < 1
  ) {
    return null;
  }

  let productVariantId: number | null = null;

  if (
    item.productVariantId != null &&
    Number.isInteger(item.productVariantId) &&
    item.productVariantId > 0
  ) {
    productVariantId = item.productVariantId;
  }

  return {
    listingId: item.listingId,
    productVariantId,
    variantLabel:
      typeof item.variantLabel === "string" ? item.variantLabel : null,
    quantity: Math.floor(Number(item.quantity)),
    title: typeof item.title === "string" ? item.title : `Anúncio #${item.listingId}`,
    salePrice: Number.isFinite(item.salePrice) ? Number(item.salePrice) : 0,
    thumbnailUrl:
      typeof item.thumbnailUrl === "string" ? item.thumbnailUrl : null,
    companyId: Number.isInteger(item.companyId) ? Number(item.companyId) : 0,
    companyName:
      typeof item.companyName === "string" ? item.companyName : "Loja",
    channel: typeof item.channel === "string" ? item.channel : "",
    categoryAccent:
      typeof item.categoryAccent === "string" ? item.categoryAccent : null,
  };
}

function readCart(): CartItem[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((row) => normalizeCartItem(row))
      .filter((row): row is CartItem => row !== null);
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("mcasa-cart-changed"));
  } catch {
    // ignore quota / private mode
  }
}

export function getCartItems(): CartItem[] {
  return readCart();
}

export function getCartCount(): number {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal(): number {
  return readCart().reduce(
    (sum, item) => sum + item.salePrice * item.quantity,
    0,
  );
}

export function addToCart(
  item: Omit<CartItem, "quantity"> & { quantity?: number },
): CartItem[] {
  const qty = Math.max(1, Math.floor(item.quantity || 1));
  const current = readCart();
  const key = cartLineKey(item.listingId, item.productVariantId);
  const index = current.findIndex(
    (row) => cartLineKey(row.listingId, row.productVariantId) === key,
  );

  if (index >= 0) {
    current[index] = {
      ...current[index],
      ...item,
      quantity: current[index].quantity + qty,
    };
  } else {
    current.push({
      listingId: item.listingId,
      productVariantId: item.productVariantId ?? null,
      variantLabel: item.variantLabel ?? null,
      quantity: qty,
      title: item.title,
      salePrice: item.salePrice,
      thumbnailUrl: item.thumbnailUrl,
      companyId: item.companyId,
      companyName: item.companyName,
      channel: item.channel,
      categoryAccent: item.categoryAccent,
    });
  }

  writeCart(current);
  return current;
}

export function setCartItemQuantity(
  listingId: number,
  productVariantId: number | null,
  quantity: number,
): CartItem[] {
  const qty = Math.floor(quantity);
  const key = cartLineKey(listingId, productVariantId);
  let current = readCart();

  if (qty < 1) {
    current = current.filter(
      (item) => cartLineKey(item.listingId, item.productVariantId) !== key,
    );
  } else {
    current = current.map((item) => {
      if (cartLineKey(item.listingId, item.productVariantId) !== key) {
        return item;
      }

      return { ...item, quantity: qty };
    });
  }

  writeCart(current);
  return current;
}

export function removeFromCart(
  listingId: number,
  productVariantId: number | null,
): CartItem[] {
  const key = cartLineKey(listingId, productVariantId);
  const current = readCart().filter(
    (item) => cartLineKey(item.listingId, item.productVariantId) !== key,
  );
  writeCart(current);
  return current;
}

export function clearCart(): void {
  writeCart([]);
}

/** Agrupa por empresa (preparação A2 split). */
export function groupCartByCompany(items: CartItem[]) {
  const map = new Map<
    number,
    { companyId: number; companyName: string; items: CartItem[] }
  >();

  for (const item of items) {
    const existing = map.get(item.companyId);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    map.set(item.companyId, {
      companyId: item.companyId,
      companyName: item.companyName,
      items: [item],
    });
  }

  return Array.from(map.values());
}
