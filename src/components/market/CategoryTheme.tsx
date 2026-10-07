"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_ACCENT,
  type MarketplaceCategory,
} from "@/lib/graphql";

type CategoryThemeValue = {
  accentColor: string;
  surfaceColor: string;
  category: MarketplaceCategory | null;
  setCategory: (category: MarketplaceCategory | null) => void;
};

const CategoryThemeContext = createContext<CategoryThemeValue | null>(null);

export function CategoryThemeProvider({ children }: { children: ReactNode }) {
  const [category, setCategory] = useState<MarketplaceCategory | null>(null);

  const accentColor = category?.accentColor || DEFAULT_ACCENT;
  const surfaceColor = category?.surfaceColor || "#EFF6FF";

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--market-accent", accentColor);
    root.style.setProperty("--market-surface", surfaceColor);
    root.style.setProperty("--market-accent-fg", "#FFFFFF");
  }, [accentColor, surfaceColor]);

  const value = useMemo(
    () => ({
      accentColor,
      surfaceColor,
      category,
      setCategory,
    }),
    [accentColor, surfaceColor, category],
  );

  return (
    <CategoryThemeContext.Provider value={value}>
      {children}
    </CategoryThemeContext.Provider>
  );
}

export function useCategoryTheme() {
  const ctx = useContext(CategoryThemeContext);

  if (!ctx) {
    return {
      accentColor: DEFAULT_ACCENT,
      surfaceColor: "#EFF6FF",
      category: null,
      setCategory: () => undefined,
    };
  }

  return ctx;
}
