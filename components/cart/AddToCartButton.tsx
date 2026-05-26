"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";
import { isContactForPrice, type PricingStatus } from "@/lib/pricing-status";

export function AddToCartButton({
  active,
  className = "",
  label = "Thêm vào giỏ hàng",
  pricingStatus,
  stockQuantity,
  variantId,
}: {
  active: boolean;
  className?: string;
  label?: string;
  pricingStatus?: PricingStatus;
  stockQuantity: number;
  variantId: string;
}) {
  const { addItem, cart, isMutating } = useCart();
  const currentCartItem = cart?.items.find((item) => item.variantId === variantId);
  const requiresQuote = isContactForPrice(pricingStatus);
  const isAtMaxQuantity = Boolean(currentCartItem && currentCartItem.quantity >= stockQuantity);
  const isDisabled = isMutating || !active || stockQuantity <= 0;

  function handleAddToCart() {
    if (requiresQuote) {
      toast.info("Sản phẩm này cần báo giá riêng. Vui lòng liên hệ AHSO để được tư vấn.");
      return;
    }

    if (isAtMaxQuantity) {
      toast.warning("Không thể thêm, bạn đã đạt số lượng tối đa của sản phẩm này.");
      return;
    }

    void addItem(variantId);
  }

  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-2 border px-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        requiresQuote
          ? "border-yellow-500 bg-yellow-400 text-foreground hover:bg-yellow-500"
          : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
      } ${className}`}
      disabled={isDisabled}
      onClick={handleAddToCart}
    >
      <ShoppingCart className="size-4" />
      {stockQuantity <= 0 ? "Hết hàng" : requiresQuote ? "Liên hệ báo giá" : isAtMaxQuantity ? "Đã tối đa" : label}
    </button>
  );
}
