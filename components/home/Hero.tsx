"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const albumCards = [
  {
    src: "/pic1.jpg",
    alt: "Linh kiện và thiết bị công nghiệp AHSO số 01",
    badge: "100% Quality",
    badgePosition: "right",
    badgeTone: "bg-primary text-white",
    subtitle: "Kiểm chuẩn đầu vào",
    code: "01",
  },
  {
    src: "/pic2.webp",
    alt: "Linh kiện và thiết bị công nghiệp AHSO số 02",
    badge: "OEM Ready",
    badgePosition: "left",
    badgeTone: "bg-secondary text-secondary-foreground",
    subtitle: "Tài liệu kỹ thuật rõ ràng",
    code: "02",
  },
  {
    src: "/pic3.jpg",
    alt: "Linh kiện và thiết bị công nghiệp AHSO số 03",
    badge: "Global Shipping",
    badgePosition: "left",
    badgeTone: "bg-accent text-white",
    subtitle: "Luân chuyển hàng hóa quốc tế",
    code: "03",
  },
  {
    src: "/pic4.webp",
    alt: "Linh kiện và thiết bị công nghiệp AHSO số 04",
    badge: "Fast Response",
    badgePosition: "right",
    badgeTone: "bg-foreground text-background",
    subtitle: "Phản hồi nhanh cho đội thu mua",
    code: "04",
  },
] as const;

const stackStates = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1, zIndex: 4 },
  { x: 34, y: -10, rotate: 4, scale: 0.965, opacity: 0.9, zIndex: 3 },
  { x: -30, y: -26, rotate: -5, scale: 0.93, opacity: 0.8, zIndex: 2 },
  { x: 26, y: -42, rotate: 6, scale: 0.895, opacity: 0.68, zIndex: 1 },
] as const;

const Hero = () => {
  const textRef = useRef<HTMLDivElement>(null);
  const graphicRef = useRef<HTMLDivElement>(null);
  const albumCardsRef = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      const textChildren = textRef.current?.children ?? [];
      const initialCards = albumCardsRef.current.filter((card): card is HTMLDivElement => Boolean(card));

      const applyStackState = (cards: HTMLDivElement[]) => {
        cards.forEach((card, index) => {
          const state = stackStates[index];

          if (!state) {
            gsap.set(card, { autoAlpha: 0, zIndex: 0 });
            return;
          }

          gsap.set(card, {
            autoAlpha: 1,
            x: state.x,
            y: state.y,
            rotation: state.rotate,
            scale: state.scale,
            opacity: state.opacity,
            zIndex: state.zIndex,
            rotateY: 0,
            transformPerspective: 1600,
            transformOrigin: "left center",
          });
        });
      };

      const introTimeline = gsap.timeline({ defaults: { ease: "expo.out" } });

      introTimeline.fromTo(
        textChildren,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: reducedMotion ? 0.01 : 0.85, stagger: reducedMotion ? 0 : 0.14 },
        0,
      );

      introTimeline.fromTo(
        graphicRef.current,
        { scale: 0.96, opacity: 0 },
        { scale: 1, opacity: 1, duration: reducedMotion ? 0.01 : 1 },
        reducedMotion ? 0 : 0.12,
      );

      if (!initialCards.length) {
        return;
      }

      applyStackState(initialCards);

      if (reducedMotion || initialCards.length < 2) {
        return;
      }

      let stopped = false;
      let delayTween: gsap.core.Tween | null = null;
      let idleTween: gsap.core.Tween | null = null;

      const startIdleMotion = () => {
        const frontCard = albumCardsRef.current[0];

        if (!frontCard) {
          return;
        }

        idleTween?.kill();
        idleTween = gsap.to(frontCard, {
          y: stackStates[0].y + 8,
          duration: 1.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      };

      const cycleCards = () => {
        if (stopped) {
          return;
        }

        idleTween?.kill();

        const cards = albumCardsRef.current.filter((card): card is HTMLDivElement => Boolean(card));
        const visibleCards = cards.slice(0, stackStates.length);
        const frontCard = visibleCards[0];

        if (!frontCard || visibleCards.length < 2) {
          return;
        }

        const timeline = gsap.timeline({
          defaults: { ease: "expo.out" },
          onComplete: () => {
            albumCardsRef.current = [...cards.slice(1), frontCard];
            applyStackState(albumCardsRef.current.filter((card): card is HTMLDivElement => Boolean(card)));
            startIdleMotion();
            delayTween = gsap.delayedCall(1.5, cycleCards);
          },
        });

        timeline.set(frontCard, { zIndex: stackStates.length + 2 });
        timeline.to(
          frontCard,
          {
            rotateY: -76,
            rotation: -8,
            x: -18,
            y: 110,
            opacity: 0.22,
            duration: 0.42,
            ease: "power2.in",
          },
          0,
        );

        visibleCards.slice(1).forEach((card, index) => {
          const nextState = stackStates[index];

          timeline.to(
            card,
            {
              x: nextState.x,
              y: nextState.y,
              rotation: nextState.rotate,
              scale: nextState.scale,
              opacity: nextState.opacity,
              zIndex: nextState.zIndex,
              duration: 0.62,
            },
            0.08,
          );
        });

        const lastState = stackStates[Math.min(visibleCards.length, stackStates.length) - 1];

        timeline.set(
          frontCard,
          {
            x: lastState.x,
            y: lastState.y - 46,
            rotation: lastState.rotate - 4,
            scale: lastState.scale,
            opacity: 0,
            zIndex: lastState.zIndex,
            rotateY: 0,
          },
          0.38,
        );

        timeline.to(
          frontCard,
          {
            x: lastState.x,
            y: lastState.y,
            rotation: lastState.rotate,
            scale: lastState.scale,
            opacity: lastState.opacity,
            zIndex: lastState.zIndex,
            duration: 0.5,
          },
          0.4,
        );
      };

      startIdleMotion();
      delayTween = gsap.delayedCall(1.1, cycleCards);

      return () => {
        stopped = true;
        delayTween?.kill();
        idleTween?.kill();
      };
    }, graphicRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="industrial-grid relative w-full overflow-hidden bg-white py-20 lg:py-32">
      <div className="container mx-auto flex flex-col items-center gap-16 px-4 lg:flex-row">
        <div ref={textRef} className="z-10 flex-1">
          <div className="mb-6 inline-block bg-secondary px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-secondary-foreground">
            Industrial Supply Chain Solutions
          </div>
          <h1 className="mb-8 text-5xl font-black italic leading-none tracking-tight lg:text-8xl">
            Chính xác <br />
            <span className="text-primary not-italic">hiệu suất</span> <br />
            <span className="text-accent">tin cậy</span>
          </h1>
          <p className="mb-10 max-w-lg border border-border bg-white/70 px-6 py-4 text-lg text-muted-foreground">
            Hệ thống phân phối linh kiện và vật tư công nghiệp với dữ liệu rõ ràng, nguồn hàng ổn định và tốc độ phản
            hồi đủ nhanh cho đội kỹ thuật và thu mua.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="border-b-4 border-black/20 bg-primary px-10 py-4 font-semibold text-white transition-all hover:brightness-110 active:translate-y-1">
              Khám phá catalog
            </button>
            <button className="border border-border bg-white px-10 py-4 font-semibold text-foreground transition-colors hover:bg-muted">
              Tra cứu SKU
            </button>
          </div>
        </div>

        <div ref={graphicRef} className="relative aspect-square w-full max-w-xl flex-1 overflow-visible [perspective:1600px]">
          <div className="absolute inset-[4%] translate-x-5 translate-y-5 rotate-[4deg] border border-primary/20" />
          <div className="absolute inset-[4%] -translate-x-5 -translate-y-3 -rotate-[3deg] border border-secondary/25" />

          <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
            {albumCards.map((card, index) => (
              <div
                key={card.src}
                ref={(node) => {
                  albumCardsRef.current[index] = node;
                }}
                className="absolute inset-x-[10%] inset-y-[7%] overflow-hidden border border-border bg-muted [backface-visibility:hidden] [transform-style:preserve-3d]"
              >
                <Image
                  src={card.src}
                  alt={card.alt}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 90vw, 44vw"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-background/14" />
                <div className="industrial-grid absolute inset-0 opacity-[0.07]" />

                <div className="relative flex h-full flex-col justify-between p-5 lg:p-7">
                  <div className="flex">
                    <div
                      className={[
                        "px-4 py-3 text-sm font-semibold",
                        card.badgeTone,
                        card.badgePosition === "left" ? "mr-auto" : "ml-auto",
                      ].join(" ")}
                    >
                      {card.badge}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 self-start border border-background/60 bg-background/86 px-5 py-4 text-foreground">
                    <div className="text-4xl font-black tracking-tight lg:text-5xl">AHSO</div>
                    <div className="text-sm font-bold tracking-[0.32em] text-primary">INDUSTRIAL</div>
                  </div>

                  <div className="flex items-end justify-between gap-4 border-t border-background/60 pt-4 text-sm text-background">
                    <span className="max-w-[70%] font-medium">{card.subtitle}</span>
                    <span className="font-mono text-xs tracking-[0.24em] text-background/85">{card.code}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
