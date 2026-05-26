"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { listCatalogFeaturedBrands } from "@/lib/api/services/catalog-variants.service";
import type { CatalogFeaturedBrand } from "@/lib/catalog/types";
import { FALLBACK_LOGO_IMAGE } from "@/lib/image-fallbacks";

gsap.registerPlugin(ScrollTrigger);

const FeaturedBrands = () => {
  const rootRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [brands, setBrands] = useState<CatalogFeaturedBrand[]>([]);

  useEffect(() => {
    async function loadFeaturedBrands() {
      try {
        const response = await listCatalogFeaturedBrands();
        setBrands(response.slice(0, 10));
      } catch {
        setBrands([]);
      }
    }

    void loadFeaturedBrands();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const slots = rowRef.current?.children ? Array.from(rowRef.current.children) : [];

    gsap.fromTo(
      slots,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.06,
        ease: "expo.out",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top 82%",
          once: true,
        },
      },
    );
  }, [brands.length]);

  return (
    <section ref={rootRef} className="border-t border-border bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              PARTNERS / BRANDS
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              Thương hiệu <span className="text-primary">phân phối chính hãng</span>
            </h2>
            <div className="mt-3 h-0.5 w-16 bg-primary" />
          </div>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Hàng hóa nhập khẩu trực tiếp · Có C/O · Bảo hành chính hãng
          </p>
        </div>

        {brands.length === 0 ? (
          <div className="border border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
            Chưa có thương hiệu nổi bật.
          </div>
        ) : (
          <div ref={rowRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/thuong-hieu/${brand.slug}`}
                className="group flex min-h-48 cursor-pointer flex-col border border-border bg-white transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)] focus-visible:border-primary focus-visible:outline-none"
                title={brand.name}
              >
                <div className="flex h-24 items-center justify-center border-b border-border bg-muted/10 px-4 transition-colors group-hover:bg-muted/20">
                  <div className="relative h-12 w-full max-w-32">
                    <Image
                      src={brand.logoUrl ?? FALLBACK_LOGO_IMAGE}
                      alt={brand.name}
                      fill
                      className="object-contain"
                      sizes="128px"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-4 py-3">
                  <p className="line-clamp-2 text-sm font-black leading-tight transition-colors group-hover:text-primary">
                    {brand.name}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <span className="border border-border bg-muted/20 px-2 py-1 font-mono text-muted-foreground">
                      {brand.featuredVariantCount} biến thể
                    </span>
                    <span className="border border-border bg-muted/20 px-2 py-1 font-mono text-muted-foreground">
                      {brand.featuredOrderCount} đơn
                    </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3 text-xs font-semibold transition-colors group-hover:text-primary">
                    <span>Xem thương hiệu</span>
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedBrands;
