"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { CartContent } from "@/components/cart/CartContent";
import { useCart } from "@/components/cart/CartProvider";

export function CartDrawer() {
  const { cart, closeDrawer, isDrawerOpen } = useCart();

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-foreground/35"
        onClick={closeDrawer}
        aria-label="Đóng giỏ hàng"
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-border bg-background">
        <header className="flex h-16 items-center justify-between border-b border-border px-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Giỏ hàng</p>
            <h2 className="text-lg font-black tracking-tight">
              {cart ? `${cart.summary.itemCount} dòng sản phẩm` : "Đang tải"}
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center border border-border transition-colors hover:border-primary hover:text-primary"
            onClick={closeDrawer}
            aria-label="Đóng giỏ hàng"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          <CartContent compact />
        </div>

        <footer className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <Link href="/gio-hang" className="font-semibold text-primary hover:underline" onClick={closeDrawer}>
            Mở trang giỏ hàng
          </Link>
        </footer>
      </aside>
    </div>
  );
}
