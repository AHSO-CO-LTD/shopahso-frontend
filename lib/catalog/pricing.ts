import type { CatalogVariantPricing, CatalogVariantTax } from "@/lib/catalog/types";

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
  pricing,
  tax,
}: {
  fallbackPrice: string | number | null | undefined;
  pricing?: CatalogVariantPricing | null;
  tax?: CatalogVariantTax | null;
}) {
  const taxPercent = Number(tax?.percent ?? 0);

  return {
    effectivePrice: pricing?.effectivePrice ?? fallbackPrice,
    taxAmount: pricing?.taxAmount ?? 0,
    totalWithTax: pricing?.totalWithTax ?? fallbackPrice,
    taxPercent: Number.isFinite(taxPercent) ? taxPercent : 0,
  };
}
