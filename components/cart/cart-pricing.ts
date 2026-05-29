import type { CartItem } from "@/lib/cart/types";

function toNumber(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toOptionalNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function getCartItemDiscount(item: CartItem) {
  const price = toOptionalNumber(item.current.price);
  const salePrice = toOptionalNumber(item.current.salePrice);
  const explicitPercent = toOptionalNumber(item.current.discountPercent ?? item.snapshot.discountPercent);

  if (price === null || price <= 0) {
    return {
      discountPercent: null,
      originalUnitPrice: null,
      unitPrice: toNumber(item.current.effectivePrice),
      isDiscounted: false,
    };
  }

  if (salePrice !== null && salePrice > 0 && salePrice < price) {
    return {
      discountPercent: Math.round(((price - salePrice) / price) * 100),
      originalUnitPrice: price,
      unitPrice: salePrice,
      isDiscounted: true,
    };
  }

  if (explicitPercent !== null && explicitPercent > 0) {
    const unitPrice = Math.max(price * (1 - explicitPercent / 100), 0);

    return {
      discountPercent: Math.round(explicitPercent),
      originalUnitPrice: price,
      unitPrice,
      isDiscounted: unitPrice < price,
    };
  }

  return {
    discountPercent: null,
    originalUnitPrice: null,
    unitPrice: toNumber(item.current.effectivePrice),
    isDiscounted: false,
  };
}

export function getCartItemPricing(item: CartItem) {
  const discount = getCartItemDiscount(item);
  const subtotal = discount.unitPrice * item.quantity;
  const taxPercent = toNumber(item.current.tax?.percent);
  const taxAmount = item.current.tax ? subtotal * (taxPercent / 100) : 0;
  const totalWithTax = item.current.tax ? subtotal + taxAmount : subtotal;

  return {
    ...discount,
    subtotal,
    taxAmount,
    totalWithTax,
  };
}
