import type { CatalogVariantEngagement } from "@/lib/catalog/types";

export function getVariantEngagementMetrics(variant: CatalogVariantEngagement) {
  const ratingAverage = Number(variant.rating?.average ?? variant.ratingAverage ?? 5);
  const ratingCount = Number(variant.rating?.count ?? variant.ratingCount ?? 0);
  const viewCount = Number(variant.viewCount ?? 0);
  const orderCount = Number(variant.orderCount ?? 0);

  return {
    orderCount: Number.isFinite(orderCount) ? Math.max(orderCount, 0) : 0,
    ratingAverage: Number.isFinite(ratingAverage) ? ratingAverage : 5,
    ratingCount: Number.isFinite(ratingCount) ? Math.max(ratingCount, 0) : 0,
    viewCount: Number.isFinite(viewCount) ? Math.max(viewCount, 0) : 0,
  };
}
