"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, RefreshCw, TicketPercent } from "lucide-react";
import { gsap } from "gsap";
import { toast } from "sonner";
import {
  formatPromotionDiscount,
  formatPromotionRange,
} from "@/components/promotions/promotion-display";
import { Button } from "@/components/ui/button";
import { listPublicPromotions } from "@/lib/api/services/promotions.service";
import { PROMOTION_BANNER_STANDARD } from "@/lib/banner/banner-standards";
import type { PromotionSummary } from "@/lib/promotion/types";

function getPromotionsWithBanner(promotions: PromotionSummary[]) {
  return promotions.filter((promotion) => promotion.status === "ACTIVE" && promotion.bannerImageUrl);
}

function getPromotionHref(promotion: PromotionSummary) {
  return promotion.bannerLinkUrl || `/khuyen-mai/${promotion.slug}`;
}

export default function HomePromotionStrip() {
  const [promotions, setPromotions] = useState<PromotionSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadPromotions = useCallback(async (showFeedback = false) => {
    const loadingToastId = showFeedback ? toast.loading("Đang tải khuyến mãi đang chạy...") : undefined;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listPublicPromotions();
      setPromotions(response);
      if (showFeedback) {
        toast.success("Đã cập nhật khuyến mãi đang chạy.", { id: loadingToastId });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải chương trình khuyến mãi.";
      setErrorMessage(message);
      toast.error(message, { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPromotions();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPromotions]);

  if (isLoading) {
    return <PromotionStripSkeleton />;
  }

  if (errorMessage) {
    return <PromotionStripError errorMessage={errorMessage} onRetry={() => void loadPromotions(true)} />;
  }

  if (promotions.length === 0) {
    return null;
  }

  const bannerPromotions = getPromotionsWithBanner(promotions);

  if (bannerPromotions.length > 0) {
    return <PromotionBannerRail promotions={bannerPromotions} totalCount={promotions.length} />;
  }

  return <PromotionTextFallback promotions={promotions.slice(0, 3)} totalCount={promotions.length} />;
}

function PromotionBannerRail({
  promotions,
  totalCount,
}: {
  promotions: PromotionSummary[];
  totalCount: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const canNavigate = promotions.length > 1;

  useEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.to(track, {
        duration: reducedMotion ? 0 : 0.55,
        ease: "expo.out",
        xPercent: -100 * activeIndex,
      });
    }, rootRef);

    return () => ctx.revert();
  }, [activeIndex]);

  useEffect(() => {
    if (!canNavigate || isPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promotions.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [canNavigate, isPaused, promotions.length]);

  const goToBanner = useCallback((index: number) => {
    setActiveIndex((current) => {
      const total = promotions.length;

      if (total <= 0) {
        return current;
      }

      return (index + total) % total;
    });
  }, [promotions.length]);

  const goToRelativeBanner = useCallback((offset: number) => {
    setActiveIndex((current) => {
      const total = promotions.length;

      if (total <= 0) {
        return current;
      }

      return (current + offset + total) % total;
    });
  }, [promotions.length]);

  const activePromotionName = useMemo(
    () => promotions[activeIndex]?.name ?? "Khuyến mãi",
    [activeIndex, promotions],
  );

  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-5">
        <PromotionSectionHeader count={totalCount} />
        <div
          className="relative mt-4 border border-border bg-background"
          onBlur={() => setIsPaused(false)}
          onFocus={() => setIsPaused(true)}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          ref={rootRef}
        >
          <div aria-label="Banner khuyến mãi" className="overflow-hidden" role="region">
            <div className="flex will-change-transform" ref={trackRef}>
              {promotions.map((promotion, index) => (
                <div className="w-full shrink-0" key={promotion.id}>
                  <Link
                    aria-label={`Mở khuyến mãi ${promotion.name}`}
                    className="block h-full cursor-pointer overflow-hidden transition-opacity hover:opacity-90"
                    href={getPromotionHref(promotion)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Banner khuyến mãi ${promotion.name}`}
                      className={`${PROMOTION_BANNER_STANDARD.aspectClass} w-full bg-muted/20 object-contain`}
                      src={promotion.bannerImageUrl ?? ""}
                    />
                    <span className="sr-only">
                      {index + 1} / {promotions.length}: {promotion.name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {canNavigate ? (
            <>
              <Button
                aria-label="Banner khuyến mãi trước"
                className="absolute left-3 top-1/2 z-20 size-10 -translate-y-1/2 cursor-pointer rounded-none border-border bg-background/90 p-0 active:!-translate-y-1/2 hover:bg-muted"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  goToRelativeBanner(-1);
                }}
                type="button"
                variant="outline"
              >
                <ChevronLeft className="size-5" />
              </Button>
              <Button
                aria-label="Banner khuyến mãi sau"
                className="absolute right-3 top-1/2 z-20 size-10 -translate-y-1/2 cursor-pointer rounded-none border-border bg-background/90 p-0 active:!-translate-y-1/2 hover:bg-muted"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  goToRelativeBanner(1);
                }}
                type="button"
                variant="outline"
              >
                <ChevronRight className="size-5" />
              </Button>
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {promotions.map((promotion, index) => (
                  <button
                    aria-current={activeIndex === index ? "true" : undefined}
                    aria-label={`Chuyển đến banner khuyến mãi ${promotion.name}`}
                    className={[
                      "h-2.5 cursor-pointer border border-border transition-colors hover:border-primary",
                      activeIndex === index ? "w-8 bg-primary" : "w-2.5 bg-background/90",
                    ].join(" ")}
                    key={`home-promotion-banner-dot-${promotion.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      goToBanner(index);
                    }}
                    type="button"
                  />
                ))}
              </div>
            </>
          ) : null}
          <p className="sr-only">Banner đang hiển thị: {activePromotionName}</p>
        </div>
      </div>
    </section>
  );
}

function PromotionTextFallback({
  promotions,
  totalCount,
}: {
  promotions: PromotionSummary[];
  totalCount: number;
}) {
  const primaryPromotion = promotions[0];

  if (!primaryPromotion) {
    return null;
  }

  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-5">
        <PromotionSectionHeader count={totalCount} />
        <div className="mt-4 grid gap-3 border border-red-700 bg-red-50/70 p-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center border border-red-700 bg-red-600 text-white">
              <TicketPercent className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-red-700">
                Khuyến mãi đang chạy
              </p>
              <h2 className="mt-1 truncate text-xl font-black tracking-tight">
                {primaryPromotion.name}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ưu đãi mặc định {formatPromotionDiscount(primaryPromotion.defaultDiscountType, primaryPromotion.defaultDiscountValue)}
                {" | "}
                {formatPromotionRange(primaryPromotion.startsAt, primaryPromotion.endsAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {promotions.slice(1).map((promotion) => (
              <Link
                className="inline-flex h-9 cursor-pointer items-center border border-border bg-background px-3 text-xs font-semibold transition-colors hover:border-red-700 hover:text-red-700"
                href={`/khuyen-mai/${promotion.slug}`}
                key={promotion.id}
              >
                {promotion.name}
              </Link>
            ))}
            <Link
              className="inline-flex h-10 cursor-pointer items-center gap-2 border border-red-700 bg-red-600 px-4 text-sm font-black text-white transition-colors hover:bg-red-700"
              href={`/khuyen-mai/${primaryPromotion.slug}`}
            >
              Xem chương trình
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PromotionSectionHeader({ count }: { count: number }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border border-red-700 bg-red-50/70 px-4 py-3">
      <div className="min-w-0">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-red-700">
          Chương trình khuyến mãi 
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">
          Ưu đãi đang diễn ra hôm nay
        </h2>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-red-700 bg-background px-3 py-2 text-sm font-black text-red-700">
          {count} chương trình
        </span>
        <Link
          className="inline-flex h-10 cursor-pointer items-center gap-2 border border-red-700 bg-red-600 px-4 text-sm font-black text-white transition-colors hover:bg-red-700"
          href="/khuyen-mai"
        >
          Xem tất cả
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

function PromotionStripError({
  errorMessage,
  onRetry,
}: {
  errorMessage: string;
  onRetry: () => void;
}) {
  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
          <Button className="h-10 cursor-pointer rounded-none px-3" onClick={onRetry} type="button" variant="outline">
            <RefreshCw className="size-4" />
            Tải lại
          </Button>
        </div>
      </div>
    </section>
  );
}

function PromotionStripSkeleton() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className={`${PROMOTION_BANNER_STANDARD.aspectClass} animate-pulse border border-border bg-muted`} />
      </div>
    </section>
  );
}
