"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─── 9 skeleton slots — sẽ được thay bằng API data khi admin upload logo ───

const BRAND_SLOTS = Array.from({ length: 9 }, (_, i) => ({
  id: `brand-skeleton-${i}`,
  index: i + 1,
}));

// ─── Featured Brands Section ─────────────────────────────────────────────────

const FeaturedBrands = () => {
  const rootRef = useRef<HTMLElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

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
  }, []);

  return (
    <section ref={rootRef} className="border-t border-border bg-muted py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
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

        {/* Brand grid: 9 skeleton slots */}
        <div
          ref={rowRef}
          className="grid grid-cols-3 gap-0 border border-border sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9"
        >
          {BRAND_SLOTS.map((slot) => (
            <div
              key={slot.id}
              className="group flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 border-r border-b border-border bg-white p-4 transition-colors hover:bg-primary last:border-r-0"
              title="Thương hiệu đang được cập nhật"
            >
              {/* Placeholder icon */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-border transition-colors group-hover:text-white"
              >
                <rect x="2" y="7" width="20" height="14" rx="0" />
                <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                <line x1="12" y1="12" x2="12" y2="16" />
              </svg>
              {/* Slot number */}
              <span className="font-mono text-[8px] tracking-[0.2em] text-muted-foreground transition-colors group-hover:text-white/70">
                {String(slot.index).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="mt-4 font-mono text-[10px] tracking-wider text-muted-foreground">
          * Admin có thể cập nhật logo thương hiệu từ trang quản trị.
        </p>
      </div>
    </section>
  );
};

export default FeaturedBrands;
