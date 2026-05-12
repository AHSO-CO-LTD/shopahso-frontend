"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "./types";

gsap.registerPlugin(ScrollTrigger);

// ─── Mock data (replace with API later) ─────────────────────────────────────

const NEW_ARRIVALS: Product[] = [
  {
    id: "na-01",
    name: "Encoder tuyệt đối 12-bit",
    partNumber: "E6CP-AG5C-C 2M",
    brand: "Omron",
    imageUrl: null,
    category: "Cảm biến & Encoder",
    isNew: true,
    arrivedAt: "2026-05-10",
  },
  {
    id: "na-02",
    name: "Servo Drive 750W",
    partNumber: "SGDV-7R6A01A",
    brand: "Yaskawa",
    imageUrl: null,
    category: "Servo & Truyền động",
    isNew: true,
    arrivedAt: "2026-05-09",
  },
  {
    id: "na-03",
    name: "Bộ ngắt mạch MCB 3P 40A",
    partNumber: "A9F74340",
    brand: "Schneider Electric",
    imageUrl: null,
    category: "Thiết bị đóng cắt",
    isNew: true,
    arrivedAt: "2026-05-08",
  },
  {
    id: "na-04",
    name: "Router công nghiệp 5-cổng",
    partNumber: "FL SWITCH 5TX",
    brand: "Phoenix Contact",
    imageUrl: null,
    category: "Mạng công nghiệp",
    isNew: true,
    arrivedAt: "2026-05-07",
  },
  {
    id: "na-05",
    name: "Cảm biến áp suất 0-10 bar",
    partNumber: "PSA-10-1/4-A",
    brand: "Festo",
    imageUrl: null,
    category: "Khí nén & Thủy lực",
    isNew: true,
    arrivedAt: "2026-05-06",
  },
];

// ─── New Arrival Card ────────────────────────────────────────────────────────

function ArrivalCard({ product }: { product: Product }) {
  const dateStr = product.arrivedAt
    ? new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(product.arrivedAt),
      )
    : null;

  return (
    <div className="group w-72 shrink-0 border border-border bg-white transition-colors hover:border-primary cursor-pointer">
      {/* Image placeholder */}
      <div className="industrial-grid relative h-48 w-full bg-muted flex items-center justify-center">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-border">
          <rect x="3" y="3" width="18" height="18" rx="0" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        {/* NEW badge */}
        <div className="absolute top-3 left-3 bg-primary px-2.5 py-1 font-mono text-[9px] font-bold tracking-[0.18em] text-white uppercase">
          MỚI
        </div>
        {/* Date */}
        {dateStr && (
          <div className="absolute bottom-3 right-3 font-mono text-[9px] tracking-wider text-muted-foreground">
            {dateStr}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-5">
        <div className="font-mono text-[9px] tracking-[0.22em] text-muted-foreground uppercase">
          {product.category}
        </div>
        <h3 className="text-base font-black leading-tight tracking-tight transition-colors group-hover:text-primary">
          {product.name}
        </h3>
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="font-mono text-xs text-primary">{product.partNumber}</span>
          <span className="text-xs text-muted-foreground">{product.brand}</span>
        </div>
      </div>
    </div>
  );
}

// ─── New Arrivals Section ────────────────────────────────────────────────────

const NewArrivals = () => {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

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
  }, [updateButtonState]);

  const scroll = (dir: "prev" | "next") => {
    const el = trackRef.current;
    if (!el) return;
    const amount = 288 + 0; // card width 72 * 4 = 288
    gsap.to(el, {
      scrollLeft: el.scrollLeft + (dir === "next" ? amount : -amount),
      duration: 0.55,
      ease: "expo.out",
    });
  };

  return (
    <section ref={rootRef} className="border-t border-border bg-white py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
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

          {/* Prev / Next */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll("prev")}
              disabled={!canPrev}
              aria-label="Sản phẩm trước"
              className="flex h-10 w-10 cursor-pointer items-center justify-center border border-border transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Horizontal scroll track */}
        <div
          ref={trackRef}
          className="flex gap-0 overflow-x-auto scroll-smooth border border-border scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {NEW_ARRIVALS.map((product) => (
            <ArrivalCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
