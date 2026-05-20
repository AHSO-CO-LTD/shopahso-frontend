"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatCartMoney } from "@/components/cart/cart-format";
import type { Cart } from "@/lib/cart/types";

export function CartSummaryPanel({ cart, showCartLink = false }: { cart: Cart; showCartLink?: boolean }) {
  const { clear, closeDrawer, isMutating } = useCart();
  const hasUnavailableItem = cart.items.some((item) => !item.available);

  return (
    <section className="border border-border bg-background p-4">
      <div className="border-b border-border pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tổng giỏ hàng</p>
        <p className="mt-2 text-2xl font-black text-primary">
          {formatCartMoney(cart.summary.totalCurrentWithTax ?? cart.summary.subtotalCurrent)}
        </p>
      </div>

      <dl className="grid gap-2 border-b border-border py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Dòng sản phẩm</dt>
          <dd className="font-semibold">{cart.summary.itemCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tổng số lượng</dt>
          <dd className="font-semibold">{cart.summary.totalQuantity}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tạm tính khi thêm</dt>
          <dd className="font-semibold">{formatCartMoney(cart.summary.subtotalSnapshot)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tạm tính hiện tại</dt>
          <dd className="font-semibold">{formatCartMoney(cart.summary.subtotalCurrent)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tiền thuế</dt>
          <dd className="font-semibold">{formatCartMoney(cart.summary.taxTotalCurrent ?? 0)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold">Tổng sau thuế</dt>
          <dd className="font-black text-primary">
            {formatCartMoney(cart.summary.totalCurrentWithTax ?? cart.summary.subtotalCurrent)}
          </dd>
        </div>
      </dl>

      {cart.summary.priceChanged ? (
        <p className="mt-3 border border-secondary bg-secondary/30 px-3 py-2 text-xs font-semibold">
          Một số sản phẩm đã thay đổi giá. Giỏ hàng đang dùng giá hiện tại.
        </p>
      ) : null}

      {hasUnavailableItem ? (
        <p className="mt-3 border border-destructive bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          Có sản phẩm không khả dụng. Vui lòng xóa hoặc cập nhật trước khi đặt hàng.
        </p>
      ) : null}

      <div className="mt-4 grid gap-2">
        {showCartLink ? (
          <Link
            href="/gio-hang"
            className="inline-flex h-10 items-center justify-center border border-border px-4 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
            onClick={closeDrawer}
          >
            Xem trang giỏ hàng
          </Link>
        ) : null}
        <Link
          href={hasUnavailableItem ? "/gio-hang" : "/checkout/preview"}
          aria-disabled={hasUnavailableItem}
          className="inline-flex h-10 items-center justify-center border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          onClick={closeDrawer}
        >
          Tiến hành đặt hàng
        </Link>
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center border border-border px-4 text-sm font-semibold text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={isMutating || cart.items.length === 0}
          onClick={() => void clear()}
        >
          Xóa toàn bộ giỏ hàng
        </button>
      </div>
    </section>
  );
}
