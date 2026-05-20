"use client";

import { formatCartMoney } from "@/components/cart/cart-format";
import type { CheckoutPreviewSummary } from "@/lib/checkout/types";

export function CheckoutSummary({ summary }: { summary: CheckoutPreviewSummary }) {
  return (
    <section className="border border-border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Tổng thanh toán
      </p>
      <p className="mt-2 text-2xl font-black text-primary">{formatCartMoney(summary.grandTotalAmount)}</p>

      <dl className="mt-4 grid gap-2 border-t border-border pt-3 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Dòng sản phẩm</dt>
          <dd className="font-semibold">{summary.itemCount}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tổng số lượng</dt>
          <dd className="font-semibold">{summary.totalQuantity}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Tạm tính</dt>
          <dd className="font-semibold">{formatCartMoney(summary.subtotalAmount)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Thuế</dt>
          <dd className="font-semibold">{formatCartMoney(summary.taxAmount)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Phí vận chuyển</dt>
          <dd className="font-semibold">{formatCartMoney(summary.shippingFee)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Giảm giá</dt>
          <dd className="font-semibold">{formatCartMoney(summary.discountAmount)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
          <dt className="font-semibold">Cần thanh toán</dt>
          <dd className="font-black text-primary">{formatCartMoney(summary.grandTotalAmount)}</dd>
        </div>
      </dl>
    </section>
  );
}
