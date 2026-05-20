"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import { formatCartMoney } from "@/components/cart/cart-format";
import {
  getFulfillmentStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/components/orders/order-display";
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
      toast.warning("Vui lÃ²ng nháº­p mÃ£ Ä‘Æ¡n vÃ  email.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await lookupPublicOrder({ orderCode: orderCode.trim(), email: email.trim() });
      setOrder(response);
      toast.success("ÄÃ£ táº£i thÃ´ng tin Ä‘Æ¡n hÃ ng.");
    } catch (error) {
      setOrder(null);
      toast.error(error instanceof Error ? error.message : "KhÃ´ng thá»ƒ tra cá»©u Ä‘Æ¡n hÃ ng.");
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
    const loadingToastId = toast.loading("Äang xÃ¡c nháº­n Ä‘Ã£ chuyá»ƒn khoáº£n...");
    try {
      const response = await confirmPublicOrderPayment({ orderCode: order.orderCode, email: order.customerEmail });
      setOrder(response);
      toast.success("ÄÃ£ gá»­i xÃ¡c nháº­n thanh toÃ¡n.", { id: loadingToastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "KhÃ´ng thá»ƒ xÃ¡c nháº­n thanh toÃ¡n.", { id: loadingToastId });
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <form className="h-fit space-y-4 border border-border bg-background p-4" onSubmit={handleSubmit}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tra cá»©u cÃ´ng khai</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Tra cá»©u Ä‘Æ¡n hÃ ng</h1>
          <p className="mt-2 text-sm text-muted-foreground">DÃ¹ng mÃ£ Ä‘Æ¡n vÃ  email nháº­n thÃ´ng tin Ä‘Æ¡n hÃ ng.</p>
        </div>
        <label className="grid gap-2 text-sm">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">MÃ£ Ä‘Æ¡n</span>
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
          Tra cá»©u
        </Button>
      </form>

      <section className="border border-border bg-background p-4">
        {order ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <h2 className="text-xl font-black tracking-tight">ÄÆ¡n {order.orderCode}</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Info label="Email" value={order.customerEmail} />
                <Info label="Tá»•ng tiá»n" value={formatCartMoney(order.grandTotalAmount)} strong />
                <Info label="Trạng thái đơn" value={getOrderStatusLabel(order.status)} />
                <Info label="Thanh toán" value={getPaymentStatusLabel(order.paymentStatus)} />
                <Info label="Giao hàng" value={getFulfillmentStatusLabel(order.fulfillmentStatus)} />
                <Info label="Ná»™i dung CK" value={order.paymentTransferContent ?? ""} mono />
              </dl>
              <Button
                className="mt-5 h-10 px-4 text-sm font-semibold"
                disabled={isConfirming}
                onClick={() => void confirmPayment()}
                type="button"
                variant="outline"
              >
                <CheckCircle2 className="size-4" />
                TÃ´i Ä‘Ã£ chuyá»ƒn khoáº£n
              </Button>
            </div>
            {order.paymentQrUrl ? (
              <Image
                alt={`QR thanh toÃ¡n Ä‘Æ¡n ${order.orderCode}`}
                className="h-auto w-full border border-border"
                height={280}
                src={order.paymentQrUrl}
                width={280}
              />
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-72 items-center justify-center text-center text-sm text-muted-foreground">
            Nháº­p mÃ£ Ä‘Æ¡n vÃ  email Ä‘á»ƒ xem thÃ´ng tin Ä‘Æ¡n hÃ ng.
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
        {value || "ChÆ°a cÃ³ dá»¯ liá»‡u"}
      </dd>
    </div>
  );
}
