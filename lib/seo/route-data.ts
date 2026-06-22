import { cache } from "react";
import { ApiError } from "@/lib/api/client";
import {
  getCatalogVariantBySlug,
  listCatalogBrands,
  searchCatalogVariants,
} from "@/lib/api/services/catalog-variants.service";
import { getPublicPromotionBySlug } from "@/lib/api/services/promotions.service";
import type { Brand } from "@/lib/brand/types";
import type { CatalogVariant } from "@/lib/catalog/types";
import type { PublicPromotionDetail } from "@/lib/promotion/types";

function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}

export const getVariantForRoute = cache(async (slug: string): Promise<CatalogVariant | null> => {
  try {
    return await getCatalogVariantBySlug(slug);
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }

    throw error;
  }
});

export const getBrandForRoute = cache(async (slug: string): Promise<Brand | null> => {
  const brands = await listCatalogBrands();
  return brands.find((brand) => brand.slug === slug) ?? null;
});

export const getPromotionForRoute = cache(async (slug: string): Promise<PublicPromotionDetail | null> => {
  try {
    return await getPublicPromotionBySlug(slug);
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }

    throw error;
  }
});

export async function listSitemapVariants(limit = 50000) {
  const pageSize = 100;
  const firstPage = await searchCatalogVariants({
    limit: pageSize,
    page: 1,
    sort: "newest",
  });
  const variants = [...firstPage.items];
  const maxPages = Math.min(firstPage.totalPages, Math.ceil(limit / pageSize));

  for (let page = 2; page <= maxPages && variants.length < limit; page += 1) {
    const response = await searchCatalogVariants({
      limit: pageSize,
      page,
      sort: "newest",
    });
    variants.push(...response.items);
  }

  return variants.slice(0, limit);
}
