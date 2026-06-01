"use client";

import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import VariantEngagementMetrics from "@/components/storefront/VariantEngagementMetrics";
import { formatCatalogMoney, getCatalogPricingDisplay } from "@/lib/catalog/pricing";
import type { CatalogVariant } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";
import { isContactForPrice } from "@/lib/pricing-status";

type RelatedVariantCarouselProps = {
  currentVariantId: string;
  isLoading: boolean;
  productName: string;
  variants: CatalogVariant[];
  onRequestQuote: (variant: CatalogVariant) => void;
};

export default function RelatedVariantCarousel({
  currentVariantId,
  isLoading,
  onRequestQuote,
  productName,
  variants,
}: RelatedVariantCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const displayVariants = useMemo(
    () => variants.filter((item) => item.id !== currentVariantId),
    [currentVariantId, variants],
  );
  const shouldAnimate = displayVariants.length > 2;
  const marqueeItems = shouldAnimate ? [...displayVariants, ...displayVariants] : displayVariants;

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !shouldAnimate) {
      return;
    }

    const tween = gsap.to(track, {
      xPercent: -50,
      duration: Math.max(displayVariants.length * 6, 18),
      ease: "none",
      repeat: -1,
    });

    function pause() {
      tween.pause();
    }

    function resume() {
      tween.resume();
    }

    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", resume);
    track.addEventListener("focusin", pause);
    track.addEventListener("focusout", resume);

    return () => {
      track.removeEventListener("mouseenter", pause);
      track.removeEventListener("mouseleave", resume);
      track.removeEventListener("focusin", pause);
      track.removeEventListener("focusout", resume);
      tween.kill();
      gsap.set(track, { xPercent: 0 });
    };
  }, [displayVariants.length, shouldAnimate]);

  if (isLoading) {
    return (
      <section className="mt-8 border border-border bg-background">
        <RelatedHeader productName={productName} />
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-48 animate-pulse border border-border bg-muted" key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (displayVariants.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 border border-border bg-background">
      <RelatedHeader productName={productName} />
      <div className="overflow-hidden p-4">
        <div
          className={[
            "flex gap-3",
            shouldAnimate ? "w-max will-change-transform" : "overflow-x-auto pb-1",
          ].join(" ")}
          ref={trackRef}
        >
          {marqueeItems.map((item, index) => (
            <RelatedVariantCard
              key={`${item.id}-${index}`}
              variant={item}
              onRequestQuote={() => onRequestQuote(item)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function RelatedHeader({ productName }: { productName: string }) {
  return (
    <div className="border-b border-border bg-muted/20 px-4 py-3">
      <h2 className="text-sm font-semibold">Sản phẩm cùng dòng của {productName}</h2>
    </div>
  );
}

function RelatedVariantCard({
  onRequestQuote,
  variant,
}: {
  onRequestQuote: () => void;
  variant: CatalogVariant;
}) {
  const requiresQuote = isContactForPrice(variant.pricingStatus);
  const imageUrl = variant.effectiveImageUrls?.[0] ?? FALLBACK_LOGO_IMAGE;
  const isFallbackImage = imageUrl === FALLBACK_LOGO_IMAGE;
  const pricing = getCatalogPricingDisplay({
    fallbackPrice: variant.salePrice ?? variant.price,
    pricing: variant.pricing,
    tax: variant.tax,
  });

  return (
    <article className="flex w-[280px] shrink-0 flex-col border border-border bg-background transition-colors hover:border-primary">
      <Link className="block border-b border-border" href={`/san-pham/${variant.slug}`}>
        <div className="relative aspect-[4/3] bg-muted/10">
          <Image
            alt={variant.name}
            className={isFallbackImage ? "object-contain p-8" : "object-cover"}
            fill
            sizes="280px"
            src={imageUrl}
          />
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <p className="truncate font-mono text-[11px] text-muted-foreground">{variant.sku}</p>
        <Link className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5 transition-colors hover:text-primary" href={`/san-pham/${variant.slug}`}>
          {variant.name}
        </Link>
        <div className="mt-3">
          {requiresQuote ? (
            <p className="text-sm font-black text-primary">Liên hệ báo giá</p>
          ) : (
            <p className="text-sm font-black text-primary">{formatCatalogMoney(pricing.totalWithTax)}</p>
          )}
        </div>
        <VariantEngagementMetrics className="mt-3" compact variant={variant} />
        <div className="mt-auto pt-3">
          {requiresQuote ? (
            <button
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 border border-yellow-500 bg-yellow-400 px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-yellow-500"
              onClick={onRequestQuote}
              type="button"
            >
              <FileText className="size-4" />
              Yêu cầu báo giá
            </button>
          ) : (
            <AddToCartButton
              active={variant.active}
              className="h-9 w-full px-3 text-xs"
              label="Thêm vào giỏ"
              pricingStatus={variant.pricingStatus}
              stockQuantity={variant.stockQuantity}
              variantId={variant.id}
            />
          )}
        </div>
      </div>
    </article>
  );
}
