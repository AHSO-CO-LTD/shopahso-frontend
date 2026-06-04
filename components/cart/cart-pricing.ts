import type { CartItem } from "@/lib/cart/types";
import { getDiscountSourceLabel, getPricingDiscountPercent, toPricingNumber } from "@/lib/pricing-discount";

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
  const effectivePrice = toOptionalNumber(item.current.effectivePrice);
  const discountAmount = toPricingNumber(item.current.discountAmount);
  const salePrice = toOptionalNumber(item.current.salePrice);
  const explicitPercent = toOptionalNumber(item.current.discountPercent ?? item.snapshot.discountPercent);
  const fallbackDiscountedUnitPrice =
    price !== null && salePrice !== null && salePrice > 0 && salePrice < price
      ? salePrice
      : price !== null && explicitPercent !== null && explicitPercent > 0
        ? Math.max(price * (1 - explicitPercent / 100), 0)
        : null;
  const unitPrice = effectivePrice ?? fallbackDiscountedUnitPrice ?? toNumber(item.current.price);
  const discountPercent = getPricingDiscountPercent({
    discount: item.current.discount,
    effectivePrice: unitPrice,
    originalPrice: price,
  }) ?? explicitPercent;
  const hasDiscount =
    price !== null &&
    price > 0 &&
    unitPrice > 0 &&
    unitPrice < price &&
    ((discountAmount ?? price - unitPrice) > 0 || Boolean(item.current.discount) || Boolean(discountPercent));

  if (price === null || price <= 0) {
    return {
      discountPercent: null,
      discountSourceLabel: "",
      originalUnitPrice: null,
      unitPrice,
      isDiscounted: false,
    };
  }

  if (hasDiscount) {
    return {
      discountPercent: discountPercent === null ? Math.round(((price - unitPrice) / price) * 100) : Math.round(discountPercent),
      discountSourceLabel: getDiscountSourceLabel(item.current.discount),
      originalUnitPrice: price,
      unitPrice,
      isDiscounted: true,
    };
  }

  return {
    discountPercent: null,
    discountSourceLabel: "",
    originalUnitPrice: null,
    unitPrice,
    isDiscounted: false,
  };
}

export function getCartItemPricing(item: CartItem) {
  const discount = getCartItemDiscount(item);
  const subtotal = discount.unitPrice * item.quantity;
  const taxPercent = toNumber(item.current.tax?.percent);
  const unitTaxAmount = item.current.tax ? discount.unitPrice * (taxPercent / 100) : 0;
  const taxAmount = item.current.tax ? subtotal * (taxPercent / 100) : 0;
  const totalWithTax = item.current.tax ? subtotal + taxAmount : subtotal;

  return {
    ...discount,
    subtotal,
    unitTaxAmount,
    taxAmount,
    totalWithTax,
  };
}

export function hasCartItemUnitPriceChanged(item: CartItem) {
  const snapshotUnitPrice = toOptionalNumber(item.snapshot.effectivePrice);

  if (snapshotUnitPrice === null) {
    return false;
  }

  return Math.abs(getCartItemDiscount(item).unitPrice - snapshotUnitPrice) >= 1;
}
