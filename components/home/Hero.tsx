"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import HeroSearchConsole from "@/components/home/HeroSearchConsole";
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
    <section className="industrial-grid relative w-full overflow-hidden bg-white py-12 lg:py-20">
      <div className="absolute left-0 top-0 h-1 w-full bg-primary" />

      <div className="container mx-auto flex flex-col items-start gap-10 px-4 lg:flex-row lg:gap-16">
        <div className="z-10 w-full flex-1 lg:max-w-lg">
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
            <h1 className="mb-4 text-4xl font-black leading-none tracking-tight lg:text-[3.5rem]">
              Linh kiện <br />
              công nghiệp <span className="text-primary">chính xác.</span>
            </h1>

            <p className="mb-5 font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
              Thiết bị đóng cắt · Cảm biến · PLC · Robot · Băng chuyền
            </p>

            <HeroSearchConsole />

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/san-pham"
                className="inline-flex h-10 cursor-pointer items-center gap-2 border border-border bg-background px-4 text-sm font-black transition-colors hover:border-primary hover:text-primary"
              >
                Xem tất cả sản phẩm
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/thuong-hieu"
                className="inline-flex h-10 cursor-pointer items-center gap-2 border border-border bg-background px-4 text-sm font-black transition-colors hover:border-primary hover:text-primary"
              >
                Tra theo thương hiệu
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/tai-khoan/yeu-cau-bao-gia"
                className="inline-flex h-10 cursor-pointer items-center gap-2 border border-primary bg-primary px-4 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Gửi yêu cầu báo giá
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>

        <div
          ref={sceneWrapRef}
          className="relative hidden w-full flex-1 lg:block lg:max-w-xl"
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
