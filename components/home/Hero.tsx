"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import IndustrialMotion2D from "@/components/home/IndustrialMotion2D";

const Hero = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const sceneWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      if (badgeRef.current) {
        tl.fromTo(
        badgeRef.current,
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: reducedMotion ? 0.01 : 0.6 },
          0,
        );
      }

      const textChildren = textRef.current ? Array.from(textRef.current.children) : [];
      tl.fromTo(
        textChildren,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: reducedMotion ? 0.01 : 0.75,
          stagger: reducedMotion ? 0 : 0.12,
        },
        0.1,
      );

      tl.fromTo(
        sceneWrapRef.current,
        { opacity: 0, scale: 0.97 },
        { opacity: 1, scale: 1, duration: reducedMotion ? 0.01 : 1.1 },
        0.15,
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="industrial-grid relative w-full overflow-hidden bg-white py-16 lg:py-28">
      <div className="absolute left-0 top-0 h-1 w-full bg-primary" />

      <div className="container mx-auto flex flex-col items-center gap-10 px-4 lg:flex-row lg:gap-16">
        <div className="z-10 flex-1 lg:max-w-lg">
          <div
            ref={badgeRef}
            className="mb-6 inline-flex items-center gap-2 border border-primary/30 bg-primary/8 px-3 py-1"
          >
            <span className="h-1.5 w-1.5 bg-primary" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              B2B · B2C · Industrial Supply Chain
            </span>
          </div>

          <div ref={textRef}>
            <h1 className="mb-5 text-5xl font-black leading-none tracking-tight lg:text-[4.5rem]">
              Linh kiện <br />
              công nghiệp <span className="text-primary">chính xác.</span>
            </h1>

            <p className="mb-3 border-l-4 border-primary bg-muted py-3 pl-4 pr-4 text-base font-medium leading-relaxed text-muted-foreground">
              Tra cứu Part Number · SKU · Datasheet tức thì.
              <br />
              Đặt hàng lẻ hoặc báo giá bulk cho doanh nghiệp.
            </p>

            <p className="mb-9 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Thiết bị đóng cắt · Cảm biến · PLC · Robot · Băng chuyền
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="border-b-4 border-black/20 bg-primary px-9 py-4 font-semibold text-white transition-all hover:brightness-110 active:translate-y-0.5"
              >
                Tìm linh kiện
              </button>
              <button
                type="button"
                className="border border-foreground bg-white px-9 py-4 font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Gửi yêu cầu báo giá
              </button>
            </div>
          </div>
        </div>

        <div
          ref={sceneWrapRef}
          className="relative w-full flex-1 lg:max-w-2xl"
          style={{ aspectRatio: "4/3" }}
        >
          <div className="pointer-events-none absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-primary" />
          <div className="pointer-events-none absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-primary" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-primary" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-primary" />

          <div className="pointer-events-none absolute left-6 top-3 z-10 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
            AHSO · Live Assembly Simulation
          </div>

          <div className="absolute inset-0 overflow-hidden">
            <IndustrialMotion2D />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
