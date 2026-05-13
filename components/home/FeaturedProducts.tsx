"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { listCatalogFeaturedProducts } from "@/lib/api/services/catalog-variants.service";
import type { CatalogFeaturedProduct } from "@/lib/catalog/types";

gsap.registerPlugin(ScrollTrigger);

function ProductCard({ product, large = false }: { product: CatalogFeaturedProduct; large?: boolean }) {
  const topVariant = product.variants[0];
  const partNumber = topVariant?.sku ?? "Đang cập nhật";
  const brandName = product.brand?.name ?? "Không gắn thương hiệu";
  const categoryName = product.category?.name ?? "Danh mục";
  const imageUrl = product.effectiveImageUrls?.[0];

  return (
    <div
      className={`group relative flex cursor-pointer flex-col border border-border bg-white transition-colors hover:border-primary ${
        large ? "row-span-2" : ""
      }`}
    >
      <div
        className={`industrial-grid relative w-full shrink-0 bg-muted ${
          large ? "h-72 lg:h-auto lg:flex-1" : "h-44"
        }`}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-border">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="0" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="font-mono text-[9px] tracking-widest uppercase">No Image</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-5">
        <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground uppercase">{categoryName}</div>
        <h3
          className={`font-black leading-tight tracking-tight transition-colors group-hover:text-primary ${
            large ? "text-xl" : "text-base"
          }`}
        >
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-primary">{partNumber}</span>
          <span className="text-xs text-muted-foreground">{brandName}</span>
        </div>
        <Link
          href={`/san-pham/${topVariant?.slug ?? product.slug}`}
          className="mt-2 inline-flex cursor-pointer border border-border px-4 py-2 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary hover:text-white"
        >
          Xem chi tiết →
        </Link>
      </div>

      <div className="absolute top-0 left-0 h-0.5 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
    </div>
  );
}

const FeaturedProducts = () => {
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<CatalogFeaturedProduct[]>([]);

  useEffect(() => {
    async function loadFeaturedProducts() {
      try {
        const response = await listCatalogFeaturedProducts();
        setProducts(response.slice(0, 6));
      } catch {
        setProducts([]);
      }
    }

    void loadFeaturedProducts();
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const cards = gridRef.current?.children ? Array.from(gridRef.current.children) : [];

    gsap.fromTo(
      cards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.09,
        ease: "expo.out",
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 80%",
          once: true,
        },
      },
    );

    gsap.fromTo(
      headingRef.current,
      { opacity: 0, x: -20 },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: "expo.out",
        scrollTrigger: {
          trigger: headingRef.current,
          start: "top 85%",
          once: true,
        },
      },
    );
  }, [products.length]);

  const [first, second, ...rest] = products;

  return (
    <section className="border-t border-border bg-white py-20">
      <div className="container mx-auto px-4">
        <div ref={headingRef} className="mb-12 flex items-end justify-between">
          <div>
            <div className="mb-3 font-mono text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
              CAT / FEATURED
            </div>
            <h2 className="text-4xl font-black tracking-tight">
              Sản phẩm <span className="text-primary">nổi bật</span>
            </h2>
            <div className="mt-3 h-0.5 w-16 bg-primary" />
          </div>
          <Link
            href="/san-pham"
            className="cursor-pointer border-b border-foreground pb-0.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
          >
            Xem tất cả →
          </Link>
        </div>

        <div ref={gridRef} className="grid grid-cols-1 gap-0 border border-border sm:grid-cols-2 lg:grid-cols-3">
          {first && <ProductCard product={first} large />}
          {second && <ProductCard product={second} large />}
          {rest.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
