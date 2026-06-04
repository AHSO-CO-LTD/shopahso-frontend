"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { gsap } from "gsap";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listPublicBanners } from "@/lib/api/services/banners.service";
import { HOMEPAGE_BANNER_STANDARD } from "@/lib/banner/banner-standards";
import type { Banner } from "@/lib/banner/types";

function getHomepageBanners(banners: Banner[]) {
  return banners
    .filter((item) => item.active && item.placement === "HOMEPAGE" && item.imageUrl)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export default function HomePublicBannerSlot() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBanners = useCallback(async (showFeedback = false) => {
    const loadingToastId = showFeedback ? toast.loading("Đang tải lại banner trang chủ...") : undefined;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await listPublicBanners("HOMEPAGE");
      setBanners(response);
      setActiveIndex(0);
      if (showFeedback) {
        toast.success("Đã cập nhật banner trang chủ.", { id: loadingToastId });
      }
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "Không thể tải banner trang chủ.";
      setBanners([]);
      setErrorMessage(nextMessage);
      toast.error(nextMessage, { id: loadingToastId });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialBanners() {
      try {
        const response = await listPublicBanners("HOMEPAGE");
        if (!cancelled) {
          setBanners(response);
          setActiveIndex(0);
        }
      } catch (error) {
        if (!cancelled) {
          const nextMessage = error instanceof Error ? error.message : "Không thể tải banner trang chủ.";
          setBanners([]);
          setErrorMessage(nextMessage);
          toast.error(nextMessage);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialBanners();

    return () => {
      cancelled = true;
    };
  }, []);

  const homepageBanners = useMemo(() => getHomepageBanners(banners), [banners]);
  const canNavigate = homepageBanners.length > 1;

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
      setActiveIndex((current) => (current + 1) % homepageBanners.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [canNavigate, homepageBanners.length, isPaused]);

  const goToBanner = useCallback((index: number) => {
    setActiveIndex((current) => {
      const total = homepageBanners.length;

      if (total <= 0) {
        return current;
      }

      return (index + total) % total;
    });
  }, [homepageBanners.length]);

  const goToRelativeBanner = useCallback((offset: number) => {
    setActiveIndex((current) => {
      const total = homepageBanners.length;

      if (total <= 0) {
        return current;
      }

      return (current + offset + total) % total;
    });
  }, [homepageBanners.length]);

  if (isLoading) {
    return <HomeBannerSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="border border-border bg-background p-5 sm:p-6">
        <p className="text-sm font-semibold text-destructive">{errorMessage}</p>
        <Button
          className="mt-4 h-10 cursor-pointer rounded-none px-4 font-black"
          onClick={() => void loadBanners(true)}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Tải lại
        </Button>
      </div>
    );
  }

  if (homepageBanners.length === 0) {
    return (
      <div className="border border-border bg-background p-5 sm:p-6">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          HOMEPAGE banner
        </p>
        <p className="mt-2 text-sm font-semibold text-foreground">
          Chưa có banner trang chủ đang hoạt động.
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Banner sẽ hiển thị tại đây khi backoffice tạo banner active, có imageUrl và placement HOMEPAGE.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative border border-border bg-background"
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={rootRef}
    >
      <div
        aria-label="Banner trang chủ"
        className="overflow-hidden"
        role="region"
      >
        <div className="flex will-change-transform" ref={trackRef}>
          {homepageBanners.map((banner, index) => (
            <div className="w-full shrink-0" key={banner.id}>
              <Link
                aria-label={`Mở banner trang chủ ${index + 1}`}
                className={[
                  "block h-full overflow-hidden",
                  banner.linkUrl ? "cursor-pointer transition-opacity hover:opacity-90" : "cursor-default",
                ].join(" ")}
                href={banner.linkUrl || "#"}
                onClick={(event) => {
                  if (!banner.linkUrl) {
                    event.preventDefault();
                    event.stopPropagation();
                  }
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`Banner trang chủ ShopAHSO ${index + 1}`}
                  className={`${HOMEPAGE_BANNER_STANDARD.aspectClass} w-full bg-muted/20 object-contain`}
                  src={banner.imageUrl ?? ""}
                />
              </Link>
            </div>
          ))}
        </div>
      </div>

      {canNavigate ? (
        <>
          <Button
            aria-label="Banner trước"
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
            aria-label="Banner sau"
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
            {homepageBanners.map((banner, index) => (
              <button
                aria-label={`Chuyển đến banner ${index + 1}`}
                className={[
                  "h-2.5 cursor-pointer border border-border transition-colors hover:border-primary",
                  activeIndex === index ? "w-8 bg-primary" : "w-2.5 bg-background/90",
                ].join(" ")}
                key={`home-banner-dot-${banner.id}`}
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
    </div>
  );
}

function HomeBannerSkeleton() {
  return (
    <div className="border border-border bg-background p-3">
      <Skeleton className={`${HOMEPAGE_BANNER_STANDARD.aspectClass} w-full`} />
    </div>
  );
}
