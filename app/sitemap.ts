import type { MetadataRoute } from "next";
import { listCatalogBrands } from "@/lib/api/services/catalog-variants.service";
import { listPublicPromotions } from "@/lib/api/services/promotions.service";
import { absoluteUrl } from "@/lib/seo/config";
import { listSitemapVariants } from "@/lib/seo/route-data";

export const revalidate = 86400;

const STATIC_ROUTES = [
  "/",
  "/san-pham",
  "/thuong-hieu",
  "/khuyen-mai",
  "/datasheet",
  "/shipping",
  "/warranty",
  "/faq",
  "/privacy",
  "/terms",
];

function sitemapEntry(path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) {
  return {
    changeFrequency,
    lastModified: new Date(),
    priority,
    url: absoluteUrl(path),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_ROUTES.map((path) =>
    sitemapEntry(path, path === "/" ? 1 : 0.7, path === "/" ? "daily" : "weekly"),
  );

  const [variants, brands, promotions] = await Promise.all([
    listSitemapVariants().catch(() => []),
    listCatalogBrands().catch(() => []),
    listPublicPromotions().catch(() => []),
  ]);

  const variantEntries = variants.map((variant) =>
    sitemapEntry(`/san-pham/${variant.slug}`, 0.9, "daily"),
  );
  const brandEntries = brands.map((brand) =>
    sitemapEntry(`/thuong-hieu/${brand.slug}`, 0.8, "weekly"),
  );
  const promotionEntries = promotions.map((promotion) =>
    sitemapEntry(`/khuyen-mai/${promotion.slug}`, 0.7, "daily"),
  );

  return [
    ...staticEntries,
    ...variantEntries,
    ...brandEntries,
    ...promotionEntries,
  ].slice(0, 50000);
}
