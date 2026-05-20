"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { formatCartMoney } from "@/components/cart/cart-format";
import { Button } from "@/components/ui/button";
import { confirmPublicOrderPayment, lookupPublicOrder } from "@/lib/api/services/checkout.service";
import type { CheckoutOrder } from "@/lib/checkout/types";

export function OrderLookupPage() {
  const searchParams = useSearchParams();
  const [orderCode, setOrderCode] = useState(searchParams.get("orderCode") ?? "");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  async function lookup() {
    if (!orderCode.trim() || !email.trim()) {
      toast.warning("Vui lòng nhập mã đơn và email.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await lookupPublicOrder({ orderCode: orderCode.trim(), email: email.trim() });
      setOrder(response);
      toast.success("Đã tải thông tin đơn hàng.");
    } catch (error) {
      setOrder(null);
      toast.error(error instanceof Error ? error.message : "Không thể tra cứu đơn hàng.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (orderCode && email) {
      const timeoutId = window.setTimeout(() => {
        void lookup();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookup();
  }

  async function confirmPayment() {
    if (!order) {
      return;
    }

    setIsConfirming(true);
    const loadingToastId = toast.loading("Đang xác nhận đã chuyển khoản...");
    try {
      const response = await confirmPublicOrderPayment({ orderCode: order.orderCode, email: order.customerEmail });
      setOrder(response);
      toast.success("Đã gửi xác nhận thanh toán.", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xác nhận thanh toán.", { id: loadingToastId });
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <form className="h-fit space-y-4 border border-border bg-background p-4" onSubmit={handleSubmit}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tra cứu công khai</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Tra cứu đơn hàng</h1>
          <p className="mt-2 text-sm text-muted-foreground">Dùng mã đơn và email nhận thông tin đơn hàng.</p>
        </div>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Mã đơn</span>
          <input
            className="h-11 border border-border bg-background px-3 font-mono outline-none focus:border-primary"
            value={orderCode}
            onChange={(event) => setOrderCode(event.target.value)}
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Email</span>
          <input
            className="h-11 border border-border bg-background px-3 outline-none focus:border-primary"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <Button className="h-11 w-full text-sm font-semibold" disabled={isLoading} type="submit">
          <Search className="size-4" />
          Tra cứu
        </Button>
      </form>

      <section className="border border-border bg-background p-4">
        {order ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <h2 className="text-xl font-black tracking-tight">Đơn {order.orderCode}</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Email" value={order.customerEmail} />
                <Info label="Tổng tiền" value={formatCartMoney(order.grandTotalAmount)} strong />
                <Info label="Trạng thái đơn" value={order.status} />
                <Info label="Thanh toán" value={order.paymentStatus} />
                <Info label="Giao hàng" value={order.fulfillmentStatus} />
                <Info label="Nội dung CK" value={order.paymentTransferContent ?? ""} mono />
              </dl>
              <Button
                className="mt-5 h-10 px-4 text-sm font-semibold"
                disabled={isConfirming}
                onClick={() => void confirmPayment()}
                type="button"
                variant="outline"
              >
                <CheckCircle2 className="size-4" />
                Tôi đã chuyển khoản
              </Button>
            </div>
            {order.paymentQrUrl ? (
              <Image
                alt={`QR thanh toán đơn ${order.orderCode}`}
                className="h-auto w-full border border-border"
                height={280}
                src={order.paymentQrUrl}
                width={280}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-72 items-center justify-center text-center text-sm text-muted-foreground">
            Nhập mã đơn và email để xem thông tin đơn hàng.
          </div>
        )}
      </section>
    </div>
  );
}

function Info({ label, value, mono = false, strong = false }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
      <dd className={`mt-1 break-words ${mono ? "font-mono" : ""} ${strong ? "font-black text-primary" : "font-semibold"}`}>
        {value || "Chưa có dữ liệu"}
      </dd>
    </div>
  );
}
