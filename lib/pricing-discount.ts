export type PricingDiscountSource =
  | "PROMOTION"
  | "VARIANT_SALE_PRICE"
  | "VARIANT_DISCOUNT_PERCENT"
  | string;

export type PricingDiscountType = "PERCENT" | "FIXED_AMOUNT" | string;

export type PricingDiscountPromotion = {
  id: string;
  name: string;
  slug: string;
  bannerImageUrl?: string | null;
  bannerLinkUrl?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type PricingDiscount = {
  source?: PricingDiscountSource | null;
  type?: PricingDiscountType | null;
  value?: string | number | null;
  promotion?: PricingDiscountPromotion | null;
};

export function toPricingNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

export function getDiscountSourceLabel(discount?: PricingDiscount | null) {
  switch (discount?.source) {
    case "PROMOTION":
      return discount.promotion?.name ? `Khuyến mãi: ${discount.promotion.name}` : "Khuyến mãi";
    case "VARIANT_SALE_PRICE":
      return "Giá sale";
    case "VARIANT_DISCOUNT_PERCENT":
      return "Giảm trực tiếp";
    default:
      return discount ? "Ưu đãi" : "";
  }
}

export function getDiscountPercentFromPrices(
  originalPrice: string | number | null | undefined,
  effectivePrice: string | number | null | undefined,
) {
  const original = toPricingNumber(originalPrice);
  const effective = toPricingNumber(effectivePrice);

  if (original === null || effective === null || original <= 0 || effective >= original) {
    return null;
  }

  return Math.round(((original - effective) / original) * 100);
}

export function getPricingDiscountPercent({
  discount,
  effectivePrice,
  originalPrice,
}: {
  discount?: PricingDiscount | null;
  effectivePrice: string | number | null | undefined;
  originalPrice: string | number | null | undefined;
}) {
  const explicitValue = toPricingNumber(discount?.value);

  if (discount?.type === "PERCENT" && explicitValue !== null && explicitValue > 0) {
    return Math.round(explicitValue);
  }

  return getDiscountPercentFromPrices(originalPrice, effectivePrice);
}

export function getPricingDiscountBadge({
  discount,
  effectivePrice,
  originalPrice,
}: {
  discount?: PricingDiscount | null;
  effectivePrice: string | number | null | undefined;
  originalPrice: string | number | null | undefined;
}) {
  const percent = getPricingDiscountPercent({ discount, effectivePrice, originalPrice });

  if (percent !== null && percent > 0) {
    return `-${percent}%`;
  }

  return discount ? "Ưu đãi" : "";
}
