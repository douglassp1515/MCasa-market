"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  addToCart as addToCartStorage,
  clearCart as clearCartStorage,
  getCartItems,
  groupCartByCompany,
  removeFromCart as removeFromCartStorage,
  setCartItemQuantity as setCartItemQuantityStorage,
  type CartItem,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  groups: ReturnType<typeof groupCartByCompany>;
  addItem: typeof addToCartStorage;
  setQuantity: (
    listingId: number,
    productVariantId: number | null,
    quantity: number,
  ) => void;
  removeItem: (listingId: number, productVariantId: number | null) => void;
  clear: () => void;
  refresh: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const refresh = useCallback(() => {
    setItems(getCartItems());
  }, []);

  useEffect(() => {
    refresh();

    function onStorage(event: StorageEvent) {
      if (event.key === "mcasa_marketplace_cart_v2") {
        refresh();
      }
    }

    function onCartChanged() {
      refresh();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("mcasa-cart-changed", onCartChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mcasa-cart-changed", onCartChanged);
    };
  }, [refresh]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.salePrice * item.quantity,
      0,
    );

    return {
      items,
      count,
      subtotal,
      groups: groupCartByCompany(items),
      addItem: (item) => {
        const next = addToCartStorage(item);
        setItems(next);
        return next;
      },
      setQuantity: (listingId, productVariantId, quantity) => {
        setItems(
          setCartItemQuantityStorage(listingId, productVariantId, quantity),
        );
      },
      removeItem: (listingId, productVariantId) => {
        setItems(removeFromCartStorage(listingId, productVariantId));
      },
      clear: () => {
        clearCartStorage();
        setItems([]);
      },
      refresh,
    };
  }, [items, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart deve ser usado dentro de CartProvider.");
  }

  return ctx;
}
