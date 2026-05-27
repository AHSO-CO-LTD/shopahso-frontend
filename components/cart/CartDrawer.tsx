"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { X } from "lucide-react";
import { CartContent } from "@/components/cart/CartContent";
import { useCart } from "@/components/cart/CartProvider";

export function CartDrawer() {
  const { cart, closeDrawer, isDrawerOpen } = useCart();
  const overlayRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const drawer = drawerRef.current;

    if (!overlay || !drawer) {
      return;
    }

    gsap.set(overlay, { autoAlpha: 0 });
    gsap.set(drawer, { x: "100%" });
  }, []);

  useEffect(() => {
    const overlay = overlayRef.current;
    const drawer = drawerRef.current;

    if (!overlay || !drawer) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.killTweensOf([overlay, drawer]);

    if (isDrawerOpen) {
      gsap.to(overlay, { autoAlpha: 1, duration: reduceMotion ? 0 : 0.22, ease: "power2.out" });
      gsap.to(drawer, { x: "0%", duration: reduceMotion ? 0 : 0.42, ease: "expo.out" });
      return;
    }

    gsap.to(overlay, { autoAlpha: 0, duration: reduceMotion ? 0 : 0.2, ease: "power2.in" });
    gsap.to(drawer, {
      x: "100%",
      duration: reduceMotion ? 0 : 0.34,
      ease: "power3.in",
    });
  }, [isDrawerOpen]);

  return (
    <div
      aria-hidden={!isDrawerOpen}
      aria-label="Giỏ hàng"
      aria-modal="true"
      className={`fixed inset-0 z-[80] ${isDrawerOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      role="dialog"
    >
      <button
        ref={overlayRef}
        type="button"
        className="absolute inset-0 cursor-default bg-foreground/35"
        onClick={closeDrawer}
        aria-label="Đóng giỏ hàng"
      />
      <aside
        ref={drawerRef}
        style={{ transform: "translate3d(100%, 0, 0)" }}
        className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-border bg-background"
      >
        <header className="flex h-16 items-center justify-between border-b border-border px-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Giỏ hàng</p>
            <h2 className="text-lg font-black tracking-tight">
              {cart ? `${cart.summary.itemCount} dòng sản phẩm` : "Đang tải"}
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex size-9 cursor-pointer items-center justify-center border border-border transition-colors hover:border-primary hover:text-primary"
            onClick={closeDrawer}
            aria-label="Đóng giỏ hàng"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 p-3">
          <CartContent compact />
        </div>
      </aside>
    </div>
  );
}
