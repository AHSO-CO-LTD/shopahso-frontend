"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { Button } from "@/components/ui/button";
import { previewCheckout } from "@/lib/api/services/checkout.service";
import type { CheckoutPreview } from "@/lib/checkout/types";
import { getStoredCheckoutItemIds, setStoredCheckoutItemIds, setStoredCheckoutPreview } from "@/lib/checkout/storage";

export function CheckoutPreviewPage() {
  const router = useRouter();
  const { cart, isLoading: isCartLoading } = useCart();
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const cartItemIds = useMemo(() => {
    if (!cart) {
      return [];
    }

    const currentCartItemIds = new Set(cart.items.map((item) => item.id));
    return getStoredCheckoutItemIds().filter((itemId) => currentCartItemIds.has(itemId));
  }, [cart]);
  const selectedCartItems = useMemo(() => {
    if (!cart) {
      return [];
    }

    return cart.items.filter((item) => cartItemIds.includes(item.id));
  }, [cart, cartItemIds]);
  const selectedCartQuantitySignature = useMemo(
    () => selectedCartItems.map((item) => `${item.id}:${item.quantity}`).join("|"),
    [selectedCartItems],
  );

  async function loadPreview() {
    if (cartItemIds.length === 0) {
      setPreview(null);
      return;
    }

    setIsLoadingPreview(true);
    try {
      const response = await previewCheckout(cartItemIds);
      setPreview(response);
      setStoredCheckoutItemIds(cartItemIds);
      setStoredCheckoutPreview(response);

      if (!response.canCheckout) {
        toast.warning("Có sản phẩm cần kiểm tra trước khi đặt hàng.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tạo bản xem trước đơn hàng.");
    } finally {
      setIsLoadingPreview(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPreview();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCartQuantitySignature]);

  if (isCartLoading && !cart) {
    return <div className="border border-border p-5 text-sm text-muted-foreground">Đang tải giỏ hàng...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="border border-border bg-background p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">Giỏ hàng đang trống</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bạn cần thêm sản phẩm trước khi checkout.</p>
        <Button asChild className="mt-5 h-10 px-4">
          <Link href="/san-pham">Xem sản phẩm</Link>
        </Button>
      </div>
    );
  }

  if (cartItemIds.length === 0) {
    return (
      <div className="border border-border bg-background p-8 text-center">
        <h1 className="text-2xl font-black tracking-tight">Chưa chọn sản phẩm checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">Vui lòng quay lại giỏ hàng và chọn sản phẩm cần đặt.</p>
        <Button asChild className="mt-5 h-10 px-4">
          <Link href="/gio-hang">Quay lại giỏ hàng</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="border border-border bg-background p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Bước 1</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Xem lại sản phẩm</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Hệ thống sẽ kiểm tra tồn kho, min order, trạng thái sản phẩm và thay đổi giá trước khi đặt hàng.
          </p>
        </div>

        {preview?.issues && preview.issues.length > 0 ? (
          <div className="border border-secondary bg-secondary/30 p-4 text-sm">
            <div className="flex items-start gap-2 font-semibold">
              <AlertTriangle className="mt-0.5 size-4" />
              Có vấn đề cần xử lý
            </div>
            <ul className="mt-2 grid gap-1 text-muted-foreground">
              {preview.issues.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>
                  {issue.message ?? issue.code}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-3">
          {selectedCartItems.map((item) => (
            <CartLineItem key={item.id} item={item} />
          ))}
        </div>
      </section>

      <aside className="space-y-3">
        {preview ? <CheckoutSummary summary={preview.summary} /> : null}
        <Button
          className="h-11 w-full text-sm font-semibold"
          disabled={!preview?.canCheckout || isLoadingPreview}
          onClick={() => router.push("/checkout/shipping")}
          type="button"
        >
          Tiếp tục giao hàng
          <ArrowRight className="size-4" />
        </Button>
        <Button
          className="h-10 w-full text-sm font-semibold"
          disabled={isLoadingPreview}
          onClick={() => void loadPreview()}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          Kiểm tra lại
        </Button>
      </aside>
    </div>
  );
}
