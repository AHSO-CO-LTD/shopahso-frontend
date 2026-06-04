import type { BannerPlacement } from "@/lib/banner/types";

export const BANNER_PLACEMENTS: BannerPlacement[] = ["HOMEPAGE", "PROMOTION", "FLOATING"];

export function getBannerPlacementLabel(placement: BannerPlacement | string) {
  switch (placement) {
    case "HOMEPAGE":
      return "Trang chủ";
    case "PROMOTION":
      return "Trang khuyến mãi";
    case "FLOATING":
      return "Floating";
    default:
      return placement;
  }
}
