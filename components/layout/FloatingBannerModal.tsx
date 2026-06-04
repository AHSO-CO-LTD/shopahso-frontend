"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { gsap } from "gsap";
import { toast } from "sonner";
import { listPublicBanners } from "@/lib/api/services/banners.service";
import type { Banner } from "@/lib/banner/types";

const FLOATING_BANNER_DISMISSED_DATE_KEY = "shopahso:floating-banner-dismissed-date";

function getTodayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function FloatingBannerModal() {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const banner = useMemo(
    () => banners.filter((item) => item.imageUrl).sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null,
    [banners],
  );

  const dismissForToday = useCallback(() => {
    try {
      window.localStorage.setItem(FLOATING_BANNER_DISMISSED_DATE_KEY, getTodayKey());
    } catch {
      // Storage can be unavailable in strict privacy modes.
    }

    setIsOpen(false);
  }, []);

  const closeBanner = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(FLOATING_BANNER_DISMISSED_DATE_KEY) === getTodayKey()) {
        return;
      }
    } catch {
      return;
    }

    let cancelled = false;

    async function loadFloatingBanner() {
      try {
        const response = await listPublicBanners("FLOATING");
        if (cancelled) {
          return;
        }

        setBanners(response);
        if (response.some((item) => item.imageUrl)) {
          setIsOpen(true);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Không thể tải floating banner.");
        }
      }
    }

    void loadFloatingBanner();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeBanner();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeBanner, isOpen]);

  useEffect(() => {
    const panel = panelRef.current;

    if (!isOpen || !panel) {
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        panel,
        { opacity: 0, y: reducedMotion ? 0 : 24, scale: reducedMotion ? 1 : 0.98 },
        { duration: reducedMotion ? 0 : 0.32, ease: "expo.out", opacity: 1, scale: 1, y: 0 },
      );
    }, panel);

    return () => ctx.revert();
  }, [isOpen]);

  if (typeof document === "undefined" || !isOpen || !banner?.imageUrl) {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/45 px-4"
      role="dialog"
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-[448px] border border-background/80 bg-background shadow-[0_24px_80px_rgba(15,23,42,0.34)]"
      >
        <button
          aria-label="Tắt floating banner"
          className="absolute right-2 top-2 z-10 inline-flex size-8 cursor-pointer items-center justify-center border border-red-800 bg-red-600 text-white shadow-[0_8px_24px_rgba(127,29,29,0.38)] transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
          onClick={closeBanner}
          type="button"
        >
          <X className="size-4" />
        </button>

        <Link
          aria-label="Mở floating banner"
          className="block cursor-pointer overflow-hidden bg-muted/30 transition-opacity hover:opacity-95"
          href={banner.linkUrl || "/khuyen-mai"}
          onClick={closeBanner}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Floating banner ShopAHSO"
            className="aspect-[16/9] w-full object-contain"
            src={banner.imageUrl}
          />
        </Link>

        <button
          className="absolute bottom-2 left-2 z-10 cursor-pointer border border-border bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-[0_8px_24px_rgba(15,23,42,0.18)] transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          onClick={dismissForToday}
          type="button"
        >
          Không nhắc lại hôm nay
        </button>
      </div>
    </div>,
    document.body,
  );
}
