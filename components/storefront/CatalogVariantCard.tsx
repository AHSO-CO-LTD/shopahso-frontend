"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatCatalogMoney } from "@/lib/catalog/pricing";
import type { CatalogVariant } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";
import { isContactForPrice } from "@/lib/pricing-status";

export default function CatalogVariantCard({
  onRequestQuote,
  variant,
}: {
  onRequestQuote?: (variant: CatalogVariant) => void;
  variant: CatalogVariant;
}) {
  const router = useRouter();
  const requiresQuote = isContactForPrice(variant.pricingStatus);
  const isOutOfStock = !requiresQuote && variant.stockQuantity <= 0;
  const imageUrl = variant.effectiveImageUrls?.[0] ?? FALLBACK_LOGO_IMAGE;
  const isFallbackImage = imageUrl === FALLBACK_LOGO_IMAGE;
  const regularPrice = toCatalogNumber(variant.price);
  const salePrice = toCatalogNumber(variant.salePrice);
  const discountPercent = getDiscountPercent({
    discountPercent: variant.discountPercent,
    price: regularPrice,
    salePrice,
  });
  const discountedPrice = getDiscountedPrice({
    discountPercent,
    price: regularPrice,
    salePrice,
  });
  const isDiscounted = !requiresQuote && discountedPrice !== null && regularPrice !== null && discountedPrice > 0 && discountedPrice < regularPrice;

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
        "group relative flex min-h-[23rem] cursor-pointer flex-col overflow-hidden border border-border bg-background transition-[border-color,box-shadow,transform] duration-200 sm:min-h-[30rem] xl:min-h-[25rem]",
        "hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]",
        "focus-visible:border-primary focus-visible:outline-none",
        isDiscounted ? "border-red-600 hover:border-red-700 focus-visible:border-red-700" : "",
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
          <span className="border border-sky-700/35 bg-background/90 px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-sky-800 shadow-[0_8px_18px_rgba(15,23,42,0.10)] sm:px-4 sm:text-xs sm:tracking-[0.16em]">
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
        <div className="relative aspect-square w-full sm:aspect-[5/4]">
          <Image
            alt={variant.name}
            className={`${isFallbackImage ? "object-contain p-5 sm:p-8" : "object-cover"} ${isOutOfStock ? "opacity-50 grayscale" : ""}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            src={imageUrl}
          />
        </div>

        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
          {!isOutOfStock && isDiscounted && discountPercent !== null ? (
            <span className="relative z-30 border border-red-700 bg-red-600 px-1.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-white sm:px-2 sm:text-[10px] sm:tracking-[0.14em]">
              -{discountPercent}%
            </span>
          ) : null}
          {!isOutOfStock && requiresQuote ? (
            <span className="border border-yellow-500 bg-yellow-400 px-1.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-foreground sm:px-2 sm:text-[10px] sm:tracking-[0.14em]">
              Báo giá
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-4 xl:p-3">
        <div className="grid gap-1 sm:flex sm:items-start sm:justify-between sm:gap-3">
          <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {variant.category.name}
          </p>
          <p className="min-w-0 truncate font-mono text-[10px] text-muted-foreground sm:shrink-0 sm:text-[11px]">{variant.sku}</p>
        </div>

        <h2 className="mt-2 line-clamp-2 min-h-10 text-sm font-black leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:min-h-11 sm:text-base xl:min-h-10 xl:text-sm">
          {variant.name}
        </h2>

        <div className="mt-3 border border-border text-[11px] sm:mt-4 sm:text-xs">
          <ProductMetaItem label="Thương hiệu" value={variant.brand?.name ?? "Chưa gắn"} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-border pt-3 sm:gap-3 sm:pt-4">
          <CatalogPrice variant={variant} />
          {!requiresQuote ? (
            <AddToCartButton
              active={variant.active}
              appearance="attention"
              className="relative z-20 size-9 shrink-0 sm:size-11 xl:size-10"
              iconOnly
              label="Thêm"
              pricingStatus={variant.pricingStatus}
              stockQuantity={variant.stockQuantity}
              variantId={variant.id}
            />
          ) : (
            <button
              aria-label={`Yêu cầu báo giá ${variant.name}`}
              className="relative z-20 inline-flex size-9 shrink-0 cursor-pointer items-center justify-center border border-yellow-500 bg-yellow-400 text-foreground transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-yellow-500 sm:size-11 xl:size-10"
              onClick={(event) => {
                event.stopPropagation();
                onRequestQuote?.(variant);
              }}
              type="button"
            >
              <FileText className="size-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 py-1.5 sm:px-3 sm:py-2">
      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[10px] sm:tracking-[0.12em]">{label}</p>
      <p className="mt-1 truncate font-semibold text-foreground xl:text-[11px]">{value}</p>
    </div>
  );
}

function CatalogPrice({ variant }: { variant: CatalogVariant }) {
  if (isContactForPrice(variant.pricingStatus)) {
    return (
      <div className="min-w-0">
        <p className="text-sm font-black text-primary sm:text-lg xl:text-base">Liên hệ báo giá</p>
        <p className="mt-1 hidden text-xs text-muted-foreground sm:block">Giá xác nhận theo số lượng và thời điểm đặt hàng.</p>
      </div>
    );
  }

  const regularPrice = toCatalogNumber(variant.price);
  const salePrice = toCatalogNumber(variant.salePrice);
  const discountPercent = getDiscountPercent({
    discountPercent: variant.discountPercent,
    price: regularPrice,
    salePrice,
  });
  const discountedPrice = getDiscountedPrice({
    discountPercent,
    price: regularPrice,
    salePrice,
  });
  const isDiscounted = discountedPrice !== null && regularPrice !== null && discountedPrice > 0 && discountedPrice < regularPrice;
  const displayPrice = isDiscounted ? discountedPrice : variant.salePrice ?? variant.price;

  return (
    <div className="min-w-0">
      <p className={["truncate text-sm font-black sm:text-lg xl:text-base", isDiscounted ? "text-red-700" : "text-primary"].join(" ")}>
        {formatCatalogMoney(displayPrice)}
      </p>
      {isDiscounted ? (
        <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground line-through">
          {formatCatalogMoney(regularPrice)}
        </p>
      ) : null}
    </div>
  );
}

function toCatalogNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsedValue = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getDiscountPercent({
  discountPercent,
  price,
  salePrice,
}: {
  discountPercent: number | string | null | undefined;
  price: number | null;
  salePrice: number | null;
}) {
  const explicitPercent = toCatalogNumber(discountPercent);

  if (explicitPercent !== null && explicitPercent > 0) {
    return Math.round(explicitPercent);
  }

  if (price === null || salePrice === null || price <= 0 || salePrice >= price) {
    return null;
  }

  return Math.round(((price - salePrice) / price) * 100);
}

function getDiscountedPrice({
  discountPercent,
  price,
  salePrice,
}: {
  discountPercent: number | null;
  price: number | null;
  salePrice: number | null;
}) {
  if (salePrice !== null && price !== null && salePrice > 0 && salePrice < price) {
    return salePrice;
  }

  if (discountPercent === null || price === null || price <= 0) {
    return null;
  }

  return Math.max(price * (1 - discountPercent / 100), 0);
}
