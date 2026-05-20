"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoredCheckoutOrder } from "@/lib/checkout/storage";
import type { CheckoutOrder } from "@/lib/checkout/types";

export function CheckoutResultPage() {
  const [order, setOrder] = useState<CheckoutOrder | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrder(getStoredCheckoutOrder());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!order) {
    return (
      <div className="border border-border bg-background p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">Không tìm thấy đơn vừa tạo</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bạn có thể dùng mã đơn và email để tra cứu lại.</p>
        <Button asChild className="mt-5 h-10 px-4">
          <Link href="/orders/lookup">Tra cứu đơn hàng</Link>
        </Button>
      </div>
    );
  }

  const lookupHref = `/orders/lookup?orderCode=${encodeURIComponent(order.orderCode)}&email=${encodeURIComponent(order.customerEmail)}`;

  return (
    <section className="mx-auto max-w-2xl border border-border bg-background p-6 text-center">
      <CheckCircle2 className="mx-auto size-12 text-green-700" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Hoàn tất</p>
      <h1 className="mt-2 text-2xl font-black tracking-tight">Đơn hàng đã được ghi nhận</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Mã đơn <strong className="font-mono text-foreground">{order.orderCode}</strong> đã được gửi vào email nhận thông tin đơn hàng.
      </p>

      <dl className="mt-6 grid gap-3 border-y border-border py-4 text-left text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Email tra cứu</dt>
          <dd className="font-semibold">{order.customerEmail}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Trạng thái đơn</dt>
          <dd className="font-semibold">{order.status}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted-foreground">Thanh toán</dt>
          <dd className="font-semibold">{order.paymentStatus}</dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button asChild className="h-10 text-sm font-semibold">
          <Link href={lookupHref}>Tra cứu đơn</Link>
        </Button>
        <Button asChild className="h-10 text-sm font-semibold" variant="outline">
          <Link href="/san-pham">Tiếp tục mua hàng</Link>
        </Button>
      </div>
    </section>
  );
}
