import type { BannerPlacement } from "@/lib/banner/types";

export type BannerStandard = {
  aspectClass: string;
  aspectRatio: number;
  height: number;
  maxSizeBytes: number;
  maxSizeLabel: string;
  ratioLabel: string;
  width: number;
};

const MAX_BANNER_IMAGE_SIZE = 8 * 1024 * 1024;

export const HOMEPAGE_BANNER_STANDARD = {
  aspectClass: "aspect-[1983/793]",
  aspectRatio: 1983 / 793,
  height: 793,
  maxSizeBytes: MAX_BANNER_IMAGE_SIZE,
  maxSizeLabel: "8MB",
  ratioLabel: "2.50:1",
  width: 1983,
} as const satisfies BannerStandard;

export const FLOATING_BANNER_STANDARD = {
  aspectClass: "aspect-[4/3]",
  aspectRatio: 4 / 3,
  height: 540,
  maxSizeBytes: MAX_BANNER_IMAGE_SIZE,
  maxSizeLabel: "8MB",
  ratioLabel: "4:3",
  width: 720,
} as const satisfies BannerStandard;

export const PROMOTION_BANNER_STANDARD = HOMEPAGE_BANNER_STANDARD;

export function getBannerStandard(placement: BannerPlacement): BannerStandard {
  if (placement === "FLOATING") {
    return FLOATING_BANNER_STANDARD;
  }

  if (placement === "PROMOTION") {
    return PROMOTION_BANNER_STANDARD;
  }

  return HOMEPAGE_BANNER_STANDARD;
}

export function formatBannerStandard(placement: BannerPlacement = "HOMEPAGE") {
  const standard = getBannerStandard(placement);
  return `${standard.width} x ${standard.height}px, tỷ lệ ${standard.ratioLabel}`;
}
