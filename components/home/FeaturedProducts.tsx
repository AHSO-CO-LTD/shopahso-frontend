"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "./types";

gsap.registerPlugin(ScrollTrigger);

// ─── Mock data (replace with API later) ────────────────────────────────────

const FEATURED_PRODUCTS: Product[] = [
  {
    id: "fp-01",
    name: "Contactor 3-Pha 32A",
    partNumber: "LC1D32M7",
    brand: "Schneider Electric",
    imageUrl: null,
    category: "Thiết bị đóng cắt",
    isFeatured: true,
  },
  {
    id: "fp-02",
    name: "Bộ lập trình PLC S7-1200",
    partNumber: "6ES7214-1AG40-0XB0",
    brand: "Siemens",
    imageUrl: null,
    category: "PLC & Tự động hóa",
    isFeatured: true,
  },
  {
    id: "fp-03",
    name: "Cảm biến tiệm cận M18",
    partNumber: "E2E-X5ME1-Z",
    brand: "Omron",
    imageUrl: null,
    category: "Cảm biến công nghiệp",
    isFeatured: true,
  },
  {
    id: "fp-04",
    name: "Biến tần 2.2kW 3P",
    partNumber: "FR-E720-2.2K",
    brand: "Mitsubishi",
    imageUrl: null,
    category: "Truyền động",
    isFeatured: true,
  },
  {
    id: "fp-05",
    name: "Relay bảo vệ nhiệt",
    partNumber: "LRD22",
    brand: "Schneider Electric",
    imageUrl: null,
    category: "Thiết bị đóng cắt",
    isFeatured: true,
  },
  {
    id: "fp-06",
    name: "HMI Panel 7-inch",
    partNumber: "NB7W-TW01B",
    brand: "Omron",
    imageUrl: null,
    category: "HMI & SCADA",
    isFeatured: true,
  },
];

// ─── Product Card ────────────────────────────────────────────────────────────

function ProductCard({ product, large = false }: { product: Product; large?: boolean }) {
  return (
    <div
      className={`group relative flex flex-col border border-border bg-white transition-colors hover:border-primary cursor-pointer ${
        large ? "row-span-2" : ""
      }`}
    >
      {/* Image placeholder */}
      <div
        className={`industrial-grid w-full shrink-0 bg-muted flex items-center justify-center ${
          large ? "h-72 lg:h-auto lg:flex-1" : "h-44"
        }`}
      >
        <div className="flex flex-col items-center gap-2 text-border">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="0" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="font-mono text-[9px] tracking-widest uppercase">No Image</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-5">
        <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground uppercase">
          {product.category}
        </div>
        <h3 className={`font-black leading-tight tracking-tight transition-colors group-hover:text-primary ${large ? "text-xl" : "text-base"}`}>
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-primary">{product.partNumber}</span>
          <span className="text-xs text-muted-foreground">{product.brand}</span>
        </div>
        <button
          type="button"
          className="mt-2 cursor-pointer border border-border px-4 py-2 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary hover:text-white"
        >
          Xem chi tiết →
        </button>
      </div>

      {/* Hover top accent */}
      <div className="absolute top-0 left-0 h-0.5 w-0 bg-primary transition-all duration-500 group-hover:w-full" />
    </div>
  );
}

// ─── Featured Products Section ───────────────────────────────────────────────

const FeaturedProducts = () => {
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const [first, second, ...rest] = FEATURED_PRODUCTS;

  return (
    <section className="border-t border-border bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
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
          <button
            type="button"
            className="cursor-pointer border-b border-foreground pb-0.5 text-sm font-semibold transition-colors hover:text-primary hover:border-primary"
          >
            Xem tất cả →
          </button>
        </div>

        {/* Asymmetric grid */}
        <div ref={gridRef} className="grid grid-cols-1 gap-0 border border-border sm:grid-cols-2 lg:grid-cols-3">
          {/* 2 large cards (row-span-2 only on lg) */}
          {first && <ProductCard product={first} large />}
          {second && <ProductCard product={second} large />}
          {/* 4 small cards */}
          {rest.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
