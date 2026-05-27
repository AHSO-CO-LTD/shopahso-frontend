"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { useCart } from "@/components/cart/CartProvider";
import { formatCartMoney } from "@/components/cart/cart-format";
import { setStoredCheckoutItemIds } from "@/lib/checkout/storage";
import type { Cart, CartItem, CartSummary } from "@/lib/cart/types";
import { isContactForPrice } from "@/lib/pricing-status";

export function CartSummaryPanel({
  cart,
  compact = false,
  selectedItemIds,
  selectedItems,
  selectedSummary,
  showCartLink = false,
}: {
  cart: Cart;
  compact?: boolean;
  selectedItemIds?: string[];
  selectedItems?: CartItem[];
  selectedSummary?: CartSummary;
  showCartLink?: boolean;
}) {
  const router = useRouter();
  const { clear, closeDrawer, isMutating } = useCart();
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const checkoutItemIds = selectedItemIds ?? cart.items.map((item) => item.id);
  const checkoutItems = selectedItems ?? cart.items;
  const summary = selectedSummary ?? cart.summary;
  const hasSelectedItems = checkoutItemIds.length > 0;
  const hasUnavailableItem = checkoutItems.some((item) => !item.available);
  const hasQuoteItem = checkoutItems.some((item) => isContactForPrice(item.current.pricingStatus ?? item.variant.pricingStatus));
  const totalLabel = hasSelectedItems ? formatCartMoney(summary.totalCurrentWithTax ?? summary.subtotalCurrent) : "Chưa chọn sản phẩm";

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

  async function handleConfirmClearCart() {
    await clear();
    setIsClearModalOpen(false);
  }

  return (
    <section className={`border border-border bg-background ${compact ? "p-3" : "p-4"}`}>
      <div className={compact ? "border-b border-border pb-2" : "border-b border-border pb-3"}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Tổng đã chọn
        </p>
        <p className={`${compact ? "mt-1 text-xl" : "mt-2 text-2xl"} font-black text-primary`}>{totalLabel}</p>
      </div>

      <dl className={`${compact ? "gap-1.5 py-2 text-xs" : "gap-2 py-3 text-sm"} grid border-b border-border`}>
        {!compact ? (
          <>
            <SummaryRow label="Dòng sản phẩm đã chọn" value={String(summary.itemCount)} />
            <SummaryRow label="Tổng số lượng" value={String(summary.totalQuantity)} />
            <SummaryRow label="Tạm tính khi thêm" value={formatCartMoney(summary.subtotalSnapshot)} />
          </>
        ) : null}
        <SummaryRow label="Tạm tính" value={formatCartMoney(summary.subtotalCurrent)} />
        <SummaryRow label="Thuế" value={formatCartMoney(summary.taxTotalCurrent ?? 0)} />
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold">Tổng sau thuế</dt>
          <dd className="font-black text-primary">{formatCartMoney(summary.totalCurrentWithTax ?? summary.subtotalCurrent)}</dd>
        </div>
      </dl>

      {!hasSelectedItems ? (
        <p className="mt-2 border border-border bg-muted/20 px-3 py-2 text-xs font-semibold text-muted-foreground">
          Chọn sản phẩm để tiếp tục đặt hàng.
        </p>
      ) : null}

      {summary.priceChanged ? (
        <p className="mt-2 border border-secondary bg-secondary/30 px-3 py-2 text-xs font-semibold">
          Một số sản phẩm đã thay đổi giá. Giỏ hàng đang dùng giá hiện tại.
        </p>
      ) : null}

      {hasUnavailableItem ? (
        <p className="mt-2 border border-destructive bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          Có sản phẩm không khả dụng. Vui lòng xóa hoặc cập nhật trước khi đặt hàng.
        </p>
      ) : null}

      {hasQuoteItem ? (
        <p className="mt-2 border border-secondary bg-secondary/30 px-3 py-2 text-xs font-semibold">
          Có sản phẩm cần báo giá, chưa thể checkout trực tiếp.
        </p>
      ) : null}

      <div className={`${compact ? "mt-3 grid grid-cols-3 gap-2" : "mt-4 grid gap-2"}`}>
        {showCartLink ? (
          <Link
            href="/gio-hang"
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border border-border px-3 text-sm font-semibold transition-colors duration-200 hover:border-yellow-500 hover:bg-yellow-100 hover:text-foreground"
            onClick={closeDrawer}
          >
            <ShoppingCart className="size-4" />
            Giỏ hàng
          </Link>
        ) : null}
        <button
          type="button"
          className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 border border-sky-600 bg-sky-100 px-3 text-sm font-semibold text-sky-900 transition-colors duration-200 hover:border-sky-700 hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasSelectedItems || hasUnavailableItem || hasQuoteItem}
          onClick={handleCheckout}
        >
          <CreditCard className="size-4" />
          Đặt hàng
        </button>
        <button
          type="button"
          className={`${compact ? "px-0" : "px-3"} inline-flex h-10 cursor-pointer items-center justify-center gap-2 border border-border text-sm font-semibold text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40`}
          disabled={isMutating || cart.items.length === 0}
          onClick={() => setIsClearModalOpen(true)}
          aria-label="Xóa toàn bộ giỏ hàng"
        >
          <Trash2 className="size-4" />
          {!compact ? <span>Xóa toàn bộ giỏ hàng</span> : <span className="sr-only">Xóa toàn bộ giỏ hàng</span>}
        </button>
      </div>

      <ConfirmModal
        cancelText="Giữ lại"
        confirmText="Xóa giỏ hàng"
        description="Toàn bộ sản phẩm trong giỏ hàng sẽ bị xóa. Hành động này không thể hoàn tác."
        isLoading={isMutating}
        onCancel={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearCart}
        open={isClearModalOpen}
        title="Xóa toàn bộ giỏ hàng?"
      />
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
