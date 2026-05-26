"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { listCatalogNewestProducts } from "@/lib/api/services/catalog-variants.service";
import { formatCatalogMoney, getCatalogPricingDisplay } from "@/lib/catalog/pricing";
import type { CatalogFeaturedProduct } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";

gsap.registerPlugin(ScrollTrigger);

function ArrivalCard({ product }: { product: CatalogFeaturedProduct }) {
  const topVariant = product.variants[0];
  const imageUrl = product.effectiveImageUrls?.[0] ?? FALLBACK_LOGO_IMAGE;
  const isFallbackImage = imageUrl === FALLBACK_LOGO_IMAGE;
  const pricing = topVariant?.pricing
    ? getCatalogPricingDisplay({
        fallbackPrice: topVariant.pricing.totalWithTax,
        pricing: topVariant.pricing,
        tax: topVariant.tax,
      })
    : null;
  const dateStr = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(product.createdAt));

  return (
    <div className="group w-72 shrink-0 cursor-pointer border border-border bg-white transition-colors hover:border-primary">
      <div className="industrial-grid relative h-48 w-full bg-muted">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className={isFallbackImage ? "object-contain p-8" : "object-cover"}
          sizes="288px"
        />
        <div className="absolute top-3 left-3 bg-primary px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.18em] text-white uppercase">
          MỚI
        </div>
        <div className="absolute right-3 bottom-3 bg-white/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-muted-foreground">
          {dateStr}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 p-5">
        <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground uppercase">
          {product.category?.name ?? "Danh mục"}
        </div>
        <h3 className="text-base font-black leading-tight tracking-tight transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="font-mono text-xs text-primary">{topVariant?.sku ?? "Đang cập nhật"}</span>
          <span className="text-xs text-muted-foreground">{product.brand?.name ?? "Không gắn thương hiệu"}</span>
        </div>
        {pricing ? (
          <div>
            <p className="text-sm font-black text-primary">{formatCatalogMoney(pricing.totalWithTax)}</p>
            <p className="text-[11px] text-muted-foreground">Đã gồm thuế {pricing.taxPercent}%</p>
          </div>
        ) : null}
        <Link
          href={`/san-pham/${topVariant?.slug ?? product.slug}`}
          className="mt-2 inline-flex cursor-pointer border border-border px-4 py-2 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary hover:text-white"
        >
          Xem chi tiết →
        </Link>
      </div>
    </div>
  );
}

const NewArrivals = () => {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [arrivals, setArrivals] = useState<CatalogFeaturedProduct[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  useEffect(() => {
    async function loadNewestProducts() {
      try {
        const response = await listCatalogNewestProducts();
        setArrivals(response.slice(0, 10));
      } catch {
        setArrivals([]);
      }
    }

    void loadNewestProducts();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    gsap.fromTo(
      rootRef.current,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "expo.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 82%",
          once: true,
        },
      },
    );
  }, []);

  const updateButtonState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 10);
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateButtonState, { passive: true });
    updateButtonState();
    return () => el.removeEventListener("scroll", updateButtonState);
  }, [updateButtonState, arrivals.length]);

  const scroll = (dir: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    gsap.to(el, {
      scrollLeft: el.scrollLeft + (dir === "next" ? 288 : -288),
      duration: 0.55,
      ease: "expo.out",
    });
  };

  return (
    <section ref={rootRef} className="border-t border-border bg-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              STOCK / NEW ARRIVALS
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Hàng <span className="text-primary">mới về</span>
            </h2>
            <div className="mt-3 h-0.5 w-16 bg-primary" />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll("prev")}
              disabled={!canPrev}
              aria-label="Sản phẩm trước"
              className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll("next")}
              disabled={!canNext}
              aria-label="Sản phẩm tiếp theo"
              className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {arrivals.length === 0 ? (
          <div className="border border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
            Chưa có sản phẩm mới.
          </div>
        ) : (
          <div
            ref={trackRef}
            className="flex gap-0 overflow-x-auto scroll-smooth border border-border scrollbar-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {arrivals.map((product) => (
              <ArrivalCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default NewArrivals;
