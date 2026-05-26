import type { Cart, CartItem, CartSummary } from "@/lib/cart/types";
import { isContactForPrice } from "@/lib/pricing-status";

function toNumber(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function getAvailableCartItemIds(cart: Cart) {
  return cart.items
    .filter((item) => item.available && !isContactForPrice(item.current.pricingStatus ?? item.variant.pricingStatus))
    .map((item) => item.id);
}

export function getSelectedCartItems(cart: Cart, selectedItemIds: string[]) {
  const selectedIdSet = new Set(selectedItemIds);
  return cart.items.filter((item) => selectedIdSet.has(item.id));
}

export function buildCartSummaryFromItems(items: CartItem[]): CartSummary {
  return items.reduce<CartSummary>(
    (summary, item) => {
      summary.itemCount += 1;
      summary.totalQuantity += item.quantity;
      summary.subtotalSnapshot = String(toNumber(summary.subtotalSnapshot) + toNumber(item.snapshot.subtotal));
      summary.subtotalCurrent = String(toNumber(summary.subtotalCurrent) + toNumber(item.current.subtotal));
      summary.taxTotalCurrent = String(toNumber(summary.taxTotalCurrent) + toNumber(item.current.tax?.amount));
      summary.totalCurrentWithTax = String(
        toNumber(summary.totalCurrentWithTax) + toNumber(item.current.totalWithTax ?? item.current.subtotal),
      );
      summary.priceChanged = summary.priceChanged || item.priceChanged;
      return summary;
    },
    {
      itemCount: 0,
      totalQuantity: 0,
      subtotalSnapshot: "0",
      subtotalCurrent: "0",
      taxTotalCurrent: "0",
      totalCurrentWithTax: "0",
      priceChanged: false,
    },
  );
}
