export type PricingStatus = "HAS_PRICE" | "CONTACT_FOR_PRICE";

export const DEFAULT_PRICING_STATUS: PricingStatus = "HAS_PRICE";

export function isContactForPrice(pricingStatus?: PricingStatus | string | null) {
  return pricingStatus === "CONTACT_FOR_PRICE";
}

export function getPricingStatusLabel(pricingStatus?: PricingStatus | string | null) {
  return isContactForPrice(pricingStatus) ? "Cần báo giá" : "Có giá";
}

export function getPricingStatusBadgeClass(pricingStatus?: PricingStatus | string | null) {
  return isContactForPrice(pricingStatus)
    ? "border-secondary bg-secondary/30 text-foreground"
    : "border-emerald-600 bg-emerald-600/10 text-emerald-700";
}
