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
      toast.warning(`KhÃ´ng cÃ³ ${label} Ä‘á»ƒ sao chÃ©p.`);
      return;
    }

    await navigator.clipboard.writeText(value);
    toast.success(`ÄÃ£ sao chÃ©p ${label}.`);
  }

  async function confirmPayment() {
    if (!order) {
      return;
    }

    setIsConfirming(true);
    const loadingToastId = toast.loading("Äang xÃ¡c nháº­n Ä‘Ã£ chuyá»ƒn khoáº£n...");

    try {
      const nextOrder = order.userId
        ? await confirmMyOrderPayment(order.id)
        : await confirmPublicOrderPayment({ orderCode: order.orderCode, email: order.customerEmail });
      setStoredCheckoutOrder(nextOrder);
      setOrder(nextOrder);
      toast.success("ÄÃ£ gá»­i xÃ¡c nháº­n thanh toÃ¡n.", { id: loadingToastId });
      router.push("/checkout/result");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "KhÃ´ng thá»ƒ xÃ¡c nháº­n thanh toÃ¡n.", {
        id: loadingToastId,
      });
    } finally {
      setIsConfirming(false);
    }
  }

  if (!order) {
    return (
      <div className="border border-border bg-background p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">ChÆ°a cÃ³ Ä‘Æ¡n thanh toÃ¡n</h1>
        <p className="mt-2 text-sm text-muted-foreground">Vui lÃ²ng táº¡o Ä‘Æ¡n hÃ ng trÆ°á»›c khi thanh toÃ¡n.</p>
        <Button className="mt-5 h-10 px-4" onClick={() => router.push("/gio-hang")} type="button">
          Vá» giá» hÃ ng
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4">
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">BÆ°á»›c 3</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Thanh toÃ¡n chuyá»ƒn khoáº£n</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Chuyá»ƒn khoáº£n Ä‘Ãºng sá»‘ tiá»n vÃ  ná»™i dung Ä‘á»ƒ backoffice Ä‘á»‘i soÃ¡t nhanh.
          </p>
        </div>

        <section className="grid gap-4 border border-border bg-background p-4 md:grid-cols-2">
          <Info label="MÃ£ Ä‘Æ¡n" value={order.orderCode} />
          <Info label="Trạng thái thanh toán" value={getPaymentStatusLabel(order.paymentStatus)} />
          <Info label="NgÃ¢n hÃ ng" value={order.paymentBankName ?? "VIETQR"} />
          <Info label="Sá»‘ tÃ i khoáº£n" value={order.paymentBankAccountNumber ?? ""} mono />
          <Info label="Chá»§ tÃ i khoáº£n" value={order.paymentBankAccountName ?? ""} />
          <Info label="Sá»‘ tiá»n" value={formatCartMoney(order.grandTotalAmount)} strong />
          <div className="md:col-span-2">
            <Info label="Ná»™i dung chuyá»ƒn khoáº£n" value={order.paymentTransferContent ?? ""} mono strong />
          </div>
        </section>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            className="h-10 text-sm font-semibold"
            onClick={() => void copyText(order.paymentTransferContent, "ná»™i dung chuyá»ƒn khoáº£n")}
            type="button"
            variant="outline"
          >
            <Copy className="size-4" />
            Sao chÃ©p ná»™i dung
          </Button>
          <Button
            className="h-10 text-sm font-semibold"
            onClick={() => void copyText(order.paymentBankAccountNumber, "sá»‘ tÃ i khoáº£n")}
            type="button"
            variant="outline"
          >
            <Copy className="size-4" />
            Sao chÃ©p sá»‘ tÃ i khoáº£n
          </Button>
        </div>
      </section>

      <aside className="space-y-3">
        <section className="border border-border bg-background p-4">
          {order.paymentQrUrl ? (
            <Image
              alt={`QR thanh toÃ¡n Ä‘Æ¡n ${order.orderCode}`}
              className="h-auto w-full border border-border"
              height={360}
              src={order.paymentQrUrl}
              width={360}
            />
          ) : (
            <div className="flex min-h-72 items-center justify-center border border-border text-center text-sm text-muted-foreground">
              ÄÆ¡n hÃ ng chÆ°a cÃ³ QR thanh toÃ¡n.
            </div>
          )}
        </section>
        <Button className="h-11 w-full text-sm font-semibold" disabled={isConfirming} onClick={() => void confirmPayment()} type="button">
          <CheckCircle2 className="size-4" />
          TÃ´i Ä‘Ã£ chuyá»ƒn khoáº£n
        </Button>
        <Button className="h-10 w-full text-sm font-semibold" onClick={() => router.push("/orders/lookup")} type="button" variant="outline">
          <Search className="size-4" />
          Tra cá»©u Ä‘Æ¡n hÃ ng
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
        {value || "ChÆ°a cÃ³ dá»¯ liá»‡u"}
      </p>
    </div>
  );
}
