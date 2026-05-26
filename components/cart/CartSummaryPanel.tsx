"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";
import { formatCartMoney } from "@/components/cart/cart-format";
import { setStoredCheckoutItemIds } from "@/lib/checkout/storage";
import type { Cart, CartItem, CartSummary } from "@/lib/cart/types";
import { isContactForPrice } from "@/lib/pricing-status";

export function CartSummaryPanel({
  cart,
  selectedItemIds,
  selectedItems,
  selectedSummary,
  showCartLink = false,
}: {
  cart: Cart;
  selectedItemIds?: string[];
  selectedItems?: CartItem[];
  selectedSummary?: CartSummary;
  showCartLink?: boolean;
}) {
  const router = useRouter();
  const { clear, closeDrawer, isMutating } = useCart();
  const checkoutItemIds = selectedItemIds ?? cart.items.map((item) => item.id);
  const checkoutItems = selectedItems ?? cart.items;
  const summary = selectedSummary ?? cart.summary;
  const hasSelectedItems = checkoutItemIds.length > 0;
  const hasUnavailableItem = checkoutItems.some((item) => !item.available);
  const hasQuoteItem = checkoutItems.some((item) => isContactForPrice(item.current.pricingStatus ?? item.variant.pricingStatus));

  function handleCheckout() {
    if (!hasSelectedItems) {
      toast.warning("Vui lòng chọn ít nhất một sản phẩm để checkout.");
      return;
    }

    if (hasUnavailableItem) {
      toast.warning("Có sản phẩm đã chọn không khả dụng. Vui lòng cập nhật giỏ hàng trước khi checkout.");
      return;
    }

    if (hasQuoteItem) {
      toast.warning("Có sản phẩm cần báo giá. Vui lòng liên hệ AHSO trước khi checkout.");
      return;
    }

    setStoredCheckoutItemIds(checkoutItemIds);
    closeDrawer();
    router.push("/checkout/preview");
  }

  return (
    <section className="border border-border bg-background p-4">
      <div className="border-b border-border pb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tổng sản phẩm đã chọn</p>
        <p className="mt-2 text-2xl font-black text-primary">
          {hasSelectedItems ? formatCartMoney(summary.totalCurrentWithTax ?? summary.subtotalCurrent) : "Chưa chọn sản phẩm"}
        </p>
      </div>

      <dl className="grid gap-2 border-b border-border py-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Dòng sản phẩm đã chọn</dt>
          <dd className="font-semibold">{summary.itemCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tổng số lượng</dt>
          <dd className="font-semibold">{summary.totalQuantity}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tạm tính khi thêm</dt>
          <dd className="font-semibold">{formatCartMoney(summary.subtotalSnapshot)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tạm tính hiện tại</dt>
          <dd className="font-semibold">{formatCartMoney(summary.subtotalCurrent)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tiền thuế</dt>
          <dd className="font-semibold">{formatCartMoney(summary.taxTotalCurrent ?? 0)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold">Tổng sau thuế</dt>
          <dd className="font-black text-primary">
            {formatCartMoney(summary.totalCurrentWithTax ?? summary.subtotalCurrent)}
          </dd>
        </div>
      </dl>

      {!hasSelectedItems ? (
        <p className="mt-3 border border-border bg-muted/20 px-3 py-2 text-xs font-semibold text-muted-foreground">
          Chọn sản phẩm trong giỏ hàng để hiển thị giá và tiếp tục checkout.
        </p>
      ) : null}

      {summary.priceChanged ? (
        <p className="mt-3 border border-secondary bg-secondary/30 px-3 py-2 text-xs font-semibold">
          Một số sản phẩm đã chọn đã thay đổi giá. Giỏ hàng đang dùng giá hiện tại.
        </p>
      ) : null}

      {hasUnavailableItem ? (
        <p className="mt-3 border border-destructive bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          Có sản phẩm đã chọn không khả dụng. Vui lòng xóa hoặc cập nhật trước khi đặt hàng.
        </p>
      ) : null}

      {hasQuoteItem ? (
        <p className="mt-3 border border-secondary bg-secondary/30 px-3 py-2 text-xs font-semibold">
          Có sản phẩm cần báo giá trong lựa chọn hiện tại. Các sản phẩm này chưa thể checkout trực tiếp.
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
        <button
          type="button"
          className="inline-flex h-10 cursor-pointer items-center justify-center border border-primary bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasSelectedItems || hasUnavailableItem || hasQuoteItem}
          onClick={handleCheckout}
        >
          Tiến hành đặt hàng
        </button>
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
