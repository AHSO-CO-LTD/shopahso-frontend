"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { listCatalogFeaturedBrands } from "@/lib/api/services/catalog-variants.service";
import type { CatalogFeaturedBrand } from "@/lib/catalog/types";

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
            <div className="mb-2 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
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
          <div
            ref={rowRef}
            className="grid grid-cols-2 gap-0 border border-border sm:grid-cols-3 lg:grid-cols-5"
          >
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/thuong-hieu/${brand.slug}`}
                className="group flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 border-r border-b border-border bg-white p-4 transition-colors hover:bg-primary last:border-r-0"
                title={brand.name}
              >
                <div className="relative h-12 w-28">
                  {brand.logoUrl ? (
                    <Image
                      src={brand.logoUrl}
                      alt={brand.name}
                      fill
                      className="object-contain"
                      sizes="112px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center border border-border font-mono text-[10px] tracking-wider text-muted-foreground transition-colors group-hover:border-white/50 group-hover:text-white/70">
                      NO LOGO
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="line-clamp-1 text-sm font-semibold transition-colors group-hover:text-white">
                    {brand.name}
                  </p>
                  <p className="font-mono text-[10px] tracking-wider text-muted-foreground transition-colors group-hover:text-white/70">
                    {brand.featuredOrderCount} đơn · {brand.featuredVariantCount} biến thể
                  </p>
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
