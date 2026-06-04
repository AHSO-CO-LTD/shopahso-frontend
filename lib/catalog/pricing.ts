import type { CatalogVariantPricing, CatalogVariantTax } from "@/lib/catalog/types";
import {
  getDiscountSourceLabel,
  getPricingDiscountBadge,
  getPricingDiscountPercent,
  toPricingNumber,
} from "@/lib/pricing-discount";

export function formatCatalogMoney(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return "0 đ";
  }

  return numericValue.toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  }) + " đ";
}

export function getCatalogPricingDisplay({
  fallbackPrice,
  regularPrice,
  pricing,
  tax,
}: {
  fallbackPrice: string | number | null | undefined;
  regularPrice?: string | number | null | undefined;
  pricing?: CatalogVariantPricing | null;
  tax?: CatalogVariantTax | null;
}) {
  const taxPercent = Number(tax?.percent ?? 0);
  const effectivePrice = pricing?.effectivePrice ?? fallbackPrice;
  const originalPrice = regularPrice ?? fallbackPrice;
  const explicitDiscountAmount = toPricingNumber(pricing?.discountAmount);
  const originalNumeric = toPricingNumber(originalPrice);
  const effectiveNumeric = toPricingNumber(effectivePrice);
  const computedDiscountAmount =
    originalNumeric !== null && effectiveNumeric !== null && originalNumeric > effectiveNumeric
      ? originalNumeric - effectiveNumeric
      : 0;
  const discountAmount = explicitDiscountAmount ?? computedDiscountAmount;
  const discountPercent = getPricingDiscountPercent({
    discount: pricing?.discount,
    effectivePrice,
    originalPrice,
  });
  const isDiscounted = discountAmount > 0 || Boolean(pricing?.discount);

  return {
    discount: pricing?.discount ?? null,
    discountAmount,
    discountBadge: getPricingDiscountBadge({
      discount: pricing?.discount,
      effectivePrice,
      originalPrice,
    }),
    discountPercent,
    discountSourceLabel: getDiscountSourceLabel(pricing?.discount),
    effectivePrice,
    isDiscounted,
    originalPrice: originalNumeric,
    taxAmount: pricing?.taxAmount ?? 0,
    totalWithTax: pricing?.totalWithTax ?? fallbackPrice,
    taxPercent: Number.isFinite(taxPercent) ? taxPercent : 0,
  };
}

export function getCatalogVariantPricingDisplay({
  discountPercent,
  price,
  pricing,
  salePrice,
  tax,
}: {
  discountPercent?: string | number | null;
  price: string | number | null | undefined;
  pricing?: CatalogVariantPricing | null;
  salePrice?: string | number | null;
  tax?: CatalogVariantTax | null;
}) {
  const regularPrice = toPricingNumber(price);
  const salePriceNumber = toPricingNumber(salePrice);
  const explicitPercent = toPricingNumber(discountPercent);
  let fallbackEffectivePrice: string | number | null | undefined = price;

  if (regularPrice !== null && salePriceNumber !== null && salePriceNumber > 0 && salePriceNumber < regularPrice) {
    fallbackEffectivePrice = salePriceNumber;
  } else if (regularPrice !== null && explicitPercent !== null && explicitPercent > 0) {
    fallbackEffectivePrice = Math.max(regularPrice * (1 - explicitPercent / 100), 0);
  }

  return getCatalogPricingDisplay({
    fallbackPrice: fallbackEffectivePrice,
    pricing,
    regularPrice: price,
    tax,
  });
}
