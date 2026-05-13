"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const VALUE_PROPS = [
  {
    id: "search",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
        <rect x="2" y="4" width="20" height="16" rx="0" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="7" y1="4" x2="7" y2="9" />
        <circle cx="12" cy="15" r="2.5" />
        <line x1="14.8" y1="17.8" x2="17" y2="20" />
      </svg>
    ),
    title: "Tra cứu chính xác",
    desc: "Part Number, SKU, Datasheet — tìm ra ngay trong kho hơn 1 triệu sản phẩm.",
    code: "USP-01",
  },
  {
    id: "b2b",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
        <rect x="2" y="7" width="20" height="15" rx="0" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="12" y1="12" x2="12" y2="16" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
    title: "Đặt hàng B2B",
    desc: "Hỗ trợ Purchase Order, hợp đồng, và báo giá bulk cho doanh nghiệp sản xuất.",
    code: "USP-02",
  },
  {
    id: "stock",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
        <polyline points="21 8 21 21 3 21 3 8" />
        <rect x="1" y="3" width="22" height="5" />
        <line x1="10" y1="12" x2="14" y2="12" />
      </svg>
    ),
    title: "Tồn kho minh bạch",
    desc: "Số lượng thực tế, trạng thái sẵn có và thời gian giao hàng ước tính rõ ràng.",
    code: "USP-03",
  },
  {
    id: "support",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Phản hồi nhanh",
    desc: "Đội kỹ thuật và thu mua phản hồi trong vòng 2 giờ cho mọi yêu cầu.",
    code: "USP-04",
  },
] as const;

const ValueProps = () => {
  const rootRef = useRef<HTMLElement>(null);
  const colsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const cols = colsRef.current.filter((c): c is HTMLDivElement => Boolean(c));

    gsap.fromTo(
      cols,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        stagger: 0.12,
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
    <section ref={rootRef} className="border-y border-border bg-white">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-border">
        {VALUE_PROPS.map((prop, i) => (
          <div
            key={prop.id}
            ref={(el) => { colsRef.current[i] = el; }}
            className="group flex flex-col gap-4 px-8 py-10 transition-colors hover:bg-muted"
          >
            {/* Code badge */}
            <div className="font-mono text-[9px] tracking-[0.28em] text-muted-foreground">{prop.code}</div>

            {/* Icon */}
            <div className="text-primary transition-transform group-hover:-translate-y-0.5">
              {prop.icon}
            </div>

            {/* Text */}
            <div>
              <h3 className="mb-1.5 text-base font-black tracking-tight">{prop.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{prop.desc}</p>
            </div>

            {/* Hover indicator */}
            <div className="h-0.5 w-0 bg-primary transition-all duration-500 group-hover:w-10" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default ValueProps;
