"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatCatalogMoney, getCatalogPricingDisplay } from "@/lib/catalog/pricing";
import type { CatalogVariant } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";
import { isContactForPrice } from "@/lib/pricing-status";

export default function CatalogVariantCard({ variant }: { variant: CatalogVariant }) {
  const router = useRouter();
  const requiresQuote = isContactForPrice(variant.pricingStatus);
  const isOutOfStock = !requiresQuote && variant.stockQuantity <= 0;
  const imageUrl = variant.effectiveImageUrls?.[0] ?? FALLBACK_LOGO_IMAGE;
  const isFallbackImage = imageUrl === FALLBACK_LOGO_IMAGE;
  const stockLabel = isOutOfStock ? "Hết hàng" : `${variant.stockQuantity} ${variant.unit ?? ""}`.trim();

  function handleNavigate(eventTarget: EventTarget | null) {
    if (eventTarget instanceof HTMLElement && eventTarget.closest("a, button")) {
      return;
    }

    router.push(`/san-pham/${variant.slug}`);
  }

  return (
    <article
      aria-label={`Xem chi tiết ${variant.name}`}
      className={[
        "group relative flex min-h-[30rem] cursor-pointer flex-col overflow-hidden border border-border bg-background transition-[border-color,box-shadow,transform] duration-200",
        "hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]",
        "focus-visible:border-primary focus-visible:outline-none",
        isOutOfStock ? "text-muted-foreground" : "",
      ].join(" ")}
      onClick={(event) => handleNavigate(event.target)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleNavigate(event.target);
        }
      }}
      role="link"
      tabIndex={0}
    >
      {!isOutOfStock ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-sky-500/0 opacity-0 transition-[background-color,opacity] duration-200 group-hover:bg-sky-500/12 group-hover:opacity-100 group-focus-visible:bg-sky-500/12 group-focus-visible:opacity-100"
        >
          <span className="border border-sky-700/35 bg-background/90 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-sky-800 shadow-[0_8px_18px_rgba(15,23,42,0.10)]">
            Xem chi tiết
          </span>
        </div>
      ) : null}

      {isOutOfStock ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-muted/35">
          <div className="-rotate-6 border-2 border-foreground/45 px-6 py-3 text-center shadow-[0_0_0_1px_rgba(15,23,42,0.08)_inset]">
            <span className="block text-lg font-black uppercase tracking-[0.22em] text-foreground/70 sm:text-xl">
              Hết hàng
            </span>
          </div>
        </div>
      ) : null}

      <div className={`relative border-b border-border ${isOutOfStock ? "bg-muted/30" : "bg-muted/10"}`}>
        <div className="relative aspect-[5/4] w-full">
          <Image
            alt={variant.name}
            className={`${isFallbackImage ? "object-contain p-8" : "object-cover"} ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
            src={imageUrl}
          />
        </div>

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {!isOutOfStock && requiresQuote ? (
            <span className="border border-yellow-500 bg-yellow-400 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-foreground">
              Báo giá
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {variant.category.name}
          </p>
          <p className="shrink-0 font-mono text-[11px] text-muted-foreground">{variant.sku}</p>
        </div>

        <h2 className="mt-2 line-clamp-2 min-h-11 text-base font-black leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary">
          {variant.name}
        </h2>

        <div className="mt-4 grid grid-cols-2 border border-border text-xs">
          <ProductMetaItem label="Thương hiệu" value={variant.brand?.name ?? "Chưa gắn"} />
          <ProductMetaItem label="Tồn kho" value={stockLabel} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-4">
          <CatalogPrice variant={variant} />
          {!requiresQuote ? (
            <AddToCartButton
              active={variant.active}
              appearance="attention"
              className="relative z-20 size-11 shrink-0"
              iconOnly
              label="Thêm"
              pricingStatus={variant.pricingStatus}
              stockQuantity={variant.stockQuantity}
              variantId={variant.id}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProductMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-r border-border px-3 py-2 even:border-r-0 [&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-semibold text-foreground">{value}</p>
    </div>
  );
}

function CatalogPrice({ variant }: { variant: CatalogVariant }) {
  if (isContactForPrice(variant.pricingStatus)) {
    return (
      <div className="min-w-0">
        <p className="text-lg font-black text-primary">Liên hệ báo giá</p>
        <p className="mt-1 text-xs text-muted-foreground">Giá xác nhận theo số lượng và thời điểm đặt hàng.</p>
      </div>
    );
  }

  const pricing = getCatalogPricingDisplay({
    fallbackPrice: variant.salePrice ?? variant.price,
    pricing: variant.pricing,
    tax: variant.tax,
  });

  return (
    <div className="min-w-0">
      <p className="text-lg font-black text-primary">{formatCatalogMoney(pricing.totalWithTax)}</p>
      <p className="text-xs text-muted-foreground">
        Đã gồm thuế {pricing.taxPercent}% ({formatCatalogMoney(pricing.taxAmount)})
      </p>
    </div>
  );
}
