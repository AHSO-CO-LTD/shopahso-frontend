"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Copy, Search } from "lucide-react";
import { toast } from "sonner";
import { formatCartMoney } from "@/components/cart/cart-format";
import { getPaymentStatusLabel } from "@/components/orders/order-display";
import { Button } from "@/components/ui/button";
import {
  confirmMyOrderPayment,
  confirmPublicOrderPayment,
} from "@/lib/api/services/checkout.service";
import { getStoredCheckoutOrder, setStoredCheckoutOrder } from "@/lib/checkout/storage";
import type { CheckoutOrder } from "@/lib/checkout/types";

export function CheckoutPaymentPage() {
  const router = useRouter();
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setOrder(getStoredCheckoutOrder());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function copyText(value: string | null | undefined, label: string) {
    if (!value) {
      toast.warning(`Không có ${label} để sao chép.`);
      return;
    }

    await navigator.clipboard.writeText(value);
    toast.success(`Đã sao chép ${label}.`);
  }

  async function confirmPayment() {
    if (!order) {
      return;
    }

    setIsConfirming(true);
    const loadingToastId = toast.loading("Đang xác nhận đã chuyển khoản...");

    try {
      const nextOrder = order.userId
        ? await confirmMyOrderPayment(order.id)
        : await confirmPublicOrderPayment({ orderCode: order.orderCode, email: order.customerEmail });
      setStoredCheckoutOrder(nextOrder);
      setOrder(nextOrder);
      toast.success("Đã gửi xác nhận thanh toán. Shop sẽ kiểm tra và phản hồi sớm.", { id: loadingToastId });
      router.push("/checkout/result");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xác nhận thanh toán.", {
        id: loadingToastId,
      });
    } finally {
      setIsConfirming(false);
    }
  }

  if (!order) {
    return (
      <div className="border border-border bg-background p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">Chưa có đơn thanh toán</h1>
        <p className="mt-2 text-sm text-muted-foreground">Vui lòng tạo đơn hàng trước khi thanh toán.</p>
        <Button className="mt-5 h-10 px-4" onClick={() => router.push("/gio-hang")} type="button">
          Về giỏ hàng
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4">
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bước 3</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Thanh toán chuyển khoản</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Chuyển khoản đúng số tiền và nội dung để backoffice đối soát nhanh.
          </p>
        </div>

        <section className="grid gap-4 border border-border bg-background p-4 md:grid-cols-2">
          <Info label="Mã đơn" value={order.orderCode} />
          <Info label="Trạng thái thanh toán" value={getPaymentStatusLabel(order.paymentStatus)} />
          <Info label="Ngân hàng" value={order.paymentBankName ?? "VIETQR"} />
          <Info label="Số tài khoản" value={order.paymentBankAccountNumber ?? ""} mono />
          <Info label="Chủ tài khoản" value={order.paymentBankAccountName ?? ""} />
          <Info label="Số tiền" value={formatCartMoney(order.grandTotalAmount)} strong />
          <div className="md:col-span-2">
            <Info label="Nội dung chuyển khoản" value={order.paymentTransferContent ?? ""} mono strong />
          </div>
        </section>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="h-10 text-sm font-semibold"
            onClick={() => void copyText(order.paymentTransferContent, "nội dung chuyển khoản")}
            type="button"
            variant="outline"
          >
            <Copy className="size-4" />
            Sao chép nội dung
          </Button>
          <Button
            className="h-10 text-sm font-semibold"
            onClick={() => void copyText(order.paymentBankAccountNumber, "số tài khoản")}
            type="button"
            variant="outline"
          >
            <Copy className="size-4" />
            Sao chép số tài khoản
          </Button>
        </div>
      </section>

      <aside className="space-y-3">
        <section className="border border-border bg-background p-4">
          {order.paymentQrUrl ? (
            <Image
              alt={`QR thanh toán đơn ${order.orderCode}`}
              className="h-auto w-full border border-border"
              height={360}
              src={order.paymentQrUrl}
              width={360}
            />
          ) : (
            <div className="flex min-h-72 items-center justify-center border border-border text-center text-sm text-muted-foreground">
              Đơn hàng chưa có QR thanh toán.
            </div>
          )}
        </section>
        <Button className="h-11 w-full text-sm font-semibold" disabled={isConfirming} onClick={() => void confirmPayment()} type="button">
          <CheckCircle2 className="size-4" />
          Tôi đã chuyển khoản
        </Button>
        <Button className="h-10 w-full text-sm font-semibold" onClick={() => router.push("/orders/lookup")} type="button" variant="outline">
          <Search className="size-4" />
          Tra cứu đơn hàng
        </Button>
      </aside>
    </div>
  );
}

function Info({ label, value, mono = false, strong = false }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</p>
      <p className={`mt-1 break-words ${mono ? "font-mono" : ""} ${strong ? "text-lg font-black text-primary" : "font-semibold"}`}>
        {value || "Chưa có dữ liệu"}
      </p>
    </div>
  );
}
