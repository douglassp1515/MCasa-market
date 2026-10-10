import { clsx } from "clsx";

import { brand } from "@/config/brand";

/** Símbolo oficial Luar — public/brand/symbol*.svg */
export function LuarMark({
  className,
  showWordmark = true,
  size = 36,
  inverted = false,
}: {
  className?: string;
  showWordmark?: boolean;
  size?: number;
  inverted?: boolean;
}) {
  const symbolSrc = inverted
    ? "/brand/symbol-white.svg"
    : "/brand/symbol.svg";

  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <img
        src={symbolSrc}
        alt=""
        width={size}
        height={size}
        className="shrink-0 object-contain"
        aria-hidden
      />
      {showWordmark ? (
        <span className="flex min-w-0 flex-col leading-tight">
          <span
            className={clsx(
              "truncate text-sm font-semibold tracking-tight",
              inverted ? "text-white" : "text-slate-900",
            )}
          >
            {brand.storefront}
          </span>
          <span
            className={clsx(
              "truncate text-[10px] uppercase tracking-[0.12em]",
              inverted ? "text-white/70" : "text-slate-500",
            )}
          >
            {brand.product}
          </span>
        </span>
      ) : null}
    </div>
  );
}
