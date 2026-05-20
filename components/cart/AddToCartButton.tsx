"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/components/cart/CartProvider";

export function AddToCartButton({
  active,
  className = "",
  label = "Thêm vào giỏ hàng",
  stockQuantity,
  variantId,
}: {
  active: boolean;
  className?: string;
  label?: string;
  stockQuantity: number;
  variantId: string;
}) {
  const { addItem, cart, isMutating } = useCart();
  const currentCartItem = cart?.items.find((item) => item.variantId === variantId);
  const isAtMaxQuantity = Boolean(currentCartItem && currentCartItem.quantity >= stockQuantity);
  const isDisabled = isMutating || !active || stockQuantity <= 0;

  function handleAddToCart() {
    if (isAtMaxQuantity) {
      toast.warning("Không thể thêm, bạn đã đạt số lượng tối đa của sản phẩm này.");
      return;
    }

    void addItem(variantId);
  }

  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-2 border border-primary bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      disabled={isDisabled}
      onClick={handleAddToCart}
    >
      <ShoppingCart className="size-4" />
      {stockQuantity <= 0 ? "Hết hàng" : isAtMaxQuantity ? "Đã tối đa" : label}
    </button>
  );
}
