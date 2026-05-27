"use client";

import type { MouseEvent } from "react";
import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";
import { isContactForPrice, type PricingStatus } from "@/lib/pricing-status";

export function AddToCartButton({
  active,
  appearance = "default",
  className = "",
  iconOnly = false,
  label = "Thêm vào giỏ hàng",
  pricingStatus,
  stockQuantity,
  variantId,
}: {
  active: boolean;
  appearance?: "default" | "attention";
  className?: string;
  iconOnly?: boolean;
  label?: string;
  pricingStatus?: PricingStatus;
  stockQuantity: number;
  variantId: string;
}) {
  const { addItem, cart, isMutating } = useCart();
  const currentCartItem = cart?.items.find((item) => item.variantId === variantId);
  const requiresQuote = isContactForPrice(pricingStatus);
  const isAtMaxQuantity = Boolean(currentCartItem && currentCartItem.quantity >= stockQuantity);
  const isDisabled = isMutating || !active || (!requiresQuote && stockQuantity <= 0);
  const buttonLabel = requiresQuote ? "Liên hệ báo giá" : stockQuantity <= 0 ? "Hết hàng" : isAtMaxQuantity ? "Đã tối đa" : label;
  const buttonToneClass = requiresQuote
    ? "border-yellow-500 bg-yellow-400 text-foreground hover:bg-yellow-500"
    : appearance === "attention"
      ? "border-red-700 bg-red-600 text-primary-foreground hover:-translate-y-1 hover:border-yellow-500 hover:bg-yellow-400 hover:text-foreground"
      : "border-primary bg-primary text-primary-foreground hover:bg-primary/90";

  function handleAddToCart(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

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
      className={`inline-flex cursor-pointer items-center justify-center gap-2 border ${iconOnly ? "p-0" : "px-3"} text-sm font-semibold transition-[background-color,border-color,color,transform] duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${buttonToneClass} ${className}`}
      disabled={isDisabled}
      onClick={handleAddToCart}
    >
      <ShoppingCart className="size-4" />
      {iconOnly ? <span className="sr-only">{buttonLabel}</span> : buttonLabel}
    </button>
  );
}
